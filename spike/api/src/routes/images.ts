import fs from "node:fs/promises";
import { Hono } from "hono";
import { db } from "../db/client.js";
import { newPublicId } from "../lib/ids.js";
import {
  imageRowReferenced,
  setImagesUnusedPool,
} from "../lib/image-pool.js";
import { absoluteUploadPath, assertSafePathSegment } from "../lib/paths.js";
import {
  processAndStoreImage,
  regenerateSquareFromMaster,
  replaceStoredSquare,
} from "../lib/process-image.js";
import { requireUser } from "../lib/session.js";

export const ownerImageRoutes = new Hono();

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Content-Type 欠落でも拡張子で画像扱い（FormData 経由の空 type 対策） */
function isImageUpload(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
}

function truthyFormFlag(value: unknown): boolean {
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  return false;
}

function bareMediaUrl(url: string): string {
  return url.split("?")[0].split("#")[0];
}

/** 投稿の images_json 内の旧 square URL を新 URL に置換（再クロップ即反映） */
function rewriteImageUrlsInPosts(oldUrls: string[], newUrl: string) {
  const oldBare = new Set(
    oldUrls.map(bareMediaUrl).filter((u) => u && u !== bareMediaUrl(newUrl)),
  );
  if (!oldBare.size) return;

  for (const table of ["coordinates", "items"] as const) {
    const rows = db
      .prepare(`SELECT id, images_json FROM ${table}`)
      .all() as Array<{ id: string; images_json: string }>;
    for (const row of rows) {
      let imgs: unknown;
      try {
        imgs = JSON.parse(row.images_json || "[]");
      } catch {
        continue;
      }
      if (!Array.isArray(imgs)) continue;
      let changed = false;
      const next = imgs.map((raw) => {
        if (typeof raw !== "string") return raw;
        if (oldBare.has(bareMediaUrl(raw))) {
          changed = true;
          return newUrl;
        }
        return raw;
      });
      if (changed) {
        db.prepare(`UPDATE ${table} SET images_json = ? WHERE id = ?`).run(
          JSON.stringify(next),
          row.id,
        );
      }
    }
  }
}

ownerImageRoutes.post("/", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const body = await c.req.parseBody({ all: true });
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "file_required" }, 400);
  }
  if (!isImageUpload(file)) {
    return c.json({ error: "not_image" }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: "too_large", max_bytes: MAX_UPLOAD_BYTES }, 400);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const squareFile = body["square"];
  let squareBuf: Buffer | undefined;
  if (squareFile instanceof File) {
    if (!isImageUpload(squareFile)) {
      return c.json({ error: "square_not_image" }, 400);
    }
    if (squareFile.size > MAX_UPLOAD_BYTES) {
      return c.json({ error: "square_too_large", max_bytes: MAX_UPLOAD_BYTES }, 400);
    }
    squareBuf = Buffer.from(await squareFile.arrayBuffer());
  }
  const imageId = newPublicId(10);
  // 未使用整理からのアップロードだけプール入り。投稿クロップは入れない
  const inUnusedPool = truthyFormFlag(body["unused"]) ? 1 : 0;

  try {
    const processed = await processAndStoreImage({
      ownerId: user.id,
      imageId,
      input: buf,
      squareInput: squareBuf,
    });

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO images (
        id, owner_id, master_url, square_url, width, height, bytes,
        in_unused_pool, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      processed.id,
      user.id,
      processed.master_url,
      processed.square_url,
      processed.width,
      processed.height,
      processed.bytes,
      inUnusedPool,
      now,
    );

    return c.json(
      {
        id: processed.id,
        master_url: processed.master_url,
        square_url: processed.square_url,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
        in_unused_pool: inUnusedPool === 1,
        // 投稿の image_urls には当面 square（一覧表示）を使う想定
        url: processed.square_url,
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_image") {
      return c.json({ error: "invalid_image" }, 400);
    }
    throw e;
  }
});

ownerImageRoutes.get("/", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const rows = db
    .prepare(
      `SELECT id, master_url, square_url, width, height, bytes, created_at
       FROM images
       WHERE owner_id = ? AND in_unused_pool = 1
       ORDER BY created_at DESC LIMIT 100`,
    )
    .all(user.id) as Array<{
    id: string;
    master_url: string;
    square_url: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
  }>;

  // 投稿に載っているものは未使用に出さない（外して未保存の間はフラグだけ残す）
  const unused = rows.filter(
    (r) => !imageRowReferenced(user.id, r.id, r.master_url, r.square_url),
  );

  return c.json({
    data: unused.map((r) => ({
      ...r,
      url: r.square_url,
    })),
  });
});

/** POST /api/owner/images/:id/park — 投稿から外した画像を未使用プールへ */
ownerImageRoutes.post("/:id/park", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const id = c.req.param("id");
  const row = db
    .prepare(
      `SELECT id, owner_id, master_url, square_url FROM images WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        owner_id: string;
        master_url: string;
        square_url: string;
      }
    | undefined;

  if (!row || row.owner_id !== user.id) {
    return c.json({ error: "not_found" }, 404);
  }

  setImagesUnusedPool(user.id, [id], true);
  return c.json({
    id: row.id,
    master_url: row.master_url,
    square_url: row.square_url,
    url: row.square_url,
    in_unused_pool: true,
  });
});

function loadOwnedImageRow(userId: string, id: string) {
  try {
    assertSafePathSegment(userId);
    assertSafePathSegment(id);
  } catch {
    return null;
  }
  const row = db
    .prepare(
      `SELECT id, owner_id, master_url, square_url FROM images WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        owner_id: string;
        master_url: string;
        square_url: string;
      }
    | undefined;

  if (!row) {
    return null;
  }
  if (row.owner_id !== userId) return null;
  return row;
}

async function ensureOwnedImageRow(userId: string, id: string) {
  // 所有は DB 行のみ。ファイル存在だけで行を作ると ID 改ざんで他人領域を触れる。
  return loadOwnedImageRow(userId, id);
}

/** POST /api/owner/images/:id/square/reset — マスターから初期正方形を再生成 */
ownerImageRoutes.post("/:id/square/reset", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const id = c.req.param("id");
  const row = await ensureOwnedImageRow(user.id, id);
  if (!row) return c.json({ error: "not_found" }, 404);

  try {
    const oldSquare = row.square_url;
    const replaced = await regenerateSquareFromMaster({
      ownerId: user.id,
      imageId: id,
    });
    db.prepare(`UPDATE images SET square_url = ? WHERE id = ?`).run(
      replaced.square_url,
      id,
    );
    rewriteImageUrlsInPosts(
      [oldSquare, ...replaced.previous_candidates],
      replaced.square_url,
    );
    return c.json({
      id: row.id,
      master_url: row.master_url,
      square_url: replaced.square_url,
      url: replaced.square_url,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_image") {
      return c.json({ error: "invalid_image" }, 400);
    }
    throw e;
  }
});

/** PUT /api/owner/images/:id/square — マスター維持のまま表示用正方形だけ差し替え */
ownerImageRoutes.put("/:id/square", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const id = c.req.param("id");
  const row = await ensureOwnedImageRow(user.id, id);
  if (!row) return c.json({ error: "not_found" }, 404);

  const body = await c.req.parseBody({ all: true });
  const file = body["file"] ?? body["square"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "file_required" }, 400);
  }
  if (!isImageUpload(file)) {
    return c.json({ error: "not_image" }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: "too_large", max_bytes: MAX_UPLOAD_BYTES }, 400);
  }

  try {
    const oldSquare = row.square_url;
    const replaced = await replaceStoredSquare({
      ownerId: user.id,
      imageId: id,
      squareInput: Buffer.from(await file.arrayBuffer()),
    });
    db.prepare(`UPDATE images SET square_url = ? WHERE id = ?`).run(
      replaced.square_url,
      id,
    );
    // 投稿が古い square URL を指したままにならないよう差し替え
    rewriteImageUrlsInPosts(
      [oldSquare, ...replaced.previous_candidates],
      replaced.square_url,
    );
    return c.json({
      id: row.id,
      master_url: row.master_url,
      square_url: replaced.square_url,
      url: replaced.square_url,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_image") {
      return c.json({ error: "invalid_image" }, 400);
    }
    throw e;
  }
});

/** DELETE /api/owner/images/:id — 未使用プールから削除（投稿参照中は 409） */
ownerImageRoutes.delete("/:id", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const id = c.req.param("id");
  const row = db
    .prepare(
      `SELECT id, owner_id, master_url, square_url FROM images WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        owner_id: string;
        master_url: string;
        square_url: string;
      }
    | undefined;

  if (!row || row.owner_id !== user.id) {
    return c.json({ error: "not_found" }, 404);
  }

  if (imageRowReferenced(user.id, id, row.master_url, row.square_url)) {
    return c.json({ error: "in_use" }, 409);
  }

  db.prepare(`DELETE FROM images WHERE id = ? AND owner_id = ?`).run(
    id,
    user.id,
  );

  const dir = absoluteUploadPath(user.id, id);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    /* ファイルが無くても DB 削除は成功扱い */
  }

  return c.body(null, 204);
});

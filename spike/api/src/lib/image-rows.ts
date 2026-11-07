import fs from "node:fs";
import { db } from "../db/client.js";
import { absoluteUploadPath } from "./paths.js";

/** `/media/{ownerId}/{imageId}/…` から owner と imageId を取る */
export function parseMediaImageRef(
  url: string,
): { ownerId: string; imageId: string } | null {
  const m = url.match(/^\/media\/([^/]+)\/([^/]+)\//);
  if (!m) return null;
  return { ownerId: m[1]!, imageId: m[2]! };
}

/**
 * 投稿の images_json に載っているメディアを images 行へ補完する。
 * seed-real はディスク保存のみで行を作らないことがあるため、管理の画像数ズレを防ぐ。
 */
export function backfillImageRowsFromPosts(): number {
  const rows = db
    .prepare(
      `SELECT images_json FROM items
       UNION ALL
       SELECT images_json FROM coordinates`,
    )
    .all() as Array<{ images_json: string }>;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO images (
      id, owner_id, master_url, square_url, width, height, bytes,
      in_unused_pool, created_at
    ) VALUES (?, ?, ?, ?, 0, 0, ?, 0, ?)`,
  );

  const seen = new Set<string>();
  let inserted = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    let urls: unknown;
    try {
      urls = JSON.parse(row.images_json || "[]");
    } catch {
      continue;
    }
    if (!Array.isArray(urls)) continue;
    for (const raw of urls) {
      if (typeof raw !== "string") continue;
      const ref = parseMediaImageRef(raw);
      if (!ref) continue;
      const key = `${ref.ownerId}/${ref.imageId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const masterPath = absoluteUploadPath(
        ref.ownerId,
        ref.imageId,
        "master.jpg",
      );
      if (!fs.existsSync(masterPath)) continue;
      const bytes = fs.statSync(masterPath).size;
      const master_url = `/media/${ref.ownerId}/${ref.imageId}/master.jpg`;
      const square_url = `/media/${ref.ownerId}/${ref.imageId}/square.jpg`;
      const info = insert.run(
        ref.imageId,
        ref.ownerId,
        master_url,
        square_url,
        bytes,
        now,
      );
      if (info.changes > 0) inserted += 1;
    }
  }
  return inserted;
}

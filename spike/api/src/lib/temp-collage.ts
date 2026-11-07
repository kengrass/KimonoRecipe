import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getLinkedItems, getCoordinateById, type CoordinateRow } from "./coordinates.js";
import { toPublicItem } from "./items.js";
import { absoluteUploadPath, mediaUrl, UPLOAD_DIR } from "./paths.js";
import { db } from "../db/client.js";

const OUTPUT_SIZE = 800;
const GAP = 4;
const MAX_ITEMS = 9;
const NAVY = { r: 0x1c, g: 0x35, b: 0x50, alpha: 1 };
const CELL_BG = { r: 0xe8, g: 0xec, b: 0xef, alpha: 1 };

/** アイテム未紐付けの仮コーデに載せる通常画像 URL（frontend/public） */
export const TEMP_COORDINATE_PLACEHOLDER_URL =
  "/mock/temp-coordinate-placeholder.png";

function collageGridForCount(count: number): 2 | 3 {
  return count <= 4 ? 2 : 3;
}

function mediaUrlToAbsolute(url: string): string | null {
  const bare = url.split("?")[0].split("#")[0];
  if (!bare.startsWith("/media/")) return null;
  const rel = bare.slice("/media/".length);
  const abs = path.normalize(path.join(UPLOAD_DIR, rel));
  if (!abs.startsWith(UPLOAD_DIR + path.sep) && abs !== UPLOAD_DIR) {
    return null;
  }
  return abs;
}

async function loadBuffer(url: string): Promise<Buffer | null> {
  const local = mediaUrlToAbsolute(url);
  if (local) {
    try {
      return await fs.readFile(local);
    } catch {
      return null;
    }
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 紐付けアイテム画像から正方形コラージュ JPEG を生成（フロントの仮コーデ合成と同型）。
 */
export async function renderItemCollage(urls: string[]): Promise<Buffer | null> {
  const list = urls.filter(Boolean).slice(0, MAX_ITEMS);
  if (!list.length) return null;

  const grid = collageGridForCount(list.length);
  const cells = grid * grid;
  const cell = (OUTPUT_SIZE - GAP * (grid + 1)) / grid;

  const buffers = await Promise.all(list.map((u) => loadBuffer(u)));

  const layers: sharp.OverlayOptions[] = [];

  for (let i = 0; i < cells; i++) {
    const col = i % grid;
    const row = Math.floor(i / grid);
    const x = Math.round(GAP + col * (cell + GAP));
    const y = Math.round(GAP + row * (cell + GAP));
    const cw = Math.round(cell);
    const ch = Math.round(cell);

    const cellBg = await sharp({
      create: { width: cw, height: ch, channels: 3, background: CELL_BG },
    })
      .jpeg()
      .toBuffer();
    layers.push({ input: cellBg, left: x, top: y });

    const buf = buffers[i];
    if (!buf) continue;
    try {
      const meta = await sharp(buf, { failOn: "none" }).metadata();
      const iw = meta.width ?? 0;
      const ih = meta.height ?? 0;
      if (iw < 1 || ih < 1) continue;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = Math.max(1, Math.round(iw * scale));
      const dh = Math.max(1, Math.round(ih * scale));
      const cropped = await sharp(buf, { failOn: "none" })
        .rotate()
        .resize({ width: dw, height: dh, fit: "fill" })
        .extract({
          left: Math.max(0, Math.floor((dw - cw) / 2)),
          top: Math.max(0, Math.floor((dh - ch) / 2)),
          width: cw,
          height: ch,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      layers.push({ input: cropped, left: x, top: y });
    } catch {
      // skip broken tile
    }
  }

  return sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 3,
      background: NAVY,
    },
  })
    .composite(layers)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

/**
 * 仮コーデなら紐付けから合成し `images_json` を更新。アイテム0なら画像を空に。
 * 本コーデ（is_temp=0）は触らない。
 */
export async function refreshTempCollage(
  coordinateId: string,
): Promise<CoordinateRow | null> {
  const row = getCoordinateById(coordinateId);
  if (!row || !row.is_temp) return row;

  const items = getLinkedItems(coordinateId);
  const urls = items
    .map((item) => toPublicItem(item).image_url)
    .filter(Boolean);

  if (!urls.length) {
    db.prepare(
      `UPDATE coordinates SET images_json = ?, updated_at = ? WHERE id = ?`,
    ).run(
      JSON.stringify([TEMP_COORDINATE_PLACEHOLDER_URL]),
      new Date().toISOString(),
      coordinateId,
    );
    return getCoordinateById(coordinateId);
  }

  const jpeg = await renderItemCollage(urls);
  if (!jpeg) {
    return getCoordinateById(coordinateId);
  }

  const dir = absoluteUploadPath(row.owner_id, `coord-${coordinateId}`);
  await fs.mkdir(dir, { recursive: true });
  // Next/Image はローカル画像の ?query を拒否するので、ファイル名でキャッシュバストする
  const stamp = Date.now();
  const fileName = `collage-${stamp}.jpg`;
  await fs.writeFile(path.join(dir, fileName), jpeg);
  const url = mediaUrl(path.join(row.owner_id, `coord-${coordinateId}`, fileName));
  const now = new Date(stamp).toISOString();

  // 旧 collage*.jpg を掃除（最新以外）
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((f) => f.startsWith("collage") && f !== fileName)
        .map((f) => fs.rm(path.join(dir, f), { force: true })),
    );
  } catch {
    /* ignore */
  }

  db.prepare(
    `UPDATE coordinates SET images_json = ?, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify([url]), now, coordinateId);

  return getCoordinateById(coordinateId);
}

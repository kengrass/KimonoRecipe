import { canvasToObjectUrl, loadImage } from "@/lib/canvas-image";

/** 仮コーデ：紐付けアイテムから合成サムネを作るときの上限 */
export const TEMP_COORDINATE_ITEM_MAX = 9;

const OUTPUT_SIZE = 800;
const GAP = 4;
const NAVY = "#1c3550";
const CELL_BG = "#e8ecef";

/** 1〜4 → 2×2、5〜9 → 3×3（ItemCollageThumb と同型） */
export function collageGridForCount(count: number): 2 | 3 {
  return count <= 4 ? 2 : 3;
}

/**
 * 紐付けアイテム画像を1枚の合成JPEG（object URL）にする。
 * 編集画面・固定化用。
 */
export async function renderItemCollageToObjectUrl(
  urls: string[],
): Promise<string | null> {
  const list = urls.filter(Boolean).slice(0, TEMP_COORDINATE_ITEM_MAX);
  if (!list.length) return null;

  const grid = collageGridForCount(list.length);
  const cells = grid * grid;
  const cell = (OUTPUT_SIZE - GAP * (grid + 1)) / grid;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const images = await Promise.all(
    list.map((src) => loadImage(src).catch(() => null)),
  );

  for (let i = 0; i < cells; i++) {
    const col = i % grid;
    const row = Math.floor(i / grid);
    const x = GAP + col * (cell + GAP);
    const y = GAP + row * (cell + GAP);
    ctx.fillStyle = CELL_BG;
    ctx.fillRect(x, y, cell, cell);
    const img = images[i];
    if (!img) continue;
    const scale = Math.max(cell / img.naturalWidth, cell / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (cell - dw) / 2;
    const dy = y + (cell - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cell, cell);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  return canvasToObjectUrl(canvas);
}

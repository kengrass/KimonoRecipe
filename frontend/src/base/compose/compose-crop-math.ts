import {
  CROP_ZOOM_MAX,
  CROP_ZOOM_MIN,
} from "@/base/compose/ImageCropToolbar";
import { fitScaleFor, rotatedSize } from "@/base/compose/renderSquareImage";
import type { ComposeCropState } from "@/lib/compose-preset";

/** ダイアログ枠の正規化。壊れた値は null */
export function normalizeCropState(
  crop: ComposeCropState | null | undefined,
): ComposeCropState | null {
  if (!crop) return null;
  const zoom = Number(crop.zoom);
  const ox = Number(crop.offsetXRatio);
  const oy = Number(crop.offsetYRatio);
  const rotation = Number(crop.rotation);
  if (![zoom, ox, oy, rotation].every((n) => Number.isFinite(n))) return null;
  return {
    zoom: Math.min(CROP_ZOOM_MAX, Math.max(CROP_ZOOM_MIN, zoom)),
    offsetXRatio: ox,
    offsetYRatio: oy,
    rotation: ((rotation % 360) + 360) % 360,
    flipHorizontal: Boolean(crop.flipHorizontal),
  };
}

/** ステージ座標のパンを画像が枠外に消えない範囲へ */
export function clampCropOffset(
  x: number,
  y: number,
  zoom: number,
  rotation: number,
  natural: { w: number; h: number },
  stageSize: number,
) {
  if (stageSize < 1) return { x: 0, y: 0 };
  const fit = fitScaleFor(natural.w, natural.h, rotation, stageSize);
  const scale = fit * zoom;
  const { width, height } = rotatedSize(natural.w, natural.h, rotation);
  const dispW = width * scale;
  const dispH = height * scale;
  const maxX = Math.abs(dispW - stageSize) / 2;
  const maxY = Math.abs(dispH - stageSize) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

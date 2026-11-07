import { canvasToObjectUrl, loadImage } from "@/lib/canvas-image";

const PAD_COLOR = "#f5f5f5";
const OUTPUT_SIZE = 800;

/** ダイアログ初期と同じ「全体収め」正方形をマスターから焼く */
export async function renderMasterFitSquare(masterSrc: string): Promise<string> {
  return renderViewportSquare({
    src: masterSrc,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    flipHorizontal: false,
    stageSize: OUTPUT_SIZE,
  });
}

export type SquareViewport = {
  src: string;
  /** 1 = 全体収め。大きいほどクローズアップ */
  zoom: number;
  /** ステージ座標でのパン（正方形中心原点） */
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipHorizontal: boolean;
  /** プレビュー正方形の一辺（px）。パン制約・書き出し比率用 */
  stageSize: number;
};

export function rotatedSize(iw: number, ih: number, rotation: number) {
  const quarter = Math.abs(rotation % 180) === 90;
  return quarter
    ? { width: ih, height: iw }
    : { width: iw, height: ih };
}

/** ステージに全体が収まるスケール */
export function fitScaleFor(
  iw: number,
  ih: number,
  rotation: number,
  stageSize: number,
) {
  const { width, height } = rotatedSize(iw, ih, rotation);
  return Math.min(stageSize / width, stageSize / height);
}

/**
 * プレビューと同じ見え方で正方形 JPEG を焼く。
 * zoom=1 なら余白つき全体収め、zoom>1 なら枠内のクローズアップ。
 */
export async function renderViewportSquare(
  params: SquareViewport,
): Promise<string> {
  const {
    src,
    zoom,
    offsetX,
    offsetY,
    rotation,
    flipHorizontal,
    stageSize,
  } = params;
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d unavailable");

  ctx.fillStyle = PAD_COLOR;
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const fit = fitScaleFor(iw, ih, rotation, stageSize);
  const scale = fit * Math.max(1, zoom);
  const ratio = OUTPUT_SIZE / stageSize;
  const rad = ((rotation % 360) * Math.PI) / 180;

  ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
  ctx.translate(offsetX * ratio, offsetY * ratio);
  ctx.rotate(rad);
  if (flipHorizontal) ctx.scale(-1, 1);
  ctx.drawImage(
    img,
    (-iw * scale * ratio) / 2,
    (-ih * scale * ratio) / 2,
    iw * scale * ratio,
    ih * scale * ratio,
  );

  return canvasToObjectUrl(canvas);
}

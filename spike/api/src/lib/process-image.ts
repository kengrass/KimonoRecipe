import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { absoluteUploadPath, mediaUrl } from "./paths.js";

/** マスター長辺上限（試作） */
export const MASTER_MAX_EDGE = 2048;
/** 表示用正方形 */
export const SQUARE_SIZE = 800;

/** クライアント焼き込み正方形を保存用に整える（再クロップしない） */
async function encodeClientSquare(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const base = sharp(input, { failOn: "none" }).rotate();
  if (w === SQUARE_SIZE && h === SQUARE_SIZE) {
    return base.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  }
  // 既に正方形意図の出力。cover で切り直すと fit／寄りを壊すので fill のみ
  return base
    .resize(SQUARE_SIZE, SQUARE_SIZE, { fit: "fill" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export type ProcessedImage = {
  id: string;
  master_url: string;
  square_url: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * 生ファイルは残さず、メタ削除＋長辺制限のマスターと正方形表示用を作る。
 * `squareInput` があればクライアント焼き込み正方形を採用（マスターは原寸処理のまま）。
 */
export async function processAndStoreImage(opts: {
  ownerId: string;
  imageId: string;
  input: Buffer;
  /** 任意。トリミング確定後の正方形 JPEG など */
  squareInput?: Buffer;
}): Promise<ProcessedImage> {
  const dir = absoluteUploadPath(opts.ownerId, opts.imageId);
  await fs.mkdir(dir, { recursive: true });

  const pipeline = sharp(opts.input, { failOn: "none" }).rotate(); // Exif 向きを焼き込み
  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 1 || h < 1) {
    throw new Error("invalid_image");
  }

  const masterPath = path.join(dir, "master.jpg");
  const squarePath = path.join(dir, "square.jpg");

  // マスター: 向き適用済み・メタなし・長辺制限・JPEG
  const master = sharp(opts.input, { failOn: "none" }).rotate().resize({
    width: MASTER_MAX_EDGE,
    height: MASTER_MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });

  // sharp 既定で出力メタは載せない（Exif 等は残さない）
  const masterBuf = await master
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  await fs.writeFile(masterPath, masterBuf.data);

  // クライアント焼き込みは再クロップしない。
  // 未指定時はダイアログ初期／リセットと同じ全体収め（contain＋余白）
  const squareBuf = opts.squareInput
    ? await encodeClientSquare(opts.squareInput)
    : await sharp(masterBuf.data)
        .resize({
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          fit: "contain",
          background: { r: 0xf5, g: 0xf5, b: 0xf5, alpha: 1 },
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

  await fs.writeFile(squarePath, squareBuf);

  const relMaster = path.join(opts.ownerId, opts.imageId, "master.jpg");
  const relSquare = path.join(opts.ownerId, opts.imageId, "square.jpg");

  return {
    id: opts.imageId,
    master_url: mediaUrl(relMaster),
    square_url: mediaUrl(relSquare),
    width: masterBuf.info.width,
    height: masterBuf.info.height,
    bytes: masterBuf.data.length,
  };
}

/**
 * 既存マスターはそのまま、表示用正方形だけ差し替え（再クロップ）。
 * URL は square-{stamp}.jpg（キャッシュ避け）。互換で square.jpg にも同じ内容を書く。
 */
export async function replaceStoredSquare(opts: {
  ownerId: string;
  imageId: string;
  squareInput: Buffer;
}): Promise<{ square_url: string; previous_candidates: string[] }> {
  const dir = absoluteUploadPath(opts.ownerId, opts.imageId);
  await fs.mkdir(dir, { recursive: true });

  const squareBuf = await encodeClientSquare(opts.squareInput);
  const stamp = Date.now();
  const stampedName = `square-${stamp}.jpg`;
  const stampedPath = path.join(dir, stampedName);

  const previous_candidates: string[] = [
    mediaUrl(path.join(opts.ownerId, opts.imageId, "square.jpg")),
  ];
  try {
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f === stampedName) continue;
      if (f === "square.jpg" || /^square-\d+\.jpe?g$/i.test(f)) {
        previous_candidates.push(
          mediaUrl(path.join(opts.ownerId, opts.imageId, f)),
        );
        // square.jpg は後で上書きするので消さない
        if (f !== "square.jpg") {
          await fs.rm(path.join(dir, f), { force: true });
        }
      }
    }
  } catch {
    /* ignore */
  }

  await fs.writeFile(stampedPath, squareBuf);
  await fs.writeFile(path.join(dir, "square.jpg"), squareBuf);

  return {
    square_url: mediaUrl(path.join(opts.ownerId, opts.imageId, stampedName)),
    previous_candidates: [...new Set(previous_candidates)],
  };
}

/** マスターから全体収め（余白つき）正方形を作り直す（トリミング・リセット） */
export async function regenerateSquareFromMaster(opts: {
  ownerId: string;
  imageId: string;
}): Promise<{ square_url: string; previous_candidates: string[] }> {
  const masterPath = absoluteUploadPath(
    opts.ownerId,
    opts.imageId,
    "master.jpg",
  );
  const masterBuf = await fs.readFile(masterPath);
  const fitted = await sharp(masterBuf, { failOn: "none" })
    .rotate()
    .resize({
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      fit: "contain",
      background: { r: 0xf5, g: 0xf5, b: 0xf5, alpha: 1 },
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return replaceStoredSquare({
    ownerId: opts.ownerId,
    imageId: opts.imageId,
    squareInput: fitted,
  });
}

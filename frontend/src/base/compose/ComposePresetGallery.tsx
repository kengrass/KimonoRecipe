"use client";

import { ComposeTileImage } from "@/base/compose/ComposeTileImage";
import type { ComposePresetImage } from "@/lib/compose-preset";

type Props = {
  images: ComposePresetImage[];
  onRemove?: (id: string) => void;
  /** 並べ替えモード：前後に移動 */
  reorderMode?: boolean;
  onMove?: (id: string, direction: -1 | 1) => void;
  /** 再トリミング */
  onRecrop?: (image: ComposePresetImage) => void;
  emptyHint?: string;
};

/** 投稿画面にプリセットされた画像のタイル（3列・正方形） */
export function ComposePresetGallery({
  images,
  onRemove,
  reorderMode = false,
  onMove,
  onRecrop,
  emptyHint = "まだ画像が選ばれていません",
}: Props) {
  if (!images.length) {
    return (
      <p className="text-center text-xs text-kr-muted">{emptyHint}</p>
    );
  }

  return (
    <ul
      className="grid grid-cols-3"
      style={{ gap: "var(--kr-tile-gap)" }}
    >
      {images.map((image, index) => (
        <li key={image.id} className="relative">
          <span className="tile-thumb tile-thumb--contain">
            {/* contain: 全体収め（fit）のトリミング結果／マスター戻しも切らず見える */}
            <ComposeTileImage src={image.src} alt={image.alt} fit="contain" />
          </span>
          {reorderMode && onMove ? (
            <>
              <span className="tile-overlay-badge absolute left-1 top-1 z-10 px-1.5 py-0.5 text-[10px]">
                {index === 0 ? "サムネ" : index + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 z-10 flex gap-0.5 p-1">
                <button
                  type="button"
                  disabled={index === 0}
                  className="tile-overlay-btn h-7 flex-1 text-xs disabled:opacity-30"
                  aria-label={`${image.alt}を前へ`}
                  onClick={() => onMove(image.id, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  className="tile-overlay-btn h-7 flex-1 text-xs disabled:opacity-30"
                  aria-label={`${image.alt}を後ろへ`}
                  onClick={() => onMove(image.id, 1)}
                >
                  →
                </button>
              </div>
            </>
          ) : (
            <>
              {onRemove ? (
                <button
                  type="button"
                  className="tile-overlay-btn absolute right-1 top-1 z-10 h-5 w-5"
                  aria-label={`${image.alt}を外す`}
                  onClick={() => onRemove(image.id)}
                >
                  <CloseGlyph />
                </button>
              ) : null}
              {onRecrop ? (
                <button
                  type="button"
                  className="tile-overlay-btn absolute bottom-1 right-1 z-10 h-5 w-5"
                  onClick={() => onRecrop(image)}
                  aria-label={`${image.alt}をトリミング`}
                >
                  <CropGlyph />
                </button>
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-2.5 w-2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M3 3l6 6M9 3L3 9" strokeLinecap="round" />
    </svg>
  );
}

function CropGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M5 2v9h9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14V5H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

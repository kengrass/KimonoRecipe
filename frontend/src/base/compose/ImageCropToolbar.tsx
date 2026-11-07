"use client";

import type { ReactNode } from "react";

export const CROP_ZOOM_MIN = 1;
export const CROP_ZOOM_MAX = 4;

function ToolIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium tracking-wide transition ${
        active
          ? "bg-kr-navy text-white"
          : "text-kr-text hover:bg-neutral-100"
      }`}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5" aria-hidden>
        {children}
      </span>
      <span>{label}</span>
    </button>
  );
}

type Props = {
  zoom: number;
  flipHorizontal: boolean;
  onZoomChange: (next: number) => void;
  onRotate90: () => void;
  onToggleFlip: () => void;
  onResetFrame: () => void;
};

/** クロップダイアログ下部：ズーム＋回転／反転／リセット */
export function ImageCropToolbar({
  zoom,
  flipHorizontal,
  onZoomChange,
  onRotate90,
  onToggleFlip,
  onResetFrame,
}: Props) {
  return (
    <div className="mx-auto mt-3 w-full max-w-[min(24rem,calc(100dvh-16rem))] space-y-2.5">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-[11px] text-kr-muted">
          <span>全体</span>
          <span className="tabular-nums text-kr-text">{zoom.toFixed(1)}×</span>
          <span>寄る</span>
        </div>
        <input
          type="range"
          min={CROP_ZOOM_MIN}
          max={CROP_ZOOM_MAX}
          step={0.05}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-full accent-kr-navy"
          aria-label="ズーム"
          aria-valuetext={
            zoom <= CROP_ZOOM_MIN + 0.02
              ? "全体"
              : `クローズアップ ${zoom.toFixed(2)}`
          }
        />
      </div>

      <div
        role="toolbar"
        aria-label="画像の調整"
        className="flex gap-0.5 rounded-xl border border-kr-border bg-neutral-50/80 p-1"
      >
        <ToolIconButton label="90°回転" onClick={onRotate90}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12a8 8 0 0 1 13.66-5.66M20 4v5h-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 12a8 8 0 0 1-13.66 5.66M4 20v-5h5"
            />
          </svg>
        </ToolIconButton>
        <ToolIconButton
          label="左右反転"
          active={flipHorizontal}
          onClick={onToggleFlip}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" d="M12 3v18" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7 4 12l4 5M16 7l4 5-4 5"
            />
          </svg>
        </ToolIconButton>
        <ToolIconButton label="初期に戻す" onClick={onResetFrame}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12a8 8 0 1 0 2.34-5.66M4 4v5h5"
            />
          </svg>
        </ToolIconButton>
      </div>
    </div>
  );
}

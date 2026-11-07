"use client";

import { ComposeTileImage } from "@/base/compose/ComposeTileImage";
import type { ComposePresetImage } from "@/lib/compose-preset";

type Props = {
  image: ComposePresetImage;
  selected: boolean;
  onToggle: (id: string) => void;
  /** すでに投稿へセット済み（選択不可） */
  taken?: boolean;
  /** 選択順（1始まり）。あるとき数字を出す */
  selectOrder?: number;
};

/** 未使用画像タイル（未クロップ想定のため contain） */
export function UnusedImageTile({
  image,
  selected,
  onToggle,
  taken = false,
  selectOrder,
}: Props) {
  return (
    <button
      type="button"
      disabled={taken}
      onClick={() => onToggle(image.id)}
      aria-pressed={selected}
      aria-label={
        taken
          ? `${image.alt}（追加済み）`
          : `${image.alt}${selected ? `（選択 ${selectOrder ?? ""}）` : ""}`
      }
      className="relative block w-full overflow-hidden disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="tile-thumb tile-thumb--contain">
        <ComposeTileImage src={image.src} alt="" fit="contain" />
      </span>
      {selected && !taken ? (
        <span
          className="pointer-events-none absolute inset-0 bg-white/45"
          aria-hidden
        />
      ) : null}
      {taken ? (
        <span className="tile-overlay-badge absolute inset-x-1 bottom-1 px-1 py-0.5 text-center text-[10px]">
          追加済み
        </span>
      ) : (
        <span
          className={`tile-overlay-check absolute left-1 top-1 z-10 h-5 w-5 text-[10px] font-bold tabular-nums ${
            selected ? "tile-overlay-check--on" : "tile-overlay-check--off"
          }`}
          aria-hidden
        >
          {selected ? (selectOrder ?? "✓") : ""}
        </span>
      )}
    </button>
  );
}

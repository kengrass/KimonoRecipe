"use client";

import { TileImage } from "@/base/TileImage";
import type { ContentKind } from "@/lib/content-kind";
import { displayTitle } from "@/lib/display-title";
import type { PublicListItem } from "@/lib/types";

export function attachTileCaption(
  item: PublicListItem,
  kind: ContentKind,
): string | null {
  const title = displayTitle(item.title);
  if (title) return title;
  if (kind === "items" && item.category) return item.category;
  return null;
}

type Props = {
  item: PublicListItem;
  kind: ContentKind;
  selected: boolean;
  linked: boolean;
  onToggle: () => void;
};

/** 紐付けダイアログ内の選択タイル（追加／解除予定バッジ付き） */
export function AttachResultTile({
  item,
  kind,
  selected,
  linked,
  onToggle,
}: Props) {
  const caption = attachTileCaption(item, kind);
  const willAdd = selected && !linked;
  const willRemove = linked && !selected;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="group block w-full text-left"
      aria-label={caption ?? (kind === "items" ? "アイテム" : "コーデ")}
    >
      <span className="tile-thumb relative overflow-hidden">
        <TileImage
          src={item.image_url}
          alt=""
          fill
          sizes="(max-width: 640px) 30vw, 160px"
          className="object-cover"
        />
        {selected ? (
          <span
            className="pointer-events-none absolute inset-0 bg-white/40"
            aria-hidden
          />
        ) : null}
        {willRemove ? (
          <span
            className="pointer-events-none absolute inset-0 bg-neutral-900/25"
            aria-hidden
          />
        ) : null}
        {willAdd ? (
          <span className="tile-overlay-badge tile-overlay-badge--accent absolute bottom-1 left-1 z-[1] px-1 py-0.5 text-[9px] leading-none">
            追加
          </span>
        ) : willRemove ? (
          <span className="tile-overlay-badge absolute bottom-1 left-1 z-[1] px-1 py-0.5 text-[9px] leading-none text-red-700">
            解除予定
          </span>
        ) : linked ? (
          <span className="tile-overlay-badge absolute bottom-1 left-1 z-[1] px-1 py-0.5 text-[9px] leading-none">
            紐付済
          </span>
        ) : null}
        <span
          className={`tile-overlay-check absolute right-1 top-1 z-[1] h-5 w-5 text-[11px] ${
            selected ? "tile-overlay-check--on" : "tile-overlay-check--off"
          }`}
          aria-hidden
        >
          ✓
        </span>
      </span>
      {caption ? <span className="tile-caption">{caption}</span> : null}
    </button>
  );
}

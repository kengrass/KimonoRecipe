import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { listItemLabel } from "@/lib/display-title";
import type { PublicListItem } from "@/lib/types";
import { TileImage } from "./TileImage";

type LinkExtras = Omit<
  ComponentProps<typeof Link>,
  "href" | "children" | "className"
>;

type Props = {
  items: PublicListItem[];
  /** 先頭何枚を LCP 優先にするか */
  priorityCount?: number;
  /** キャプション行があるとき tile-grid--meta */
  withCaptions?: boolean;
  itemId?: (item: PublicListItem, index: number) => string | undefined;
  /** title 属性。省略時は listItemLabel */
  linkTitle?: (item: PublicListItem, index: number) => string;
  linkProps?: (item: PublicListItem, index: number) => LinkExtras;
  overlay?: (item: PublicListItem, index: number) => ReactNode;
  /** 既定の TileImage の代わり（仮コーデ合成サムネなど） */
  media?: (item: PublicListItem, index: number) => ReactNode;
  caption?: (item: PublicListItem, index: number) => ReactNode;
  /** 先頭スロット（仮コーデの＋追加など） */
  startSlot?: ReactNode;
};

/** 公開一覧の3列タイル */
export function PublicTileGrid({
  items,
  priorityCount = 3,
  withCaptions = false,
  itemId,
  linkTitle,
  linkProps,
  overlay,
  media,
  caption,
  startSlot,
}: Props) {
  return (
    <ul className={withCaptions ? "tile-grid tile-grid--meta" : "tile-grid"}>
      {startSlot ? <li key="tile-start-slot">{startSlot}</li> : null}
      {items.map((item, index) => {
        const label = listItemLabel(item);
        const extras = linkProps?.(item, index);
        const customMedia = media?.(item, index);

        return (
          <li key={item.id} id={itemId?.(item, index)}>
            <Link
              href={item.detail_url}
              className="group block"
              title={linkTitle?.(item, index) ?? label}
              prefetch={index < 9}
              {...extras}
            >
              <span className="tile-thumb">
                {customMedia ?? (
                  <TileImage
                    src={item.image_url}
                    alt={label}
                    fill
                    sizes="(max-width: 640px) 33vw, 210px"
                    priority={index < priorityCount}
                    loading={index < priorityCount ? "eager" : "lazy"}
                  />
                )}
                {overlay?.(item, index)}
              </span>
              {caption?.(item, index)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

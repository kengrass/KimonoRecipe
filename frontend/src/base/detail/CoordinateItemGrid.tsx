"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  coordinateItemsToBrowseList,
  rememberDetailBrowse,
} from "@/lib/detail-browse";
import { tileGridClass, tileImageSizes } from "@/lib/detail-layout";
import type { CoordinateItemRef, PublicUser } from "@/lib/types";
import { displayTitle } from "@/lib/display-title";
import { pushDetailBack } from "@/base/ListFocusRestore";
import { TileAddButton } from "@/base/TileAddButton";
import { TileImage } from "@/base/TileImage";

type Props = {
  items: CoordinateItemRef[];
  user: PublicUser;
  postedAt: string;
  /** 所有者：末尾に＋タイル */
  showAddTile?: boolean;
  onAddClick?: () => void;
};

/** コーディネート構成アイテムの 3 列グリッド */
export function CoordinateItemGrid({
  items,
  user,
  postedAt,
  showAddTile = false,
  onAddClick,
}: Props) {
  const router = useRouter();
  if (!items.length && !showAddTile) return null;

  const withCaptions = items.some((item) => Boolean(displayTitle(item.title)));

  const rememberItems = () => {
    pushDetailBack();
    const list = coordinateItemsToBrowseList(items, user, postedAt);
    rememberDetailBrowse({
      kind: "items",
      ids: list.map((row) => row.id),
      items: list,
      label: "このコーデのアイテム",
      trackListFocus: false,
    });
  };

  return (
    <ul className={tileGridClass({ withCaptions })}>
      {items.map((item) => {
        const title = displayTitle(item.title);
        const label = title ?? item.category;
        const href = item.detail_url;
        return (
          <li key={item.id}>
            <Link
              href={href}
              className="group block"
              title={title ? `${item.category} ${title}` : item.category}
              prefetch
              onPointerEnter={() => router.prefetch(href)}
              onClick={rememberItems}
            >
              <div className="tile-thumb">
                <TileImage
                  src={item.image_url}
                  alt={label}
                  fill
                  sizes={tileImageSizes()}
                />
                <span className="absolute inset-x-0 bottom-0 z-[1] truncate bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1 pt-4 text-[11px] leading-tight text-white">
                  {item.category}
                </span>
              </div>
              {title ? <span className="tile-caption">{title}</span> : null}
            </Link>
          </li>
        );
      })}
      {showAddTile && onAddClick ? (
        <li>
          <TileAddButton label="アイテムを追加" onClick={onAddClick} />
        </li>
      ) : null}
    </ul>
  );
}

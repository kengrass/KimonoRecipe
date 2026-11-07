"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { BrowseKind } from "@/lib/browse";
import { rememberDetailBrowse } from "@/lib/detail-browse";
import { tileGridClass, tileImageSizes } from "@/lib/detail-layout";
import { displayTitle } from "@/lib/display-title";
import type { PublicListItem } from "@/lib/types";
import { pushDetailBack } from "@/base/ListFocusRestore";
import { TileAddButton } from "@/base/TileAddButton";
import { TileImage } from "@/base/TileImage";

type Props = {
  items: PublicListItem[];
  browseKind?: BrowseKind;
  browseLabel?: string;
  /** 所有者：末尾に＋タイル */
  showAddTile?: boolean;
  onAddClick?: () => void;
  addLabel?: string;
  /** 既定画像の代わり（仮コーデ合成など） */
  media?: (item: PublicListItem) => ReactNode;
};

/** 関連コーデ／アイテム用の 3 列グリッド（タイトル付き・メイン列幅） */
export function RelatedTileGrid({
  items,
  browseKind,
  browseLabel,
  showAddTile = false,
  onAddClick,
  addLabel = "アイテムを追加",
  media,
}: Props) {
  if (!items.length && !showAddTile) return null;

  const withCaptions = items.some((item) => Boolean(displayTitle(item.title)));

  const remember = () => {
    pushDetailBack();
    if (browseKind && browseLabel) {
      rememberDetailBrowse({
        kind: browseKind,
        ids: items.map((item) => item.id),
        items,
        label: browseLabel,
        trackListFocus: false,
      });
    }
  };

  return (
    <ul className={tileGridClass({ withCaptions })}>
      {items.map((item) => {
        const title = displayTitle(item.title);
        const customMedia = media?.(item);
        return (
          <li key={item.id}>
            <Link
              href={item.detail_url}
              className="group block"
              title={title ?? item.user.name}
              prefetch
              onClick={remember}
            >
              <div className="tile-thumb">
                {customMedia ?? (
                  <TileImage
                    src={item.image_url}
                    alt={title ?? item.user.name}
                    fill
                    sizes={tileImageSizes()}
                  />
                )}
              </div>
              {title ? <span className="tile-caption">{title}</span> : null}
            </Link>
          </li>
        );
      })}
      {showAddTile && onAddClick ? (
        <li>
          <TileAddButton label={addLabel ?? "追加"} onClick={onAddClick} />
        </li>
      ) : null}
    </ul>
  );
}

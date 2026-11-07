"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PaginationBar } from "@/base/PaginationBar";
import { PublicTileGrid } from "@/base/PublicTileGrid";
import { TileAddButton } from "@/base/TileAddButton";
import { listTileBrowseProps } from "@/base/list-browse";
import type { BrowseKind } from "@/lib/browse";
import { displayTitle, listItemLabel } from "@/lib/display-title";
import type { PublicListItem } from "@/lib/types";

type Props = {
  kind: BrowseKind;
  items: PublicListItem[];
  /** 詳細 <> の一覧ラベル */
  browseLabel: string;
  page: number;
  totalPages: number;
  total: number;
  getPageHref: (page: number) => string;
  empty: ReactNode;
  /**
   * 探す一覧向け：タイトルをタイル下に出す。
   * トップの「眺めるタイル」とは分け、コレクション／マイページ寄り。
   * 検索は false（画像のみ）。
   */
  withTitles?: boolean;
  /** ページ送り着地用 */
  resultsId?: string;
  /** 所有者の非公開バッジなど */
  overlay?: (item: PublicListItem) => ReactNode;
  /** 既定画像の代わり（仮コーデ合成など） */
  media?: (item: PublicListItem) => ReactNode;
  linkTitle?: (item: PublicListItem) => string;
  /** 検索向け：この index 以降をホバーで prefetch */
  prefetchFromIndex?: number;
  className?: string;
  "aria-label"?: string;
  /**
   * 先頭に＋追加タイル。件数0でもグリッドを出し、empty は出さない。
   */
  leadingAdd?: {
    label: string;
    onClick: () => void;
  };
  /** タイル遷移直前（モック仮コーデのプリセット投入など） */
  onItemClick?: (item: PublicListItem) => void;
};

/**
 * Next の一覧（いいね／フォロー／検索／マイページ）。
 * タイル＋詳細前後ナビ＋ページネーション。
 */
export function CollectionList({
  kind,
  items,
  browseLabel,
  page,
  totalPages,
  total,
  getPageHref,
  empty,
  withTitles = true,
  resultsId,
  overlay,
  media,
  linkTitle,
  prefetchFromIndex,
  className,
  "aria-label": ariaLabel,
  leadingAdd,
  onItemClick,
}: Props) {
  const router = useRouter();

  if (total === 0 && !leadingAdd) {
    return (
      <div
        id={resultsId}
        tabIndex={-1}
        className={`outline-none ${className ?? ""}`}
        aria-label={ariaLabel}
      >
        {empty}
      </div>
    );
  }

  const showCaptions =
    withTitles && items.some((item) => Boolean(displayTitle(item.title)));

  return (
    <div
      id={resultsId}
      tabIndex={-1}
      className={`scroll-mt-16 outline-none md:scroll-mt-20 ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      <PublicTileGrid
        items={items}
        withCaptions={showCaptions}
        itemId={(item) => `tile-${kind}-${item.id}`}
        linkTitle={(item) =>
          linkTitle ? linkTitle(item) : listItemLabel(item)
        }
        overlay={overlay}
        media={media ? (item) => media(item) : undefined}
        startSlot={
          leadingAdd ? (
            <TileAddButton
              label={leadingAdd.label}
              onClick={leadingAdd.onClick}
            />
          ) : undefined
        }
        linkProps={(item, index) => {
          const browse = listTileBrowseProps({
            kind,
            list: items,
            label: browseLabel,
            item,
          });
          return {
            ...(prefetchFromIndex != null && index >= prefetchFromIndex
              ? {
                  onPointerEnter: () => {
                    router.prefetch(item.detail_url);
                  },
                }
              : {}),
            onClick: () => {
              onItemClick?.(item);
              browse.onClick();
            },
          };
        }}
        caption={(item) => {
          if (!withTitles) return null;
          const title = displayTitle(item.title);
          if (!title) return null;
          return <span className="tile-caption">{title}</span>;
        }}
      />
      <PaginationBar
        page={page}
        totalPages={totalPages}
        getPageHref={getPageHref}
      />
    </div>
  );
}

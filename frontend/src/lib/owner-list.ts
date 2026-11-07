/**
 * 所有者／プロフィール一覧のプール（モック＝将来の owner 一覧 API と同じ絞り口）。
 * @see docs/LIST_QUERY_ARCHITECTURE.md §3
 */
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "@/lib/search-catalog";
import type { ContentKind } from "@/lib/content-kind";
import type { PublicListItem } from "@/lib/types";
import { isPubliclyVisible } from "@/lib/visibility";

/** 本人一覧：公開＋非公開。他人向けには使わない */
export function getOwnerContentPool(
  mode: ContentKind,
  ownerUserId: string,
): PublicListItem[] {
  const catalog =
    mode === "coordinates"
      ? getSearchCoordinateCatalog()
      : getSearchItemCatalog();
  return catalog.filter((item) => item.user.id === ownerUserId);
}

/** 他人プロフィール一覧：公開のみ */
export function getPublicProfilePool(
  mode: ContentKind,
  profileUserId: string,
): PublicListItem[] {
  return getOwnerContentPool(mode, profileUserId).filter((item) =>
    isPubliclyVisible(item.id),
  );
}


/**
 * 会員コレクション（いいね／フォロー投稿）。
 * 公開一覧 API とは別口（キャッシュ・権限境界）。
 * @see docs/LIST_QUERY_ARCHITECTURE.md
 */
import { LIST_PAGE_SIZE, paginateList, type PaginatedResult } from "./pagination";
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "./search-catalog";
import type { ContentKind } from "./content-kind";
import {
  DEMO_FOLLOWING_USER_IDS,
  isDemoFavorite,
} from "./social-collections";
import type { PublicListItem } from "./types";
import { isPubliclyVisible } from "./visibility";

export type MemberFeedQuery = {
  page?: number;
  perPage?: number;
};

function publicPool(mode: ContentKind): PublicListItem[] {
  const catalog =
    mode === "coordinates"
      ? getSearchCoordinateCatalog()
      : getSearchItemCatalog();
  return catalog.filter((item) => isPubliclyVisible(item.id));
}

/** GET /api/me/favorites?kind=coordinates|items — モック */
export function queryMeFavoritesPage(
  mode: ContentKind,
  query: MemberFeedQuery = {},
): PaginatedResult<PublicListItem> {
  const filtered = publicPool(mode).filter((item) => isDemoFavorite(item.id));
  return paginateList(
    filtered,
    query.page ?? 1,
    query.perPage ?? LIST_PAGE_SIZE,
  );
}

/** GET /api/me/following/posts?kind=… — モック */
export function queryMeFollowingPostsPage(
  mode: ContentKind,
  query: MemberFeedQuery = {},
): PaginatedResult<PublicListItem> {
  const filtered = publicPool(mode).filter((item) =>
    DEMO_FOLLOWING_USER_IDS.has(item.user.id),
  );
  return paginateList(
    filtered,
    query.page ?? 1,
    query.perPage ?? LIST_PAGE_SIZE,
  );
}

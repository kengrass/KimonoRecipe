/**
 * `/api/me/...` 読み取り。
 * ログイン本人のいいね／フォロー投稿。未ログインでは呼ばない（呼び出し側で guest）。
 * 公開一覧に scope=favorite|following を足さない（三口の正）。
 */

import { USE_MOCK_API } from "./config";
import { fetchJson, type ListPageResponse } from "./api-fetch";
import { LIST_PAGE_SIZE, paginateList, type PaginatedResult } from "./pagination";
import {
  queryMeFavoritesPage,
  queryMeFollowingPostsPage,
  type MemberFeedQuery,
} from "./member-feed";
import type { ContentKind } from "./content-kind";
import type { PublicListItem, PublicUser } from "./types";

/**
 * GET /api/me/favorites — いいねした投稿1ページ。
 */
export async function getMeFavoritesPage(
  mode: ContentKind,
  query: MemberFeedQuery = {},
): Promise<PaginatedResult<PublicListItem>> {
  if (!USE_MOCK_API) {
    const kind = mode === "coordinates" ? "coordinates" : "items";
    const sp = new URLSearchParams();
    sp.set("kind", kind);
    if (query.page && query.page > 1) sp.set("page", String(query.page));
    if (query.perPage && query.perPage !== LIST_PAGE_SIZE) {
      sp.set("per_page", String(query.perPage));
    }
    try {
      const json = await fetchJson<ListPageResponse>(
        `/api/me/favorites?${sp.toString()}`,
      );
      if (json.meta) {
        return {
          items: json.data,
          total: json.meta.total,
          page: json.meta.page,
          totalPages: json.meta.total_pages,
          perPage: json.meta.per_page,
        };
      }
      return paginateList(json.data, query.page ?? 1, query.perPage);
    } catch {
      return paginateList([], query.page ?? 1, query.perPage);
    }
  }
  return queryMeFavoritesPage(mode, query);
}

/**
 * GET /api/me/following — フォロー中ユーザー一覧。
 */
export async function getMeFollowingUsers(): Promise<PublicUser[]> {
  if (!USE_MOCK_API) {
    try {
      const json = await fetchJson<{ data: PublicUser[] }>("/api/me/following");
      return Array.isArray(json.data) ? json.data : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * GET /api/me/following/posts — フォロー中ユーザーの投稿1ページ。
 */
export async function getMeFollowingPostsPage(
  mode: ContentKind,
  query: MemberFeedQuery = {},
): Promise<PaginatedResult<PublicListItem>> {
  if (!USE_MOCK_API) {
    const kind = mode === "coordinates" ? "coordinates" : "items";
    const sp = new URLSearchParams();
    sp.set("kind", kind);
    if (query.page && query.page > 1) sp.set("page", String(query.page));
    if (query.perPage && query.perPage !== LIST_PAGE_SIZE) {
      sp.set("per_page", String(query.perPage));
    }
    try {
      const json = await fetchJson<ListPageResponse>(
        `/api/me/following/posts?${sp.toString()}`,
      );
      if (json.meta) {
        return {
          items: json.data,
          total: json.meta.total,
          page: json.meta.page,
          totalPages: json.meta.total_pages,
          perPage: json.meta.per_page,
        };
      }
      return paginateList(json.data, query.page ?? 1, query.perPage);
    } catch {
      return paginateList([], query.page ?? 1, query.perPage);
    }
  }
  return queryMeFollowingPostsPage(mode, query);
}

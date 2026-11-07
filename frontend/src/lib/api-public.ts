/**
 * `/api/public/...` 読み取り。
 * 誰でも。公開のみ。一覧はチャンク。非公開は null／404 相当。
 */

import { USE_MOCK_API, USE_SPIKE_API } from "./config";
import { fetchJson, type ListPageResponse } from "./api-fetch";
import {
  loadMockPublicCoordinateRaw,
  loadMockPublicItemRaw,
} from "./api-mock-detail";
import { MOCK_COORDINATE_LIST, MOCK_ITEM_LIST } from "./mock-data";
import { buildMockPublicUserProfile } from "./mypage-data";
import { getMockPublicUserListPool } from "./mock-public-users";
import { loadMockApiResponse } from "./mock-api-fixtures";
import { LIST_PAGE_SIZE, type PaginatedResult } from "./pagination";
import {
  publicListQueryToSearchParams,
  queryPublicList,
  type PublicListQuery,
} from "./public-list-query";
import {
  publicUserListQueryToSearchParams,
  queryPublicUserList,
  type PublicUserListQuery,
} from "./public-user-query";
import {
  parseOwnerListFacets,
  queryPublicProfileListPage,
  type OwnerListPageResult,
  type OwnerListQuery,
} from "./owner-list-query";
import type { ContentKind } from "./content-kind";
import {
  applyPublicListPrivacyToCoordinate,
  applyPublicListPrivacyToItem,
} from "./user-privacy";
import type { PopularUser } from "./discovery-data";
import { PICKUP_USERS } from "./discovery-data";
import type {
  ListResponse,
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
  PublicUserListItem,
  PublicUserProfile,
} from "./types";
import { isPubliclyVisible } from "./visibility";

/**
 * 公開一覧1ページ（トップ／検索の正）。
 * モック時も同じ関数経路で「絞ってから返す」。
 */
export async function getPublicListPage(
  mode: ContentKind,
  query: PublicListQuery = {},
): Promise<PaginatedResult<PublicListItem>> {
  if (!USE_MOCK_API) {
    const path =
      mode === "coordinates"
        ? "/api/public/coordinates"
        : "/api/public/items";
    const sp = publicListQueryToSearchParams(query, mode);
    const qs = sp.toString();
    const json = await fetchJson<ListPageResponse>(
      qs ? `${path}?${qs}` : path,
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
    return queryPublicList(json.data, mode, query);
  }

  const pool =
    mode === "coordinates"
      ? await getMockPublicCoordinates()
      : await getMockPublicItems();
  return queryPublicList(pool, mode, query);
}

/**
 * 詳細の前後ナビ用フォールバック一覧（モック実装の中身）。
 * 直リンク時：当該 ID が属するページ分だけ返す（全件は取らない）。
 * 呼び出しは getDetailNeighborList 経由。
 */
export async function getBrowseFallbackList(
  mode: ContentKind,
  id: string,
): Promise<PublicListItem[]> {
  const pool =
    mode === "coordinates"
      ? await getMockPublicCoordinates()
      : await getMockPublicItems();
  const index = pool.findIndex((item) => item.id === id);
  if (index < 0) {
    return queryPublicList(pool, mode, { page: 1 }).items;
  }
  const page = Math.floor(index / LIST_PAGE_SIZE) + 1;
  return queryPublicList(pool, mode, { page }).items;
}

/**
 * GET /api/public/coordinates|items/{id}/neighbors
 * 詳細の前後ナビ用。一覧セッションがあるときは ID 順の並べ替えに使い、
 * 実体はこのレスポンス（短いウィンドウ）を正とする。
 */
export async function getDetailNeighborList(
  mode: ContentKind,
  id: string,
): Promise<PublicListItem[]> {
  if (!USE_MOCK_API) {
    const path =
      mode === "coordinates"
        ? `/api/public/coordinates/${id}/neighbors`
        : `/api/public/items/${id}/neighbors`;
    try {
      const json = await fetchJson<ListResponse<PublicListItem>>(path);
      return json.data;
    } catch {
      const page = await getPublicListPage(mode, {
        page: 1,
        perPage: LIST_PAGE_SIZE,
      });
      return page.items;
    }
  }
  return getBrowseFallbackList(mode, id);
}

/**
 * 他人プロフィール一覧（公開のみ）。owner 一覧とは別経路。
 * 本番: 公開一覧 API に `user=` を付けてサーバ側で絞る（非公開は混ぜない）。
 */
export async function getPublicProfileListPage(
  mode: ContentKind,
  profileUserId: string,
  query: OwnerListQuery = {},
  options: { includeFacets?: boolean } = {},
): Promise<OwnerListPageResult> {
  if (!USE_MOCK_API) {
    const path =
      mode === "coordinates"
        ? "/api/public/coordinates"
        : "/api/public/items";
    const sp = publicListQueryToSearchParams(
      {
        user: profileUserId,
        q: query.q,
        season: query.season,
        category: query.category as PublicListQuery["category"],
        page: query.page,
        perPage: query.perPage,
        sort: query.sort,
      },
      mode,
    );
    if (options.includeFacets) sp.set("include_facets", "1");
    const qs = sp.toString();
    try {
      const json = await fetchJson<ListPageResponse & { facets?: unknown }>(
        qs ? `${path}?${qs}` : path,
      );
      if (json.meta) {
        return {
          items: json.data,
          total: json.meta.total,
          page: json.meta.page,
          totalPages: json.meta.total_pages,
          perPage: json.meta.per_page,
          facets: options.includeFacets
            ? parseOwnerListFacets(json.facets)
            : undefined,
        };
      }
      if (USE_SPIKE_API) {
        return {
          items: [],
          total: 0,
          page: query.page ?? 1,
          totalPages: 1,
          perPage: query.perPage ?? LIST_PAGE_SIZE,
        };
      }
      return queryPublicProfileListPage(mode, profileUserId, query, options);
    } catch {
      if (USE_SPIKE_API) {
        return {
          items: [],
          total: 0,
          page: query.page ?? 1,
          totalPages: 1,
          perPage: query.perPage ?? LIST_PAGE_SIZE,
        };
      }
      return queryPublicProfileListPage(mode, profileUserId, query, options);
    }
  }
  return queryPublicProfileListPage(mode, profileUserId, query, options);
}

/** 表示確認用：常にローカルモック（公開のみ・未絞り込みプール） */
export async function getMockPublicCoordinates(): Promise<PublicListItem[]> {
  return MOCK_COORDINATE_LIST.filter((item) => isPubliclyVisible(item.id));
}

/** 表示確認用：常にローカルモック（公開のみ・未絞り込みプール） */
export async function getMockPublicItems(): Promise<PublicListItem[]> {
  return MOCK_ITEM_LIST.filter((item) => isPubliclyVisible(item.id));
}

/**
 * Pick up ユーザー（自動選定）。
 * spike: GET /api/public/users/pickup
 * モック: discovery の件数フィルタ済みリスト
 */
export async function getPickupUsers(limit = 12): Promise<PopularUser[]> {
  if (!USE_MOCK_API) {
    try {
      const json = await fetchJson<{
        data: Array<{
          id: string;
          name: string;
          profile_url: string;
          avatar_url?: string | null;
          coordinate_count?: number;
          item_count?: number;
        }>;
      }>(`/api/public/users/pickup?limit=${limit}`);
      return (json.data ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        profile_url: u.profile_url,
        avatar_url: u.avatar_url ?? undefined,
        coordinateCount: u.coordinate_count,
        itemCount: u.item_count,
      }));
    } catch {
      return [];
    }
  }
  return PICKUP_USERS.slice(0, limit);
}

/**
 * GET /api/public/users
 * 公開ユーザー一覧・検索（チャンク）。検索タブ「ユーザー」の正。
 */
export async function getPublicUsersPage(
  query: PublicUserListQuery = {},
): Promise<PaginatedResult<PublicUserListItem>> {
  if (!USE_MOCK_API) {
    const sp = publicUserListQueryToSearchParams(query);
    const qs = sp.toString();
    const json = await fetchJson<
      ListResponse<PublicUserListItem> & {
        meta?: {
          page: number;
          per_page: number;
          total: number;
          total_pages: number;
        };
      }
    >(qs ? `/api/public/users?${qs}` : "/api/public/users");
    if (json.meta) {
      return {
        items: json.data,
        total: json.meta.total,
        page: json.meta.page,
        totalPages: json.meta.total_pages,
        perPage: json.meta.per_page,
      };
    }
    return queryPublicUserList(json.data, query);
  }
  return queryPublicUserList(getMockPublicUserListPool(), query);
}

/**
 * GET /api/public/users/{id}
 * 公開プロフィール（マイページ上部）。無いユーザーは null（本番 404）。
 */
export async function getPublicUser(
  id: string,
): Promise<PublicUserProfile | null> {
  if (!USE_MOCK_API) {
    try {
      return await fetchJson<PublicUserProfile>(`/api/public/users/${id}`);
    } catch {
      return null;
    }
  }
  const fromFixture = loadMockApiResponse(
    `/api/public/users/${id}`,
  ) as PublicUserProfile | null;
  if (fromFixture) return fromFixture;
  return buildMockPublicUserProfile(id);
}

/**
 * GET /api/public/coordinates/{id}
 * 公開のみ。非公開は null（本番 404）。本人の非公開は owner 詳細へ。
 */
export async function getPublicCoordinate(
  id: string,
): Promise<PublicCoordinateDetail | null> {
  if (!USE_MOCK_API) {
    try {
      const detail = await fetchJson<PublicCoordinateDetail>(
        `/api/public/coordinates/${id}`,
      );
      return applyPublicListPrivacyToCoordinate(detail);
    } catch {
      return null;
    }
  }
  if (!isPubliclyVisible(id)) return null;
  const raw = loadMockPublicCoordinateRaw(id);
  return raw ? applyPublicListPrivacyToCoordinate(raw) : null;
}

/**
 * GET /api/public/items/{id}
 * 公開のみ。非公開は null（本番 404）。本人の非公開は owner 詳細へ。
 */
export async function getPublicItem(
  id: string,
): Promise<PublicItemDetail | null> {
  if (!USE_MOCK_API) {
    try {
      const detail = await fetchJson<PublicItemDetail>(
        `/api/public/items/${id}`,
      );
      return applyPublicListPrivacyToItem(detail);
    } catch {
      return null;
    }
  }
  if (!isPubliclyVisible(id)) return null;
  const raw = loadMockPublicItemRaw(id);
  return raw ? applyPublicListPrivacyToItem(raw) : null;
}

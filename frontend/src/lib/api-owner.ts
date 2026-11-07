/**
 * `/api/owner/...` 読み取り。
 * 所有者のみ。マイページ一覧・本人用詳細フル。非所有者は null／401・403 相当。
 */

import { USE_MOCK_API, USE_SPIKE_API } from "./config";
import { fetchJson, type ListPageResponse } from "./api-fetch";
import {
  loadMockPublicCoordinateRaw,
  loadMockPublicItemRaw,
  mockOwnerCoordinateOverlay,
  mockOwnerItemOverlay,
} from "./api-mock-detail";
import { LIST_PAGE_SIZE } from "./pagination";
import {
  ownerListQueryToSearchParams,
  parseOwnerListFacets,
  parseVisibilityById,
  queryOwnerListPage,
  type OwnerListPageResult,
  type OwnerListQuery,
} from "./owner-list-query";
import type { ContentKind } from "./content-kind";
import type {
  MockAuthMode,
  OwnerCoordinateDetail,
  OwnerItemDetail,
} from "./types";
import { userForMockAuthMode } from "./mock-session";

type OwnerFetchArg =
  | MockAuthMode
  | { viewerUserId?: string | null; authMode?: MockAuthMode };

function resolveOwnerViewerUserId(arg: OwnerFetchArg): string | null {
  if (typeof arg === "string") {
    return userForMockAuthMode(arg)?.id ?? null;
  }
  if (arg.viewerUserId) return arg.viewerUserId;
  if (arg.authMode) return userForMockAuthMode(arg.authMode)?.id ?? null;
  return null;
}

/**
 * GET /api/owner/coordinates|items — 所有者の一覧1ページ。
 * 未ログイン／非所有者は本番 401/403。モックは ownerUserId の投稿（非公開含む）。
 */
export async function getOwnerListPage(
  mode: ContentKind,
  ownerUserId: string,
  query: OwnerListQuery = {},
  options: { includeFacets?: boolean } = {},
): Promise<OwnerListPageResult> {
  if (!USE_MOCK_API) {
    const path =
      mode === "coordinates"
        ? "/api/owner/coordinates"
        : "/api/owner/items";
    const sp = ownerListQueryToSearchParams(query, mode);
    if (options.includeFacets) sp.set("include_facets", "1");
    const qs = sp.toString();
    try {
      const json = await fetchJson<
        ListPageResponse & {
          facets?: unknown;
          visibility_by_id?: unknown;
        }
      >(qs ? `${path}?${qs}` : path);
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
          visibilityById: parseVisibilityById(json.visibility_by_id),
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
      return queryOwnerListPage(mode, ownerUserId, query, options);
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
      return queryOwnerListPage(mode, ownerUserId, query, options);
    }
  }
  return queryOwnerListPage(mode, ownerUserId, query, options);
}

/**
 * GET /api/owner/coordinates/{id}
 * 本人用フル（公開詳細と同型＋所有者フィールド）。本人以外は null（本番 401/403）。
 * モック第2引数: authMode または { viewerUserId }。本番は Cookie セッションのみ。
 */
export async function getOwnerCoordinate(
  id: string,
  auth: OwnerFetchArg = "guest",
): Promise<OwnerCoordinateDetail | null> {
  if (!USE_MOCK_API) {
    try {
      return await fetchJson<OwnerCoordinateDetail>(
        `/api/owner/coordinates/${id}`,
      );
    } catch {
      return null;
    }
  }

  const viewerUserId = resolveOwnerViewerUserId(auth);
  if (!viewerUserId) return null;

  const body = loadMockPublicCoordinateRaw(id);
  if (!body || body.user.id !== viewerUserId) return null;

  const overlay = mockOwnerCoordinateOverlay(id);
  return { ...body, ...overlay, id: body.id };
}

/** GET /api/owner/items/{id} — 本人用フル */
export async function getOwnerItem(
  id: string,
  auth: OwnerFetchArg = "guest",
): Promise<OwnerItemDetail | null> {
  if (!USE_MOCK_API) {
    try {
      return await fetchJson<OwnerItemDetail>(`/api/owner/items/${id}`);
    } catch {
      return null;
    }
  }

  const viewerUserId = resolveOwnerViewerUserId(auth);
  if (!viewerUserId) return null;

  const body = loadMockPublicItemRaw(id);
  if (!body || body.user.id !== viewerUserId) return null;

  const overlay = mockOwnerItemOverlay(id);
  return { ...body, ...overlay, id: body.id };
}

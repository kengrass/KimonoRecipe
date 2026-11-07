/**
 * owner／プロフィール一覧のクエリ。
 * 公開 PublicListQuery とは別型（権限・キャッシュ境界を混ぜない）。
 * 共有するのはレスポンス形 PublicListItem と page/meta だけ。
 * @see docs/LIST_QUERY_ARCHITECTURE.md §3
 */
import {
  enrichOwnerCoordinates,
  enrichOwnerItems,
  enrichPublicProfileCoordinates,
  enrichPublicProfileItems,
} from "@/lib/mypage-enrich";
import {
  countMypageSeasons,
  filterMypageByQuery,
  filterMypageCoordinatesBySeason,
  filterMypageItemsByCategory,
  getMypageItemCategories,
  getMypageMyCategories,
  sortMypageCoordinates,
  sortMypageItems,
} from "@/lib/mypage-query";
import type {
  MypageCategoryOption,
  MypageCoordinateSort,
  MypageCoordinateView,
  MypageItemCategoryMode,
  MypageItemSort,
  MypageMyFolder,
  MypageSeason,
} from "@/lib/mypage-types";
import { LIST_PAGE_SIZE, paginateList, type PaginatedResult } from "@/lib/pagination";
import type { ContentKind } from "@/lib/content-kind";
import type {
  SearchCategory,
  SearchGender,
  SearchObiKnot,
  SearchSeason,
} from "@/lib/search-filters";
import type { ContentVisibility, PublicListItem } from "@/lib/types";
import { getContentVisibility } from "@/lib/visibility";
import { userHasConfiguredMyFolders } from "@/lib/mypage-data";
import { enrichMockTempCoordinates } from "@/lib/mypage-enrich";

/** owner／プロフィール一覧専用（scope・公開検索専用キーは持たない） */
export type OwnerListQuery = {
  q?: string;
  gender?: SearchGender;
  season?: SearchSeason;
  /** システムカテゴリ（items） */
  category?: SearchCategory | string;
  obi?: SearchObiKnot;
  page?: number;
  perPage?: number;
  coordinateView?: MypageCoordinateView;
  myFolder?: string;
  categoryMode?: MypageItemCategoryMode;
  sort?: MypageCoordinateSort | MypageItemSort;
  /** owner のみ。公開／非公開絞り込み */
  visibility?: ContentVisibility;
};

export type OwnerListFacets = {
  seasonCounts: Record<MypageSeason, number>;
  myFolders: MypageMyFolder[];
  itemCategories: MypageCategoryOption[];
  itemMyCategories: MypageCategoryOption[];
  itemDeclutterCategories: MypageCategoryOption[];
  coordinateCount: number;
  itemCount: number;
  declutterCount: number;
};

export type OwnerListPageResult = PaginatedResult<PublicListItem> & {
  facets?: OwnerListFacets;
  visibilityById?: Record<string, ContentVisibility>;
};

/** 本番 JSON（snake_case）→ フロント OwnerListFacets */
export function parseOwnerListFacets(raw: unknown): OwnerListFacets | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const seasonRaw = (o.season_counts ?? o.seasonCounts) as
    | Record<string, number>
    | undefined;
  const seasonCounts: Record<MypageSeason, number> = {
    all: Number(seasonRaw?.all ?? 0),
    春: Number(seasonRaw?.["春"] ?? 0),
    夏: Number(seasonRaw?.["夏"] ?? 0),
    秋: Number(seasonRaw?.["秋"] ?? 0),
    冬: Number(seasonRaw?.["冬"] ?? 0),
  };
  return {
    seasonCounts,
    myFolders: parseMyFolders(o.my_folders ?? o.myFolders),
    itemCategories: parseCategoryOptions(
      o.item_categories ?? o.itemCategories,
    ),
    itemMyCategories: parseCategoryOptions(
      o.item_my_categories ?? o.itemMyCategories,
    ),
    itemDeclutterCategories: parseCategoryOptions(
      o.item_declutter_categories ?? o.itemDeclutterCategories,
    ),
    coordinateCount: Number(o.coordinate_count ?? o.coordinateCount ?? 0),
    itemCount: Number(o.item_count ?? o.itemCount ?? 0),
    declutterCount: Number(o.declutter_count ?? o.declutterCount ?? 0),
  };
}

/** 本番 JSON `visibility_by_id` → Record */
export function parseVisibilityById(
  raw: unknown,
): Record<string, ContentVisibility> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, ContentVisibility> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === "public" || value === "private") out[id] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseMyFolders(raw: unknown): MypageMyFolder[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      if (r.id == null || typeof r.name !== "string") return null;
      return {
        id: String(r.id),
        name: r.name,
        count: Number(r.count ?? 0),
      };
    })
    .filter((x): x is MypageMyFolder => x != null);
}

/** カテゴリチップは name + count（フィルタ値は name） */
function parseCategoryOptions(raw: unknown): MypageCategoryOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const name =
        typeof r.name === "string"
          ? r.name
          : typeof r.id === "string"
            ? r.id
            : null;
      if (!name) return null;
      return { name, count: Number(r.count ?? 0) };
    })
    .filter((x): x is MypageCategoryOption => x != null);
}

export function ownerListQueryToSearchParams(
  query: OwnerListQuery,
  mode: ContentKind,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.gender && query.gender !== "all") sp.set("g", query.gender);
  if (query.season) sp.set("season", query.season);
  if (mode === "coordinates") {
    if (query.obi) sp.set("obi", query.obi);
    if (query.coordinateView === "my_folder") {
      sp.set("my_folder", query.myFolder ?? "unset");
    }
    if (query.coordinateView === "temp") sp.set("temp", "1");
  } else {
    if (query.categoryMode === "my_categories") {
      if (query.category) sp.set("my_category", String(query.category));
    } else if (query.categoryMode === "declutter") {
      sp.set("declutter", "1");
      if (query.category) sp.set("cat", String(query.category));
    } else if (query.category) {
      sp.set("cat", String(query.category));
    }
  }
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.perPage && query.perPage !== LIST_PAGE_SIZE) {
    sp.set("per_page", String(query.perPage));
  }
  if (query.sort && query.sort !== "newest") sp.set("sort", query.sort);
  if (query.visibility) sp.set("status", query.visibility);
  return sp;
}

function filterCoordinateList(
  userId: string,
  isOwner: boolean,
  query: OwnerListQuery,
): PublicListItem[] {
  const view = query.coordinateView ?? "season";
  let base;
  if (view === "my_folder") {
    const opts = { myFolderId: query.myFolder ?? "unset" };
    base = isOwner
      ? enrichOwnerCoordinates(userId, opts)
      : enrichPublicProfileCoordinates(userId, opts);
  } else if (view === "temp") {
    base = isOwner ? enrichMockTempCoordinates() : [];
  } else {
    const all = isOwner
      ? enrichOwnerCoordinates(userId)
      : enrichPublicProfileCoordinates(userId);
    const season = (query.season as MypageSeason | undefined) ?? "all";
    base = filterMypageCoordinatesBySeason(all, season);
  }

  let filtered = filterMypageByQuery(base, query.q ?? "");
  if (query.gender && query.gender !== "all") {
    filtered = filtered.filter((item) => item.gender === query.gender);
  }
  if (query.obi) {
    filtered = filtered.filter((item) => item.obi_knot === query.obi);
  }
  if (query.visibility) {
    filtered = filtered.filter(
      (item) => getContentVisibility(item.id) === query.visibility,
    );
  }
  const sort = (query.sort as MypageCoordinateSort | undefined) ?? "newest";
  return sortMypageCoordinates(filtered, sort);
}

function filterItemList(
  userId: string,
  isOwner: boolean,
  query: OwnerListQuery,
): PublicListItem[] {
  const all = isOwner
    ? enrichOwnerItems(userId)
    : enrichPublicProfileItems(userId);
  let categoryMode = query.categoryMode ?? "system";
  if (!isOwner && categoryMode === "declutter") {
    categoryMode = "system";
  }
  const filtered = filterMypageItemsByCategory(
    all,
    query.category ? String(query.category) : undefined,
    categoryMode,
  );
  let listed = filterMypageByQuery(filtered, query.q ?? "", (item) => [
    item.category,
    ...item.myCategories,
  ]);
  if (query.gender && query.gender !== "all") {
    listed = listed.filter((item) => item.gender === query.gender);
  }
  if (query.visibility) {
    listed = listed.filter(
      (item) => getContentVisibility(item.id) === query.visibility,
    );
  }
  const sort = (query.sort as MypageItemSort | undefined) ?? "newest";
  return sortMypageItems(listed, sort);
}

function buildFacets(
  userId: string,
  isOwner: boolean,
  coordinateView: MypageCoordinateView,
): OwnerListFacets {
  const coordinates = isOwner
    ? enrichOwnerCoordinates(userId)
    : enrichPublicProfileCoordinates(userId);
  const items = isOwner
    ? enrichOwnerItems(userId)
    : enrichPublicProfileItems(userId);
  const tempCoordinates = isOwner ? enrichMockTempCoordinates() : [];

  const myFolders: MypageMyFolder[] = userHasConfiguredMyFolders(userId)
    ? [
        {
          id: "unset",
          name: "未設定",
          count: Math.min(2, coordinates.length),
        },
        {
          id: "favorite",
          name: "お気に入り",
          count: Math.min(1, coordinates.length),
        },
        {
          id: "season",
          name: "今シーズン",
          count: Math.min(1, Math.max(0, coordinates.length - 2)),
        },
      ]
    : [{ id: "unset", name: "未設定", count: coordinates.length }];

  const declutterItems = items.filter((item) => item.declutterCandidate);

  return {
    seasonCounts: countMypageSeasons(
      coordinateView === "temp" ? tempCoordinates : coordinates,
    ),
    myFolders,
    itemCategories: getMypageItemCategories(items),
    itemMyCategories: getMypageMyCategories(items),
    itemDeclutterCategories: getMypageItemCategories(declutterItems),
    coordinateCount: coordinates.length,
    itemCount: items.length,
    declutterCount: declutterItems.length,
  };
}

function visibilityMap(
  items: { id: string }[],
): Record<string, ContentVisibility> {
  return Object.fromEntries(
    items.map((item) => [item.id, getContentVisibility(item.id)]),
  );
}

/** GET /api/owner/coordinates|items 相当（モック） */
export function queryOwnerListPage(
  mode: ContentKind,
  ownerUserId: string,
  query: OwnerListQuery = {},
  options: { includeFacets?: boolean } = {},
): OwnerListPageResult {
  const filtered =
    mode === "coordinates"
      ? filterCoordinateList(ownerUserId, true, query)
      : filterItemList(ownerUserId, true, query);
  const page = paginateList(filtered, query.page ?? 1, query.perPage);
  const result: OwnerListPageResult = {
    ...page,
    visibilityById: visibilityMap(page.items),
  };
  if (options.includeFacets) {
    result.facets = buildFacets(
      ownerUserId,
      true,
      query.coordinateView ?? "season",
    );
  }
  return result;
}

/** 他人プロフィール公開一覧1ページ（モック） */
export function queryPublicProfileListPage(
  mode: ContentKind,
  profileUserId: string,
  query: OwnerListQuery = {},
  options: { includeFacets?: boolean } = {},
): OwnerListPageResult {
  const filtered =
    mode === "coordinates"
      ? filterCoordinateList(profileUserId, false, query)
      : filterItemList(profileUserId, false, query);
  const page = paginateList(filtered, query.page ?? 1, query.perPage);
  const result: OwnerListPageResult = { ...page };
  if (options.includeFacets) {
    result.facets = buildFacets(
      profileUserId,
      false,
      query.coordinateView ?? "season",
    );
  }
  return result;
}

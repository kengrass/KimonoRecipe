/**
 * 公開検索用カタログ（モック用データ寄せ集め）。
 *
 * 絞り込みの正は `public-list-query` / `getPublicListPage`。
 * ここは likes／following 等向けのプール提供。
 */
import { MOCK_COORDINATE_LIST, MOCK_ITEM_LIST } from "./mock-data";
import {
  GRAPH_COORDINATE_DETAILS,
  GRAPH_ITEM_DETAILS,
} from "./mock-graph";
import {
  REAL_COORDINATE_DETAILS,
  REAL_COORDINATE_LIST_PATCHES,
  REAL_ITEM_DETAILS,
  REAL_ITEM_LIST_PATCHES,
} from "./mock-api-fixtures";
import {
  coordinateDetailToList,
  itemDetailToList,
} from "./public-list-item";
import type { PublicListItem } from "./types";
import type { ContentKind } from "./content-kind";
import type {
  SearchCategory,
  SearchGender,
  SearchObiKnot,
  SearchSeason,
} from "./search-filters";
import {
  SEARCH_CATEGORIES,
  SEARCH_OBI_KNOTS,
  SEARCH_SEASONS,
} from "./search-filters";
import {
  OWNER_PRIVATE_COORDINATES,
  OWNER_PRIVATE_ITEMS,
} from "./visibility";

export type { SearchMode } from "./search-filters";
export type { SearchState } from "./search-state";
export {
  buildSearchHref,
  hasActiveFilters,
  parseSearchParams,
  shouldShowSearchResults,
  patchSearchState,
} from "./search-state";

export type SearchListEntry = Omit<PublicListItem, "gender"> & {
  gender: Exclude<SearchGender, "all">;
  seasons: SearchSeason[];
  categories: SearchCategory[];
  obiKnots: SearchObiKnot[];
};

/** ざっくりタグ → カテゴリ対応（フィルターが空振りしにくくする） */
const TAG_CATEGORY_ALIASES: Record<string, SearchCategory> = {
  帯: "その他帯",
  帯締め: "帯締",
  帯揚げ: "帯揚",
  小物: "アクセサリー",
  着物: "袷",
  男の着物: "袷",
  ルミロック: "袷",
};

function inferGender(item: PublicListItem): Exclude<SearchGender, "all"> {
  if (item.gender) return item.gender;
  const text = [item.title, ...item.tags, item.user.name].join(" ");
  if (/男|mens|MEN/i.test(text)) return "men";
  if (/子供|キッズ|KIDS|kids/i.test(text)) return "kids";
  if (item.user.id === "FL6QQa" || item.user.id === "dU9xEE") return "men";
  return "women";
}

function pickFrom<T extends string>(
  values: readonly T[],
  tags: string[],
  title: string,
): T[] {
  const haystack = [title, ...tags].join(" ");
  return values.filter((v) => haystack.includes(v));
}

function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** 一覧1件に検索用メタ（季節・カテゴリ・帯結び）を付与 */
function enrichEntry(
  item: PublicListItem,
  mode: ContentKind,
  itemCategory?: string,
): SearchListEntry {
  const tags = item.tags;
  const title = item.title;
  const categoryHint = itemCategory ?? item.category;

  let categories = pickFrom(
    SEARCH_CATEGORIES,
    categoryHint ? [categoryHint, ...tags] : tags,
    title,
  );

  if (
    categoryHint &&
    (SEARCH_CATEGORIES as readonly string[]).includes(categoryHint)
  ) {
    const cat = categoryHint as SearchCategory;
    if (!categories.includes(cat)) categories = [cat, ...categories];
  }

  if (!categories.length) {
    for (const tag of tags) {
      const aliased = TAG_CATEGORY_ALIASES[tag];
      if (aliased) {
        categories = [aliased];
        break;
      }
    }
  }

  if (!categories.length && mode === "items") {
    categories = [
      SEARCH_CATEGORIES[hashIndex(item.id, SEARCH_CATEGORIES.length)],
    ];
  }

  let seasons = item.seasons?.length
    ? [...item.seasons]
    : pickFrom(SEARCH_SEASONS, tags, title);
  if (!seasons.length) {
    seasons = [SEARCH_SEASONS[hashIndex(item.id, SEARCH_SEASONS.length)]];
  }

  let obiKnots: SearchObiKnot[] =
    mode === "coordinates" ? pickFrom(SEARCH_OBI_KNOTS, tags, title) : [];
  if (
    mode === "coordinates" &&
    item.obi_knot &&
    (SEARCH_OBI_KNOTS as readonly string[]).includes(item.obi_knot)
  ) {
    const knot = item.obi_knot as SearchObiKnot;
    if (!obiKnots.includes(knot)) obiKnots = [knot, ...obiKnots];
  }
  if (mode === "coordinates" && !obiKnots.length && hashIndex(item.id, 3) === 0) {
    obiKnots = [SEARCH_OBI_KNOTS[hashIndex(item.id, SEARCH_OBI_KNOTS.length)]];
  }

  return {
    ...item,
    gender: inferGender(item),
    seasons,
    categories,
    obiKnots,
  };
}

function mergeCatalog(
  mode: ContentKind,
  sources: PublicListItem[],
  withCategory?: Array<{ item: PublicListItem; category?: string }>,
): SearchListEntry[] {
  const map = new Map<string, SearchListEntry>();
  for (const item of sources) {
    map.set(item.id, enrichEntry(item, mode));
  }
  for (const row of withCategory ?? []) {
    map.set(row.item.id, enrichEntry(row.item, mode, row.category));
  }
  return [...map.values()].sort((a, b) =>
    b.posted_at.localeCompare(a.posted_at),
  );
}

/** owner／me／マイページ用コーデ全集（非公開含む）。公開検索プールとは別 */
export function getSearchCoordinateCatalog(): SearchListEntry[] {
  return mergeCatalog("coordinates", [
    ...MOCK_COORDINATE_LIST,
    ...OWNER_PRIVATE_COORDINATES,
    ...Object.values(REAL_COORDINATE_LIST_PATCHES),
    ...Object.values(REAL_COORDINATE_DETAILS).map(coordinateDetailToList),
    ...Object.values(GRAPH_COORDINATE_DETAILS).map(coordinateDetailToList),
  ]);
}

/** 検索・マイページ用アイテム一覧（非公開含む全集） */
export function getSearchItemCatalog(): SearchListEntry[] {
  return mergeCatalog(
    "items",
    [
      ...MOCK_ITEM_LIST,
      ...OWNER_PRIVATE_ITEMS,
      ...Object.values(REAL_ITEM_LIST_PATCHES),
    ],
    [
      ...Object.values(REAL_ITEM_DETAILS).map((d) => ({
        item: itemDetailToList(d),
        category: d.category,
      })),
      ...Object.values(GRAPH_ITEM_DETAILS).map((d) => ({
        item: itemDetailToList(d),
        category: d.category,
      })),
    ],
  );
}

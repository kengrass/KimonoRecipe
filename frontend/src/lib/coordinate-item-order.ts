/**
 * システムカテゴリ順 → 同カテゴリ内は登録の新しいものを上。
 * コーデ詳細の紐付けアイテム／マイページのアイテム「カテゴリ順」で共用。
 */
import { REAL_ITEM_DETAILS } from "@/lib/mock-api-fixtures";
import { MOCK_ITEM_LIST } from "@/lib/mock-data";
import { GRAPH_ITEM_DETAILS } from "@/lib/mock-graph";
import { getSearchItemCatalog } from "@/lib/search-catalog";
import { SEARCH_CATEGORIES } from "@/lib/search-filters";
import type { CoordinateItemRef } from "@/lib/types";

const CATEGORY_ORDER = SEARCH_CATEGORIES as readonly string[];

export function systemCategoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category);
  return i >= 0 ? i : CATEGORY_ORDER.length;
}

/** モック：アイテムの登録日時（ISO）。無ければ空文字 */
export function resolveItemPostedAt(itemId: string): string {
  const listed = MOCK_ITEM_LIST.find((item) => item.id === itemId);
  if (listed?.posted_at) return listed.posted_at;
  const catalog = getSearchItemCatalog().find((item) => item.id === itemId);
  if (catalog?.posted_at) return catalog.posted_at;
  const detail =
    REAL_ITEM_DETAILS[itemId] ?? GRAPH_ITEM_DETAILS[itemId] ?? null;
  return detail?.posted_at ?? "";
}

type CategorySortable = {
  id: string;
  category: string;
  /** あれば優先。無ければ resolveItemPostedAt */
  posted_at?: string;
};

export function compareBySystemCategoryThenNewest(
  a: CategorySortable,
  b: CategorySortable,
): number {
  const rankA = systemCategoryRank(a.category);
  const rankB = systemCategoryRank(b.category);
  if (rankA !== rankB) return rankA - rankB;
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category, "ja");
  }
  const postedA = a.posted_at?.trim() || resolveItemPostedAt(a.id);
  const postedB = b.posted_at?.trim() || resolveItemPostedAt(b.id);
  if (postedA && postedB && postedA !== postedB) {
    return postedB.localeCompare(postedA);
  }
  if (postedA && !postedB) return -1;
  if (!postedA && postedB) return 1;
  return a.id.localeCompare(b.id);
}

export function sortCoordinateItemsByCategory(
  items: CoordinateItemRef[],
): CoordinateItemRef[] {
  return [...items].sort(compareBySystemCategoryThenNewest);
}

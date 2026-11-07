/**
 * マイページ一覧のフィルタ／ソート／集計（画面の一覧操作）。
 * サマリー組み立て・プロフィールモックは mypage-data。
 */
import { compareBySystemCategoryThenNewest } from "./coordinate-item-order";
import { SEARCH_CATEGORIES } from "./search-filters";
import type { PublicListItem } from "./types";
import type {
  MypageCategoryOption,
  MypageCoordinateSort,
  MypageItem,
  MypageItemCategoryMode,
  MypageItemSort,
  MypageListItem,
  MypageSeason,
} from "./mypage-types";

export function getMypageItemCategories(
  items: MypageItem[],
): MypageCategoryOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  const options: MypageCategoryOption[] = SEARCH_CATEGORIES.map((name) => ({
    name,
    count: counts.get(name) ?? 0,
  }));

  for (const [name, count] of counts) {
    if (!(SEARCH_CATEGORIES as readonly string[]).includes(name)) {
      options.push({ name, count });
    }
  }

  return options;
}

export function getMypageMyCategories(
  items: MypageItem[],
): MypageCategoryOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const name of item.myCategories) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([name, count]) => ({ name, count }));
}

/** マイページ内検索（タイトル・タグ・カテゴリ） */
export function filterMypageByQuery<T extends PublicListItem>(
  items: T[],
  query: string,
  extraSearchText?: (item: T) => string[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const extra = extraSearchText?.(item) ?? [];
    const haystack = [item.title, ...item.tags, ...extra]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterMypageItemsByCategory(
  items: MypageItem[],
  category?: string,
  mode: MypageItemCategoryMode = "system",
): MypageItem[] {
  const scoped =
    mode === "declutter"
      ? items.filter((item) => item.declutterCandidate)
      : items;

  if (!category) return scoped;
  if (mode === "my_categories") {
    return scoped.filter((item) => item.myCategories.includes(category));
  }
  return scoped.filter((item) => item.category === category);
}

export function filterMypageCoordinatesBySeason(
  items: MypageListItem[],
  season: MypageSeason,
): MypageListItem[] {
  if (season === "all") return items;
  return items.filter((item) => item.season === season);
}

/** 春夏秋冬チップ用の件数（すべて含む） */
export function countMypageSeasons(
  items: MypageListItem[],
): Record<MypageSeason, number> {
  const seasonCounts: Record<MypageSeason, number> = {
    all: items.length,
    春: 0,
    夏: 0,
    秋: 0,
    冬: 0,
  };
  for (const c of items) {
    if (c.season && c.season !== "all") seasonCounts[c.season] += 1;
  }
  return seasonCounts;
}

function favoriteRankValue(item: MypageItem): number {
  return item.favoriteRank ?? 0;
}

export function sortMypageItems(
  items: MypageItem[],
  sort: MypageItemSort,
): MypageItem[] {
  const copy = [...items];
  if (sort === "category") {
    return copy.sort(compareBySystemCategoryThenNewest);
  }
  if (sort === "links_desc") {
    return copy.sort(
      (a, b) =>
        b.linkCount - a.linkCount || b.posted_at.localeCompare(a.posted_at),
    );
  }
  if (sort === "links_asc") {
    return copy.sort(
      (a, b) =>
        a.linkCount - b.linkCount || b.posted_at.localeCompare(a.posted_at),
    );
  }
  if (sort === "favorite_desc") {
    return copy.sort(
      (a, b) =>
        favoriteRankValue(b) - favoriteRankValue(a) ||
        b.posted_at.localeCompare(a.posted_at),
    );
  }
  if (sort === "favorite_asc") {
    return copy.sort(
      (a, b) =>
        favoriteRankValue(a) - favoriteRankValue(b) ||
        b.posted_at.localeCompare(a.posted_at),
    );
  }
  // newest = 登録日順（新しいもの上）
  return copy.sort((a, b) => b.posted_at.localeCompare(a.posted_at));
}

export function sortMypageCoordinates(
  items: MypageListItem[],
  sort: MypageCoordinateSort,
): MypageListItem[] {
  const copy = [...items];
  if (sort === "worn") {
    return copy
      .filter((item) => Boolean(item.wornOn?.trim()))
      .sort(
        (a, b) =>
          (b.wornOn ?? "").localeCompare(a.wornOn ?? "") ||
          b.posted_at.localeCompare(a.posted_at),
      );
  }
  if (sort === "links_desc") {
    return copy.sort(
      (a, b) =>
        b.linkCount - a.linkCount || b.posted_at.localeCompare(a.posted_at),
    );
  }
  if (sort === "links_asc") {
    return copy.sort(
      (a, b) =>
        a.linkCount - b.linkCount || b.posted_at.localeCompare(a.posted_at),
    );
  }
  return copy.sort((a, b) => b.posted_at.localeCompare(a.posted_at));
}

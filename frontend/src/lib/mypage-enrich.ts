/**
 * マイページ一覧用の enrich（モック＝owner／プロフィール一覧 API のサーバ側相当）。
 * プールは owner-list。集計サマリーは mypage-data。
 */
import {
  getOwnerContentPool,
  getPublicProfilePool,
} from "@/lib/owner-list";
import { GRAPH_ITEM_DETAILS } from "@/lib/mock-graph";
import { REAL_ITEM_DETAILS } from "@/lib/mock-api-fixtures";
import { listMockTempCoordinates } from "@/lib/mock-temp-coordinate";
import { SEARCH_CATEGORIES } from "@/lib/search-filters";
import type {
  MypageItem,
  MypageListItem,
  MypageMyFolder,
  MypageSeason,
} from "@/lib/mypage-types";
import type { PublicListItem } from "@/lib/types";
import {
  CONTENT_VISIBILITY_LABEL,
  getContentVisibility,
} from "@/lib/visibility";

const MOCK_MY_FOLDERS: MypageMyFolder[] = [
  { id: "unset", name: "未設定", count: 2 },
  { id: "favorite", name: "お気に入り", count: 1 },
  { id: "season", name: "今シーズン", count: 1 },
];

function userHasConfiguredMyFolders(userId: string): boolean {
  return userId === "FL6QQa";
}

function withVisibility(item: PublicListItem, index = 0): MypageListItem {
  const visibility = getContentVisibility(item.id);
  const seasons = ["春", "夏", "秋", "冬"] as const;
  const fromTag = seasons.find((s) => item.tags.includes(s));
  // モック：約半数が着用日あり（着用日順の絞り込み確認用）
  const wornOn =
    index % 2 === 0
      ? `2024-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`
      : null;
  return {
    ...item,
    visibility,
    visibilityLabel: CONTENT_VISIBILITY_LABEL[visibility],
    season: fromTag ?? seasons[index % 4],
    linkCount: 1 + (index % 5),
    wornOn,
  };
}

function resolveItemCategory(item: PublicListItem): string {
  if (item.category) return item.category;
  const detail =
    REAL_ITEM_DETAILS[item.id] ?? GRAPH_ITEM_DETAILS[item.id] ?? null;
  if (detail?.category) return detail.category;
  const fromKnown = SEARCH_CATEGORIES.find((c) => item.tags.includes(c));
  if (fromKnown) return fromKnown;
  const tag = item.tags.find((t) => t && t !== "着物");
  return tag ?? "その他";
}

function resolveItemMyCategories(item: PublicListItem, index: number): string[] {
  if (index % 5 === 0) return ["お気に入り"];
  if (index % 5 === 1) return ["今シーズン"];
  if (index % 5 === 2) return ["お気に入り", "着付け練習"];
  return [];
}

function toMypageItem(item: PublicListItem, index = 0): MypageItem {
  const rankCycle = [null, 5, 4, 3, 2, 1, null] as const;
  return {
    ...withVisibility(item, index),
    category: resolveItemCategory(item),
    myCategories: resolveItemMyCategories(item, index),
    declutterCandidate: index % 6 === 0 || index % 6 === 3,
    favoriteRank: rankCycle[index % rankCycle.length] ?? null,
  };
}

export type EnrichListOptions = {
  myFolderId?: string;
  tempOnly?: boolean;
};

function folderMap(
  coordinates: MypageListItem[],
  userId: string,
): Record<string, MypageListItem[]> {
  const myFolders = userHasConfiguredMyFolders(userId)
    ? MOCK_MY_FOLDERS.map((f) => ({
        ...f,
        count:
          f.id === "unset"
            ? Math.min(2, coordinates.length)
            : f.id === "favorite"
              ? Math.min(1, coordinates.length)
              : Math.min(1, Math.max(0, coordinates.length - 2)),
      }))
    : [{ id: "unset", name: "未設定", count: coordinates.length }];

  return {
    unset: coordinates.slice(
      0,
      myFolders.find((f) => f.id === "unset")?.count ?? 0,
    ),
    favorite: coordinates.slice(1, 2),
    season: coordinates.slice(2, 3),
  };
}

/** 本人マイページの仮コーデ一覧（sessionStorage） */
export function enrichMockTempCoordinates(): MypageListItem[] {
  return listMockTempCoordinates().map((item, index) => ({
    ...item,
    visibility: "private" as const,
    visibilityLabel: CONTENT_VISIBILITY_LABEL.private,
    season: (["春", "夏", "秋", "冬"] as const)[index % 4],
    linkCount: 0,
  }));
}

function selectCoordinates(
  pool: PublicListItem[],
  userId: string,
  options?: EnrichListOptions,
): MypageListItem[] {
  const coordinates = pool.map((item, i) => withVisibility(item, i));
  // 仮コーデは session の mock-temp が正（enrichMockTempCoordinates）。カタログから捏造しない。
  if (options?.tempOnly) {
    return [];
  }
  if (options?.myFolderId) {
    const map = folderMap(coordinates, userId);
    return map[options.myFolderId] ?? [];
  }
  return coordinates;
}

/** 本人コーデ一覧（enrich 済み） */
export function enrichOwnerCoordinates(
  ownerUserId: string,
  options?: EnrichListOptions,
): MypageListItem[] {
  return selectCoordinates(
    getOwnerContentPool("coordinates", ownerUserId),
    ownerUserId,
    options,
  );
}

/** 公開プロフィールコーデ一覧 */
export function enrichPublicProfileCoordinates(
  profileUserId: string,
  options?: EnrichListOptions,
): MypageListItem[] {
  return selectCoordinates(
    getPublicProfilePool("coordinates", profileUserId),
    profileUserId,
    options,
  );
}

/** 本人アイテム一覧 */
export function enrichOwnerItems(ownerUserId: string): MypageItem[] {
  return getOwnerContentPool("items", ownerUserId).map((item, i) =>
    toMypageItem(item, i),
  );
}

/** 公開プロフィールアイテム一覧 */
export function enrichPublicProfileItems(profileUserId: string): MypageItem[] {
  return getPublicProfilePool("items", profileUserId).map((item, i) =>
    toMypageItem(item, i),
  );
}

/** ファセット用：enrich 後の季節（タグ優先、なければ index 割当） */
export type { MypageSeason };

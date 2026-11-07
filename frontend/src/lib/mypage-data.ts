/**
 * マイページ／プロフィールのサマリー組み立てと導線。
 *
 * - 型: mypage-types
 * - 一覧のフィルタ／ソート: mypage-query（ここから再エクスポート）
 * - 一覧 enrich: mypage-enrich（owner-list プール）
 */
import { LARAVEL_ORIGIN } from "./config";
import { PICKUP_USERS } from "./discovery-data";
import { APP_ROUTES } from "./laravel-urls";
import {
  MOCK_MEMBER_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
} from "./mock-data";
import { REAL_USER_PROFILES } from "./mock-api-fixtures";
import {
  enrichMockTempCoordinates,
  enrichOwnerCoordinates,
  enrichOwnerItems,
  enrichPublicProfileCoordinates,
  enrichPublicProfileItems,
} from "./mypage-enrich";
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "./search-catalog";
import type { PublicListItem, PublicUser } from "./types";
import type {
  MypageMyFolder,
  MypageListItem,
  MypageSeason,
  MypageSummary,
  ProfileLink,
  ProfileSns,
} from "./mypage-types";
import {
  countMypageSeasons,
  getMypageItemCategories,
  getMypageMyCategories,
} from "./mypage-query";
import {
  buildMypageHref,
  defaultMypageUrlState,
} from "./mypage-state";

export type {
  MypageCategoryOption,
  MypageCoordinateSort,
  MypageCoordinateView,
  MypageMyFolder,
  MypageItem,
  MypageItemCategoryMode,
  MypageItemSort,
  MypageListItem,
  MypageMainTab,
  MypageSeason,
  MypageSummary,
  ProfileLink,
  ProfileSns,
} from "./mypage-types";

export {
  countMypageSeasons,
  filterMypageByQuery,
  filterMypageCoordinatesBySeason,
  filterMypageItemsByCategory,
  getMypageItemCategories,
  getMypageMyCategories,
  sortMypageCoordinates,
  sortMypageItems,
} from "./mypage-query";

const MOCK_MY_FOLDERS: MypageMyFolder[] = [
  { id: "unset", name: "未設定", count: 2 },
  { id: "favorite", name: "お気に入り", count: 1 },
  { id: "season", name: "今シーズン", count: 1 },
];

/** 未設定以外の Myフォルダを1つ以上持つか（モックはオーナーのみ） */
export function userHasConfiguredMyFolders(userId: string): boolean {
  return userId === "FL6QQa";
}

export const MYPAGE_SEASONS: { id: MypageSeason; label: string }[] = [
  { id: "all", label: "全て" },
  { id: "春", label: "春" },
  { id: "夏", label: "夏" },
  { id: "秋", label: "秋" },
  { id: "冬", label: "冬" },
];

const EMPTY_SIZE_VALUES = new Set(["—", "-", "未設定", ""]);
const PUBLIC_SIZE_LABELS = new Set(["身長", "身丈"]);

/** 未入力時のマイサイズ行（本人のみ） */
export const EMPTY_MY_SIZE: { label: string; value: string }[] = [
  { label: "身長", value: "—" },
  { label: "身丈", value: "—" },
  { label: "裄", value: "—" },
  { label: "胴回り", value: "—" },
];

export function isMySizeFilled(
  mySize: { label: string; value: string }[],
): boolean {
  return mySize.some((row) => !EMPTY_SIZE_VALUES.has(row.value.trim()));
}

export function pickPublicSize(
  mySize: { label: string; value: string }[],
): { label: string; value: string }[] {
  return mySize.filter(
    (row) =>
      PUBLIC_SIZE_LABELS.has(row.label) &&
      !EMPTY_SIZE_VALUES.has(row.value.trim()),
  );
}

const MOCK_BIOS: Record<string, string> = {
  FL6QQa: "モック用の運営アカウントです。",
  lRTLf6: "モック用の投稿者です。",
  "6ohruL": "モック用の投稿者です。",
  dU9xEE: "モック用ブランドです。",
  WI7JsO: "モック用ブランドです。",
};

const MOCK_PROFILE_LINKS: Record<string, ProfileLink[]> = {
  FL6QQa: [
    { label: "👘とは？", href: `${LARAVEL_ORIGIN}/about.html` },
    {
      label: "👘ご利用方法",
      href: "https://blog.kimonorecipe.com/how-to-use/",
    },
  ],
};

const MOCK_SNS: Record<string, ProfileSns[]> = {
  FL6QQa: [
    { kind: "x", label: "X", href: "https://twitter.com/kimonorecipe" },
    {
      kind: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/kimonorecipe",
    },
    {
      kind: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/kimonorecipe/",
    },
    {
      kind: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/@kimonorecipe",
    },
  ],
};

const MOCK_SIZES: Record<string, { label: string; value: string }[]> = {
  FL6QQa: [
    { label: "身長", value: "160cm" },
    { label: "身丈", value: "—" },
    { label: "裄", value: "—" },
    { label: "胴回り", value: "—" },
  ],
};

function collectTopTags(
  coordinates: PublicListItem[],
  items: PublicListItem[],
  limit = 8,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of [...coordinates, ...items]) {
    for (const tag of entry.tags) {
      if (!tag || tag === "非公開") continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * マイページサマリー。
 * - 本人（isOwnerView）: 公開＋自分のみ（非公開）
 * - 他人／未ログイン: 公開のみ
 */
export function getMypageSummary(
  user: PublicUser,
  options?: { viewerUserId?: string | null },
): MypageSummary {
  const viewerUserId = options?.viewerUserId ?? null;
  const isOwnerView = Boolean(viewerUserId && viewerUserId === user.id);

  const enrichCoords = (opts?: { myFolderId?: string; tempOnly?: boolean }) =>
    isOwnerView
      ? enrichOwnerCoordinates(user.id, opts)
      : enrichPublicProfileCoordinates(user.id, opts);

  const coordinates = enrichCoords();
  const items = isOwnerView
    ? enrichOwnerItems(user.id)
    : enrichPublicProfileItems(user.id);

  const myFolders = userHasConfiguredMyFolders(user.id)
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

  const coordinatesByMyFolder: Record<string, MypageListItem[]> = {
    unset: enrichCoords({ myFolderId: "unset" }),
    favorite: enrichCoords({ myFolderId: "favorite" }),
    season: enrichCoords({ myFolderId: "season" }),
  };

  const tempCoordinates = isOwnerView ? enrichMockTempCoordinates() : [];
  const mySize = MOCK_SIZES[user.id] ?? EMPTY_MY_SIZE;
  const pubProfile = buildMockPublicUserProfile(user.id);

  return {
    user,
    isOwnerView,
    coordinateCount: coordinates.length,
    itemCount: items.length,
    myFolders,
    coordinates,
    tempCoordinates,
    items,
    itemCategories: getMypageItemCategories(items),
    itemMyCategories: getMypageMyCategories(items),
    itemDeclutterCategories: getMypageItemCategories(
      items.filter((item) => item.declutterCandidate),
    ),
    declutterCount: items.filter((item) => item.declutterCandidate).length,
    coordinatesByMyFolder,
    seasonCounts: countMypageSeasons(coordinates),
    bio: pubProfile?.bio ?? "",
    profileLinks: pubProfile?.profile_links ?? [],
    sns: pubProfile?.sns ?? [],
    topTags: collectTopTags(coordinates, items),
    mySize,
    publicSize: pubProfile?.public_size ?? pickPublicSize(mySize),
    hasBio: Boolean(pubProfile?.bio?.trim()),
    hasMySize: isMySizeFilled(mySize),
    hasPublicSize: Boolean(pubProfile?.public_size?.length),
  };
}

/** マイページ関連の導線（Next 設定の該当パネルへ） */
export const MYPAGE_LINKS = {
  profileEdit: APP_ROUTES.profileSettingsEntry({ tab: "profile" }),
  profileBio: APP_ROUTES.profileSettingsEntry({
    tab: "profile",
    panel: "bio",
  }),
} as const;

/** アプリ内プロフィール（マイページ）パス */
export function userProfilePath(userId: string): string {
  return `/m/${userId}`;
}

/** そのユーザーのアイテム一覧（システムカテゴリで絞り込み） */
export function userItemsByCategoryPath(
  userId: string,
  category: string,
): string {
  const name = category.trim();
  return buildMypageHref(
    userProfilePath(userId),
    defaultMypageUrlState({
      tab: "items",
      category: name || undefined,
    }),
  );
}

/** ID から公開ユーザーを解決（モック既知＋カタログ） */
export function findPublicUserById(id: string): PublicUser | null {
  const seeded: PublicUser[] = [
    MOCK_OWNER_USER,
    MOCK_OTHER_USER,
    MOCK_MEMBER_USER,
    ...PICKUP_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      profile_url: u.profile_url,
    })),
  ];
  const fromSeed = seeded.find((user) => user.id === id);
  if (fromSeed) return fromSeed;

  const known = [
    ...getSearchCoordinateCatalog().map((item) => item.user),
    ...getSearchItemCatalog().map((item) => item.user),
  ];
  return known.find((user) => user.id === id) ?? null;
}

/**
 * モック: 公開プロフィール GET 相当。
 * 見本 JSON（`mocks/api/public/users/`）を優先し、無ければ名簿＋マップから合成。
 */
export function buildMockPublicUserProfile(
  id: string,
): import("./types").PublicUserProfile | null {
  const fromFixture = REAL_USER_PROFILES[id];
  if (fromFixture) return fromFixture;

  const user = findPublicUserById(id);
  if (!user) return null;
  const mySize = MOCK_SIZES[user.id] ?? EMPTY_MY_SIZE;
  return {
    id: user.id,
    name: user.name,
    profile_url: user.profile_url,
    bio: MOCK_BIOS[user.id] ?? "",
    profile_links: MOCK_PROFILE_LINKS[user.id] ?? [],
    sns: MOCK_SNS[user.id] ?? [],
    public_size: pickPublicSize(mySize),
  };
}

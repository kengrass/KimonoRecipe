/**
 * Next マイページ：サーバ相当の「絞って返す」組み立て。
 * 人物情報は公開プロフィール API。一覧＋ファセットは owner／公開一覧（user=）。
 */
import {
  getOwnerListPage,
  getPublicProfileListPage,
} from "@/lib/api";
import {
  getMypageSummary,
  isMySizeFilled,
  MYPAGE_SEASONS,
  type MypageCoordinateSort,
  type MypageItemSort,
  type MypageSummary,
} from "@/lib/mypage-data";
import {
  defaultMypageUrlState,
  parseMypageParams,
  type MypageParamsInput,
  type MypageUrlState,
} from "@/lib/mypage-state";
import type { OwnerListQuery } from "@/lib/owner-list-query";
import type { PaginatedResult } from "@/lib/pagination";
import type { ContentKind } from "@/lib/content-kind";
import type {
  ContentVisibility,
  PublicListItem,
  PublicUser,
  PublicUserProfile,
} from "@/lib/types";

export type MypageProfile = {
  user: PublicUser;
  isOwnerView: boolean;
  coordinateCount: number;
  itemCount: number;
  declutterCount: number;
  bio: string;
  profileLinks: MypageSummary["profileLinks"];
  sns: MypageSummary["sns"];
  hasBio: boolean;
  hasMySize: boolean;
  publicSize: { label: string; value: string }[];
  hasPublicSize: boolean;
};

export type MypageFacets = {
  seasonCounts: MypageSummary["seasonCounts"];
  myFolders: MypageSummary["myFolders"];
  itemCategories: MypageSummary["itemCategories"];
  itemMyCategories: MypageSummary["itemMyCategories"];
  itemDeclutterCategories: MypageSummary["itemDeclutterCategories"];
  hasMyFolders: boolean;
  hasMyCategories: boolean;
};

export type MypagePagePayload = {
  profile: MypageProfile;
  facets: MypageFacets;
  state: MypageUrlState;
  list: PaginatedResult<PublicListItem>;
  visibilityById?: Record<string, ContentVisibility>;
};

export const MYPAGE_COORDINATE_SORTS: {
  id: MypageCoordinateSort;
  label: string;
}[] = [
  { id: "newest", label: "登録日順" },
  { id: "worn", label: "着用日順" },
  { id: "links_desc", label: "紐付けの多い順" },
  { id: "links_asc", label: "紐付けの少ない順" },
];

/** 現行サイトのアイテム並びと揃える */
export const MYPAGE_ITEM_SORTS: { id: MypageItemSort; label: string }[] = [
  { id: "category", label: "カテゴリ順" },
  { id: "newest", label: "登録日順" },
  { id: "links_desc", label: "紐付けの多い順" },
  { id: "links_asc", label: "紐付けの少ない順" },
  { id: "favorite_desc", label: "☆の多い順" },
  { id: "favorite_asc", label: "☆の少ない順" },
];

export { MYPAGE_SEASONS };

function toOwnerListQuery(state: MypageUrlState): OwnerListQuery {
  const query: OwnerListQuery = {
    q: state.q || undefined,
    page: state.page,
    sort: state.sort,
  };

  if (state.tab === "coordinates") {
    query.coordinateView = state.coordinateView;
    if (state.coordinateView === "season" && state.season !== "all") {
      query.season = state.season as NonNullable<OwnerListQuery["season"]>;
    }
    if (state.coordinateView === "my_folder") {
      query.myFolder = state.myFolderId;
    }
  } else {
    query.categoryMode = state.categoryMode;
    if (state.category) {
      query.category = state.category;
    }
  }

  if (state.status === "public" || state.status === "private") {
    query.visibility = state.status;
  }

  return query;
}

export async function loadMypagePage(
  profileApi: PublicUserProfile,
  viewerUserId: string | null,
  rawParams: MypageParamsInput,
): Promise<MypagePagePayload> {
  const user: PublicUser = {
    id: profileApi.id,
    name: profileApi.name,
    profile_url: profileApi.profile_url,
  };
  const summary = getMypageSummary(user, { viewerUserId });
  let state = parseMypageParams(rawParams);

  // 仮コーデは本人のみ。他人の ?temp=1 は季節ビューへ寄せる（件数 0 化を防ぐ）
  if (state.coordinateView === "temp" && !summary.isOwnerView) {
    state = { ...state, coordinateView: "season" };
  }

  // ☆並びは本人のみ（他人プロフィールの URL 直打ちも登録日順へ）
  if (
    !summary.isOwnerView &&
    (state.sort === "favorite_desc" || state.sort === "favorite_asc")
  ) {
    state = { ...state, sort: "newest" };
  }

  const mode: ContentKind =
    state.tab === "coordinates" ? "coordinates" : "items";
  const query = toOwnerListQuery(state);

  const listPage = summary.isOwnerView
    ? await getOwnerListPage(mode, user.id, query, { includeFacets: true })
    : await getPublicProfileListPage(mode, user.id, query, {
        includeFacets: true,
      });

  const apiFacets = listPage.facets;

  // Myフォルダ／Myカテゴリ UI は廃止。旧 URL は季節・システムカテゴリへ寄せる
  if (state.coordinateView === "my_folder") {
    state = { ...state, coordinateView: "season", myFolderId: "unset" };
  }
  if (state.categoryMode === "my_categories") {
    state = { ...state, categoryMode: "system", category: undefined };
  }

  // ビュー補正後に facet の季節件数が temp 向けなら再取得が理想だが、
  // モックは buildFacets が query.coordinateView を見るので、補正時のみ再リクエスト
  let facetsSource = apiFacets;
  let list = listPage;
  if (
    state.coordinateView !== (query.coordinateView ?? "season") ||
    state.categoryMode !== (query.categoryMode ?? "system")
  ) {
    const retryQuery = toOwnerListQuery(state);
    list = summary.isOwnerView
      ? await getOwnerListPage(mode, user.id, retryQuery, {
          includeFacets: true,
        })
      : await getPublicProfileListPage(mode, user.id, retryQuery, {
          includeFacets: true,
        });
    facetsSource = list.facets;
  }

  const bio = profileApi.bio?.trim() ?? "";
  const profileLinks = profileApi.profile_links ?? [];
  const sns = profileApi.sns ?? [];
  const publicSize = profileApi.public_size ?? [];

  const profile: MypageProfile = {
    user: summary.user,
    isOwnerView: summary.isOwnerView,
    coordinateCount:
      facetsSource?.coordinateCount ?? summary.coordinateCount,
    itemCount: facetsSource?.itemCount ?? summary.itemCount,
    declutterCount:
      facetsSource?.declutterCount ?? summary.declutterCount,
    bio,
    profileLinks,
    sns,
    hasBio: bio.length > 0,
    hasMySize: summary.isOwnerView
      ? isMySizeFilled(summary.mySize)
      : false,
    publicSize,
    hasPublicSize: publicSize.length > 0,
  };

  const facets: MypageFacets = {
    seasonCounts: facetsSource?.seasonCounts ?? summary.seasonCounts,
    myFolders: facetsSource?.myFolders ?? summary.myFolders,
    itemCategories: facetsSource?.itemCategories ?? summary.itemCategories,
    itemMyCategories:
      facetsSource?.itemMyCategories ?? summary.itemMyCategories,
    itemDeclutterCategories:
      facetsSource?.itemDeclutterCategories ??
      summary.itemDeclutterCategories,
    hasMyFolders: false,
    hasMyCategories: false,
  };

  return {
    profile,
    facets,
    state,
    list: {
      items: list.items,
      total: list.total,
      page: list.page,
      totalPages: list.totalPages,
      perPage: list.perPage,
    },
    visibilityById: summary.isOwnerView
      ? list.visibilityById
      : undefined,
  };
}

export function emptyMypageState(): MypageUrlState {
  return defaultMypageUrlState();
}

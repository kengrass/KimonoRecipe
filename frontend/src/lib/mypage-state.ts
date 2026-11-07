/**
 * マイページ一覧の URL 状態。
 * 語彙は公開検索／LIST_QUERY／OwnerListQuery に揃える（メンテコスト低減）。
 *
 * 共通:
 *   m=c|i     … coordinates|items（検索と同じ。省略＝コーデ）
 *   q=        … フリーテキスト
 *   season=   … 春|夏|秋|冬
 *   cat=      … システム category（アイテム）
 *   page=     … ページ（1 は省略）
 *
 * マイページ固有:
 *   my_folder=  … Myフォルダ id（未設定は unset を出す）
 *   temp=1      … 仮コーデ
 *   my_category= … Myカテゴリ名
 *   declutter=1 … 断捨離候補
 *   sort=       … 並べ替え（newest 以外）
 *
 * 旧キー（t/v/s/f/c/cm/p/o）は読み取り互換のみ。新規生成はしない。
 *
 * 例:
 *   /m/mckDemo
 *   /m/mckDemo?m=i
 *   /m/mckDemo?m=i&page=2&cat=袷
 *   /m/mckDemo?season=春
 *   /m/mckDemo?my_folder=favorite
 */
import { contentKindFromShort, contentKindToShort } from "./content-kind";
import { parsePositivePage } from "./pagination";
import type {
  MypageCoordinateSort,
  MypageCoordinateView,
  MypageItemCategoryMode,
  MypageItemSort,
  MypageMainTab,
  MypageSeason,
} from "./mypage-types";

export type MypageUrlState = {
  tab: MypageMainTab;
  coordinateView: MypageCoordinateView;
  season: MypageSeason;
  /** 選択中の Myフォルダ id（"unset" = 未設定） */
  myFolderId: string;
  category?: string;
  categoryMode: MypageItemCategoryMode;
  q: string;
  page: number;
  /** 並べ替え（タブに応じてコーデ／アイテム） */
  sort: MypageCoordinateSort | MypageItemSort;
  /** owner 一覧の公開／非公開（本人のみ） */
  status: "all" | "public" | "private";
};

/** URL／RSC searchParams。新キー＋旧キー（互換） */
export type MypageParamsInput = {
  m?: string;
  q?: string;
  season?: string;
  cat?: string;
  page?: string;
  my_folder?: string;
  temp?: string;
  my_category?: string;
  declutter?: string;
  sort?: string;
  /** owner: public|private */
  status?: string;
  /** @deprecated 旧: t=i → m=i */
  t?: string;
  /** @deprecated 旧: v=f|t */
  v?: string;
  /** @deprecated 旧: s → season */
  s?: string;
  /** @deprecated 旧: f → my_folder */
  f?: string;
  /** @deprecated 旧: c → cat / my_category */
  c?: string;
  /** @deprecated 旧: cm=my|dc */
  cm?: string;
  /** @deprecated 旧: p → page */
  p?: string;
  /** @deprecated 旧: o → sort */
  o?: string;
};

const SEASONS: readonly MypageSeason[] = ["all", "春", "夏", "秋", "冬"];

export function defaultMypageUrlState(
  partial: Partial<MypageUrlState> = {},
): MypageUrlState {
  return {
    tab: "coordinates",
    coordinateView: "season",
    season: "all",
    myFolderId: "unset",
    category: undefined,
    categoryMode: "system",
    q: "",
    page: 1,
    sort: "newest",
    status: "all",
    ...partial,
  };
}

function parseTab(raw: MypageParamsInput): MypageMainTab {
  if (raw.m != null && raw.m !== "") {
    return contentKindFromShort(raw.m) === "items" ? "items" : "coordinates";
  }
  return raw.t === "i" ? "items" : "coordinates";
}

function parseCoordinateView(raw: MypageParamsInput): MypageCoordinateView {
  if (raw.my_folder != null && raw.my_folder !== "") return "my_folder";
  if (raw.temp === "1" || raw.temp === "true") return "temp";
  if (raw.v === "f") return "my_folder";
  if (raw.v === "t") return "temp";
  return "season";
}

function parseSeason(raw?: string): MypageSeason {
  return (SEASONS as readonly string[]).includes(raw ?? "")
    ? (raw as MypageSeason)
    : "all";
}

function parsePage(raw?: string): number {
  return parsePositivePage(raw);
}

function parseSort(
  tab: MypageMainTab,
  raw?: string,
): MypageCoordinateSort | MypageItemSort {
  if (tab === "coordinates") {
    if (
      raw === "worn" ||
      raw === "links_desc" ||
      raw === "links_asc"
    ) {
      return raw;
    }
    return "newest";
  }
  if (
    raw === "category" ||
    raw === "links_desc" ||
    raw === "links_asc" ||
    raw === "favorite_desc" ||
    raw === "favorite_asc"
  ) {
    return raw;
  }
  return "newest";
}

function parseItemCategory(raw: MypageParamsInput): {
  categoryMode: MypageItemCategoryMode;
  category?: string;
} {
  if (raw.declutter === "1" || raw.declutter === "true" || raw.cm === "dc") {
    return {
      categoryMode: "declutter",
      category: raw.cat?.trim() || raw.c?.trim() || undefined,
    };
  }
  if (raw.my_category != null || raw.cm === "my") {
    return {
      categoryMode: "my_categories",
      category:
        raw.my_category?.trim() || raw.c?.trim() || undefined,
    };
  }
  return {
    categoryMode: "system",
    category: raw.cat?.trim() || raw.c?.trim() || undefined,
  };
}

function parseStatus(raw?: string): MypageUrlState["status"] {
  if (raw === "public" || raw === "private") return raw;
  return "all";
}

export function parseMypageParams(raw: MypageParamsInput): MypageUrlState {
  const tab = parseTab(raw);
  const q = raw.q?.trim() ?? "";
  const season = parseSeason(raw.season ?? raw.s);
  const page = parsePage(raw.page ?? raw.p);
  const sort = parseSort(tab, raw.sort ?? raw.o);
  const status = parseStatus(raw.status);

  if (tab === "items") {
    const { categoryMode, category } = parseItemCategory(raw);
    return defaultMypageUrlState({
      tab,
      q,
      page,
      sort,
      status,
      categoryMode,
      category,
    });
  }

  const coordinateView = parseCoordinateView(raw);
  const myFolderId =
    raw.my_folder?.trim() || raw.f?.trim() || "unset";

  return defaultMypageUrlState({
    tab,
    coordinateView,
    season: coordinateView === "season" ? season : "all",
    myFolderId: coordinateView === "my_folder" ? myFolderId : "unset",
    q,
    page,
    sort,
    status,
  });
}

export function patchMypageUrlState(
  state: MypageUrlState,
  patch: Partial<MypageUrlState>,
): MypageUrlState {
  const next = { ...state, ...patch };
  if (patch.page === undefined && Object.keys(patch).some((k) => k !== "page")) {
    next.page = 1;
  }
  if (next.tab === "coordinates") {
    next.category = undefined;
    next.categoryMode = "system";
  } else {
    next.coordinateView = "season";
    next.season = "all";
    next.myFolderId = "unset";
  }
  if (patch.tab !== undefined && patch.sort === undefined) {
    next.sort = "newest";
  }
  return next;
}

/** pathname + 契約語彙のクエリ（デフォルトは省略） */
export function buildMypageHref(
  pathname: string,
  state: MypageUrlState,
): string {
  const sp = new URLSearchParams();
  if (state.tab === "items") {
    sp.set("m", contentKindToShort("items"));
  }
  if (state.tab === "coordinates") {
    if (state.coordinateView === "my_folder") {
      sp.set("my_folder", state.myFolderId || "unset");
    } else if (state.coordinateView === "temp") {
      sp.set("temp", "1");
    } else if (state.season !== "all") {
      sp.set("season", state.season);
    }
  } else if (state.categoryMode === "my_categories") {
    // モードだけでもキーを出す（値なし＝Myカテゴリ一覧の「全て」）
    sp.set("my_category", state.category?.trim() ?? "");
  } else if (state.categoryMode === "declutter") {
    sp.set("declutter", "1");
    if (state.category) sp.set("cat", state.category);
  } else if (state.category) {
    sp.set("cat", state.category);
  }
  if (state.q.trim()) sp.set("q", state.q.trim());
  if (state.page > 1) sp.set("page", String(state.page));
  if (state.sort !== "newest") sp.set("sort", state.sort);
  if (state.status === "public" || state.status === "private") {
    sp.set("status", state.status);
  }
  const q = sp.toString();
  return q ? `${pathname}?${q}` : pathname;
}


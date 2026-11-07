/**
 * 検索画面の状態（URL・UI・カタログで共有）。
 *
 * 短いクエリキー → 意味:
 *   m=c|i|u   … mode=coordinates|items|users
 *   q=        … フリーテキスト
 *   tag=      … タグ完全一致（投稿のみ）
 *   g=        … gender（投稿のみ）
 *   season=   … 季節（投稿のみ）
 *   cat=      … システム category（投稿のみ）
 *   obi=      … 帯結び（コーデのみ）
 *   page=     … ページ（1 は省略）
 *
 * 会員コレクション（いいね／フォロー）は `/api/me/...` と別画面。公開検索 URL に scope は持たない。
 */
import {
  SEARCH_CATEGORIES,
  SEARCH_GENDERS,
  SEARCH_OBI_KNOTS,
  SEARCH_SEASONS,
  type SearchCategory,
  type SearchGender,
  type SearchMode,
  type SearchObiKnot,
  type SearchSeason,
} from "./search-filters";
import { searchModeFromShort, searchModeToShort } from "./content-kind";
import { parsePositivePage } from "./pagination";

/** 検索画面の状態（URL・UI・カタログで共有） */
export type SearchState = {
  mode: SearchMode;
  /**
   * URL に `m=` があるか。
   * 検索ボタン直入（`/search`）は false。もっと見る（`?m=c|i`）やタブ選択後は true。
   */
  modeExplicit: boolean;
  q?: string;
  tag?: string;
  gender: SearchGender;
  season?: SearchSeason;
  category?: SearchCategory;
  obi?: SearchObiKnot;
  page: number;
};

export type SearchParamsInput = {
  m?: string;
  q?: string;
  tag?: string;
  g?: string;
  season?: string;
  cat?: string;
  obi?: string;
  page?: string;
};

function parseMode(raw?: string): SearchMode {
  return searchModeFromShort(raw);
}

function parseGender(raw?: string): SearchGender {
  return SEARCH_GENDERS.find((g) => g.value === raw)?.value ?? "all";
}

function parseSeason(raw?: string): SearchSeason | undefined {
  return (SEARCH_SEASONS as readonly string[]).includes(raw ?? "")
    ? (raw as SearchSeason)
    : undefined;
}

function parseCategory(raw?: string): SearchCategory | undefined {
  return (SEARCH_CATEGORIES as readonly string[]).includes(raw ?? "")
    ? (raw as SearchCategory)
    : undefined;
}

function parseObi(raw?: string): SearchObiKnot | undefined {
  return (SEARCH_OBI_KNOTS as readonly string[]).includes(raw ?? "")
    ? (raw as SearchObiKnot)
    : undefined;
}

/** URL searchParams → SearchState */
export function parseSearchParams(raw: SearchParamsInput): SearchState {
  const q = raw.q?.trim() || undefined;
  const tag = raw.tag?.trim() || undefined;
  const modeExplicit = Boolean(raw.m?.trim());
  const mode = parseMode(raw.m);
  if (mode === "users") {
    return {
      mode,
      modeExplicit,
      q,
      gender: "all",
      page: parsePositivePage(raw.page),
    };
  }
  return {
    mode,
    modeExplicit,
    q,
    tag,
    gender: parseGender(raw.g),
    season: parseSeason(raw.season),
    category: parseCategory(raw.cat),
    obi: parseObi(raw.obi),
    page: parsePositivePage(raw.page),
  };
}

/** 部分更新（page は明示されない限り 1 に戻す） */
export function patchSearchState(
  state: SearchState,
  patch: Partial<SearchState>,
): SearchState {
  const next = { ...state, ...patch };
  if (patch.page === undefined && Object.keys(patch).some((k) => k !== "page")) {
    next.page = 1;
  }
  if (next.mode === "users") {
    next.tag = undefined;
    next.season = undefined;
    next.category = undefined;
    next.obi = undefined;
    next.gender = "all";
  } else if (next.mode === "items") {
    next.obi = undefined;
  }
  return next;
}

export function hasActiveFilters(state: SearchState): boolean {
  if (state.mode === "users") return Boolean(state.q);
  return Boolean(
    state.q ||
      state.tag ||
      state.season ||
      state.category ||
      state.obi ||
      state.gender !== "all",
  );
}

/**
 * 結果一覧を出すか。
 * - 検索ボタン直入（m なし・条件なし）→ 出さない
 * - もっと見る（m あり）／条件あり／ユーザーで q あり → 出す
 */
export function shouldShowSearchResults(state: SearchState): boolean {
  if (state.mode === "users") return Boolean(state.q?.trim());
  return state.modeExplicit || hasActiveFilters(state);
}

/** SearchState → 検索URL（省略可能なデフォルトは出さない） */
export function buildSearchHref(
  state: Partial<SearchState> & Pick<SearchState, "mode">,
  pathname: string = "/search",
): string {
  const sp = new URLSearchParams();
  sp.set("m", searchModeToShort(state.mode));
  if (state.q?.trim()) sp.set("q", state.q.trim());
  if (state.mode !== "users") {
    if (state.tag) sp.set("tag", state.tag);
    if (state.gender && state.gender !== "all") sp.set("g", state.gender);
    if (state.season) sp.set("season", state.season);
    if (state.category) sp.set("cat", state.category);
    if (state.obi) sp.set("obi", state.obi);
  }
  if (state.page && state.page > 1) sp.set("page", String(state.page));
  return `${pathname}?${sp.toString()}`;
}

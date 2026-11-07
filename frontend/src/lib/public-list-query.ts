/**
 * 公開一覧の絞り込み（サーバ側の正）。
 *
 * フロントで再フィルタしない。API／RSC がこれを通した結果だけを返す。
 * @see docs/LIST_QUERY_ARCHITECTURE.md
 */
import { LIST_PAGE_SIZE, paginateList, type PaginatedResult } from "./pagination";
import type { ContentKind } from "./content-kind";
import type {
  SearchCategory,
  SearchGender,
  SearchObiKnot,
  SearchSeason,
} from "./search-filters";
import type { SearchState } from "./search-state";
import type { PublicListItem } from "./types";

export type PublicListQuery = {
  q?: string;
  tag?: string;
  /**
   * 投稿者ユーザー ID（他人プロフィール一覧）。
   * 公開コンテンツのみ。owner／非公開は載せない。
   */
  user?: string;
  /** all または省略で性別フィルタなし */
  gender?: SearchState["gender"];
  season?: SearchState["season"];
  category?: SearchState["category"];
  obi?: SearchState["obi"];
  page?: number;
  perPage?: number;
  /** マイページ／他人プロフィール一覧の並べ替え（公開検索では未使用） */
  sort?: string;
};

/** SearchState → 公開一覧クエリ */
export function publicListQueryFromSearchState(
  state: SearchState,
): PublicListQuery {
  return {
    q: state.q,
    tag: state.tag,
    gender: state.gender,
    season: state.season,
    category: state.category,
    obi: state.obi,
    page: state.page,
  };
}

/** リクエスト URL → PublicListQuery（モック route / 将来の共通パース） */
export function parsePublicListQueryFromUrl(
  url: URL,
  mode: ContentKind,
): PublicListQuery {
  const g = url.searchParams.get("g") ?? undefined;
  const season = url.searchParams.get("season") ?? undefined;
  const perPageRaw = Number(url.searchParams.get("per_page") ?? "");
  const query: PublicListQuery = {
    q: url.searchParams.get("q") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    user: url.searchParams.get("user") ?? undefined,
    gender: (g as SearchGender | undefined) ?? "all",
    season: season as SearchSeason | undefined,
    page: Number(url.searchParams.get("page") ?? "1") || 1,
    perPage: perPageRaw > 0 ? perPageRaw : LIST_PAGE_SIZE,
  };
  const cat = url.searchParams.get("cat") ?? undefined;
  if (cat) query.category = cat as SearchCategory | undefined;
  if (mode === "coordinates") {
    const obi = url.searchParams.get("obi") ?? undefined;
    query.obi = obi as SearchObiKnot | undefined;
  }
  return query;
}

/** URLSearchParams / リクエスト用 */
export function publicListQueryToSearchParams(
  query: PublicListQuery,
  mode: ContentKind,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.tag) sp.set("tag", query.tag);
  if (query.user?.trim()) sp.set("user", query.user.trim());
  if (query.gender && query.gender !== "all") sp.set("g", query.gender);
  if (query.season) sp.set("season", query.season);
  if (query.category) sp.set("cat", query.category);
  if (mode === "coordinates" && query.obi) sp.set("obi", query.obi);
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.perPage && query.perPage !== LIST_PAGE_SIZE) {
    sp.set("per_page", String(query.perPage));
  }
  if (query.sort && query.sort !== "newest") sp.set("sort", query.sort);
  return sp;
}

/**
 * 公開一覧プールに条件を適用（ページング前）。
 * 呼び出し側で先に「公開のみ」にすること。
 */
export function filterPublicListItems(
  items: PublicListItem[],
  mode: ContentKind,
  query: PublicListQuery,
): PublicListItem[] {
  let next = items;

  const q = query.q?.trim().toLowerCase();
  if (q) {
    next = next.filter((item) => {
      const haystack = [item.title, item.user.name, ...item.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (query.user?.trim()) {
    const userId = query.user.trim();
    next = next.filter((item) => item.user.id === userId);
  }

  if (query.tag) {
    next = next.filter((item) => item.tags.includes(query.tag!));
  }

  if (query.gender && query.gender !== "all") {
    next = next.filter((item) => item.gender === query.gender);
  }

  if (query.season) {
    next = next.filter((item) => item.seasons.includes(query.season!));
  }

  if (query.category) {
    next = next.filter((item) => {
      if (mode === "items") {
        if (item.category === query.category) return true;
        const cats = (item as PublicListItem & { categories?: string[] })
          .categories;
        return cats?.includes(query.category!) ?? false;
      }
      // コーデ: モックは tags／categories に載っている場合のみ（spike はサーバ EXISTS）
      const cats = (item as PublicListItem & { categories?: string[] })
        .categories;
      if (cats?.includes(query.category!)) return true;
      return item.tags.includes(query.category!);
    });
  }

  if (mode === "coordinates" && query.obi) {
    next = next.filter((item) => {
      if (item.obi_knot === query.obi) return true;
      const knots = (item as PublicListItem & { obiKnots?: string[] })
        .obiKnots;
      return knots?.includes(query.obi!) ?? false;
    });
  }

  return next;
}

/** 絞り込み＋ページング（API／RSC が返す形に相当） */
export function queryPublicList(
  items: PublicListItem[],
  mode: ContentKind,
  query: PublicListQuery,
): PaginatedResult<PublicListItem> {
  const filtered = filterPublicListItems(items, mode, query);
  return paginateList(
    filtered,
    query.page ?? 1,
    query.perPage ?? LIST_PAGE_SIZE,
  );
}

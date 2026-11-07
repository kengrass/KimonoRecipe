import type { Metadata } from "next";
import { SearchView } from "@/base/SearchView";
import { getPublicListPage, getPublicUsersPage } from "@/lib/api";
import { LIST_PAGE_SIZE, type PaginatedResult } from "@/lib/pagination";
import { publicListQueryFromSearchState } from "@/lib/public-list-query";
import { publicUserListQueryFromSearch } from "@/lib/public-user-query";
import {
  parseSearchParams,
  shouldShowSearchResults,
} from "@/lib/search-state";
import { buildSearchMetadata } from "@/lib/seo";
import type { PublicListItem, PublicUserListItem } from "@/lib/types";

function emptyPage<T>(page: number): PaginatedResult<T> {
  return {
    items: [],
    total: 0,
    page,
    totalPages: 1,
    perPage: LIST_PAGE_SIZE,
  };
}

type Props = {
  searchParams: Promise<{
    m?: string;
    q?: string;
    tag?: string;
    g?: string;
    season?: string;
    cat?: string;
    obi?: string;
    page?: string;
  }>;
};

/** カテゴリ／帯結びランディングは index。その他の条件付き検索は noindex。 */
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const state = parseSearchParams(await searchParams);
  return buildSearchMetadata(state);
}

/** Next の公開検索（サーバで絞ってから描画） */
export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parseSearchParams(params);

  if (!shouldShowSearchResults(state)) {
    if (state.mode === "users") {
      return (
        <SearchView
          state={state}
          usersResult={emptyPage<PublicUserListItem>(state.page)}
        />
      );
    }
    return (
      <SearchView
        state={state}
        result={emptyPage<PublicListItem>(state.page)}
      />
    );
  }

  if (state.mode === "users") {
    const usersResult = await getPublicUsersPage(
      publicUserListQueryFromSearch(state.q, state.page),
    );
    return <SearchView state={state} usersResult={usersResult} />;
  }

  const result = await getPublicListPage(
    state.mode,
    publicListQueryFromSearchState(state),
  );
  return <SearchView state={state} result={result} />;
}

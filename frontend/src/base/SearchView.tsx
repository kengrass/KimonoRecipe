"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CollectionList } from "@/base/collection/CollectionList";
import { PageShell } from "@/base/PageShell";
import { SearchFilters } from "@/base/SearchFilters";
import { SearchUserResults } from "@/base/SearchUserResults";
import type { PaginatedResult } from "@/lib/pagination";
import { SEARCH_RESULTS_ID } from "@/lib/search-ids";
import {
  buildSearchHref,
  hasActiveFilters,
  shouldShowSearchResults,
  type SearchState,
} from "@/lib/search-state";
import type { PublicListItem, PublicUserListItem } from "@/lib/types";

export { SEARCH_RESULTS_ID } from "@/lib/search-ids";

type ContentProps = {
  state: SearchState;
  result: PaginatedResult<PublicListItem>;
};

type UsersProps = {
  state: SearchState;
  usersResult: PaginatedResult<PublicUserListItem>;
};

type Props = ContentProps | UsersProps;

function isUsersProps(props: Props): props is UsersProps {
  return "usersResult" in props;
}

/**
 * 公開検索の表示。
 * 絞り込み結果は RSC／API 側で用意する（ここでは再フィルタしない）。
 */
export function SearchView(props: Props) {
  const { state } = props;
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef<number | null>(null);
  const page = isUsersProps(props) ? props.usersResult.page : props.result.page;
  const showResults = shouldShowSearchResults(state);

  useEffect(() => {
    if (!showResults) return;
    const prev = prevPageRef.current;
    prevPageRef.current = page;

    if (prev === null) {
      if (page <= 1) return;
    } else if (prev === page) {
      return;
    }

    const el = resultsRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }, [page, showResults]);

  return (
    <PageShell className="page-enter pb-8 md:pb-10">
      <SearchFilters state={state} />

      <div ref={resultsRef} className="mt-5" tabIndex={-1}>
        {!showResults ? (
          <p className="mt-8 text-center text-sm text-kr-muted" aria-live="polite">
            キーワードや条件を指定して検索してください。
          </p>
        ) : isUsersProps(props) ? (
          <SearchUserResults state={state} result={props.usersResult} />
        ) : (
          <ContentSearchResults state={state} result={props.result} />
        )}
      </div>
    </PageShell>
  );
}

function ContentSearchResults({
  state,
  result,
}: {
  state: SearchState;
  result: PaginatedResult<PublicListItem>;
}) {
  const modeLabel =
    state.mode === "items" ? "アイテム" : "コーディネート";
  const kind = state.mode === "items" ? "items" : "coordinates";

  return (
    <CollectionList
      kind={kind}
      items={result.items}
      browseLabel="検索結果"
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
      withTitles={false}
      prefetchFromIndex={9}
      resultsId={SEARCH_RESULTS_ID}
      aria-label={`${modeLabel}の検索結果`}
      getPageHref={(p) =>
        `${buildSearchHref({ ...state, page: p })}#${SEARCH_RESULTS_ID}`
      }
      empty={
        <p
          className="mt-8 text-center text-sm text-kr-muted"
          aria-live="polite"
        >
          該当する{modeLabel}がありません。
          {hasActiveFilters(state) ? (
            <>
              {" "}
              <Link
                href={buildSearchHref({ mode: kind })}
                className="text-kr-link hover:underline"
              >
                条件をクリア
              </Link>
            </>
          ) : null}
        </p>
      }
    />
  );
}

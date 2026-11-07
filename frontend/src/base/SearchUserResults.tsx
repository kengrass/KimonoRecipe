"use client";

import Link from "next/link";
import { PaginationBar } from "@/base/PaginationBar";
import { UserAvatar } from "@/base/ui/UserAvatar";
import type { PaginatedResult } from "@/lib/pagination";
import { SEARCH_RESULTS_ID } from "@/lib/search-ids";
import {
  buildSearchHref,
  hasActiveFilters,
  type SearchState,
} from "@/lib/search-state";
import type { PublicUserListItem } from "@/lib/types";

type Props = {
  state: SearchState;
  result: PaginatedResult<PublicUserListItem>;
};

/** 検索：ユーザー結果（名刺カードの行リスト） */
export function SearchUserResults({ state, result }: Props) {
  if (!state.q?.trim()) {
    return (
      <p className="mt-8 text-center text-sm text-kr-muted" aria-live="polite">
        ユーザー名を入力して検索してください。
      </p>
    );
  }

  if (result.items.length === 0) {
    return (
      <p
        className="mt-8 text-center text-sm text-kr-muted"
        aria-live="polite"
      >
        該当するユーザーがありません。
        {hasActiveFilters(state) ? (
          <>
            {" "}
            <Link
              href={buildSearchHref({ mode: "users" })}
              className="text-kr-link hover:underline"
            >
              条件をクリア
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div>
      <ul
        id={SEARCH_RESULTS_ID}
        className="divide-y divide-kr-border border-y border-kr-border"
        aria-label="ユーザーの検索結果"
      >
        {result.items.map((user) => (
          <li key={user.id}>
            <Link
              href={user.profile_url}
              className="flex items-start gap-3 px-1 py-3.5 transition hover:bg-neutral-50 sm:px-2"
            >
              <UserAvatar
                name={user.name}
                seed={user.id}
                src={user.avatar_url}
                className="h-11 w-11 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-kr-text">
                  {user.name}
                </span>
                {user.bio?.trim() ? (
                  <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-kr-muted">
                    {user.bio.trim()}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {result.totalPages > 1 ? (
        <PaginationBar
          page={result.page}
          totalPages={result.totalPages}
          getPageHref={(p) =>
            `${buildSearchHref({ ...state, page: p })}#${SEARCH_RESULTS_ID}`
          }
        />
      ) : null}
    </div>
  );
}

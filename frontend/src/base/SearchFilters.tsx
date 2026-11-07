"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SEARCH_FILTER_CATEGORIES,
  SEARCH_GENDERS,
  SEARCH_OBI_KNOTS,
  SEARCH_SEASONS,
  type SearchCategory,
  type SearchGender,
  type SearchMode,
  type SearchObiKnot,
  type SearchSeason,
} from "@/lib/search-filters";
import {
  buildSearchHref,
  patchSearchState,
  type SearchState,
} from "@/lib/search-state";
import { FilterSelect } from "@/base/ui/FilterSelect";

type Props = {
  state: SearchState;
};

const Q_DEBOUNCE_MS = 300;

export function SearchFilters({ state }: Props) {
  const router = useRouter();
  const { mode, modeExplicit, q, tag, gender, season, category, obi } = state;
  const [draftQ, setDraftQ] = useState(q ?? "");

  useEffect(() => {
    setDraftQ(q ?? "");
  }, [q]);

  const go = (patch: Partial<SearchState>, replace = false) => {
    const href = buildSearchHref(patchSearchState(state, patch));
    if (replace) router.replace(href, { scroll: false });
    else router.push(href);
  };

  useEffect(() => {
    const next = draftQ.trim();
    const current = (q ?? "").trim();
    if (next === current) return;

    const timer = window.setTimeout(() => {
      router.replace(
        buildSearchHref(patchSearchState(state, { q: next || undefined })),
        { scroll: false },
      );
    }, Q_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draftQ, q, state, router]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(
          [
            { value: "coordinates" as const, label: "コーデ" },
            { value: "items" as const, label: "アイテム" },
            { value: "users" as const, label: "ユーザー" },
          ] as const
        ).map((tab) => {
          // 検索直入（m なし）ではどのタブも未選択。タップで m= が付き一覧が出る
          const active = modeExplicit && mode === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => go({ mode: tab.value as SearchMode })}
              aria-current={active ? "page" : undefined}
              className={`flex-1 rounded border py-2.5 text-center text-sm font-medium ${
                active
                  ? "border-kr-navy bg-kr-navy text-white"
                  : "border-kr-border text-kr-text hover:bg-neutral-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="sr-only" htmlFor="search-q">
          {mode === "users" ? "ユーザー名" : "キーワード"}
        </label>
        <input
          id="search-q"
          type="search"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const next = draftQ.trim();
            if (next === (q ?? "").trim()) return;
            go({ q: next || undefined }, true);
          }}
          placeholder={
            mode === "users" ? "ユーザー名で検索" : "キーワード検索"
          }
          className="w-full rounded border border-kr-border px-3 py-2 text-sm text-kr-text outline-none focus:border-kr-navy"
        />
      </div>

      {mode !== "users" ? (
        <>
          {tag ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-kr-muted">タグ</span>
              <button
                type="button"
                onClick={() => go({ tag: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-kr-border bg-white px-2.5 py-0.5 text-kr-link hover:bg-neutral-50"
                aria-label={`タグ ${tag} を解除`}
              >
                #{tag}
                <span aria-hidden>×</span>
              </button>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <FilterSelect
              label="性別"
              value={gender}
              unsetValue="all"
              onChange={(v) => go({ gender: v as SearchGender })}
              options={SEARCH_GENDERS.filter((g) => g.value !== "all").map(
                (g) => ({
                  value: g.value,
                  label: g.label,
                }),
              )}
            />
            <FilterSelect
              label="季節"
              value={season ?? ""}
              onChange={(v) =>
                go({
                  season: (v || undefined) as SearchSeason | undefined,
                })
              }
              options={SEARCH_SEASONS.map((s) => ({ value: s, label: s }))}
            />
            <FilterSelect
              label="カテゴリ"
              value={category ?? ""}
              onChange={(v) =>
                go({
                  category: (v || undefined) as SearchCategory | undefined,
                })
              }
              options={SEARCH_FILTER_CATEGORIES.map((c) => ({
                value: c,
                label: c,
              }))}
            />
            {mode === "coordinates" ? (
              <FilterSelect
                label="帯結び"
                value={obi ?? ""}
                onChange={(v) =>
                  go({ obi: (v || undefined) as SearchObiKnot | undefined })
                }
                options={SEARCH_OBI_KNOTS.map((k) => ({ value: k, label: k }))}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

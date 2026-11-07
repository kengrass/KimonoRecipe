"use client";

import Link from "next/link";
import {
  SEARCH_OBI_KNOTS,
  type SearchObiKnot,
} from "@/lib/search-filters";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { buildSearchHref } from "@/lib/search-state";
import { metaValueLinkClass } from "@/base/ui/metaChipClass";

type Props = {
  name: string;
};

function toObiParam(name: string): SearchObiKnot | undefined {
  return (SEARCH_OBI_KNOTS as readonly string[]).includes(name)
    ? (name as SearchObiKnot)
    : undefined;
}

/**
 * 帯結びの値。タップで同条件の検索へ。ラベルは親のメタ行で出す。
 */
export function ObiKnotChip({ name }: Props) {
  const label = name.trim();
  if (!label) return null;

  const obi = toObiParam(label);
  const href = obi
    ? buildSearchHref({ mode: "coordinates", obi }, APP_ROUTES.search)
    : buildSearchHref({ mode: "coordinates", q: label }, APP_ROUTES.search);

  return (
    <Link
      href={href}
      className={metaValueLinkClass}
      aria-label={`${label}のコーデを検索`}
      title="同じ帯結びのコーデを検索"
    >
      {label}
    </Link>
  );
}

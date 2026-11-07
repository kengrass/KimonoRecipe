"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BrowseContext } from "@/lib/browse";
import { ChevronNext, ChevronPrev } from "./icons/ChevronIcons";
import {
  consumeBrowseBack,
  markBrowseNeighbor,
} from "@/base/ListFocusRestore";

type Props = {
  browse: BrowseContext;
  trackListFocus?: boolean;
};

export function BrowseBar({ browse, trackListFocus = true }: Props) {
  const router = useRouter();
  const backHref = browse.backHref;
  const prevHref = browse.prev?.detail_url;
  const nextHref = browse.next?.detail_url;

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [nextHref, prevHref, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Escape") {
        e.preventDefault();
        router.push(consumeBrowseBack());
        return;
      }
      if (e.key === "ArrowLeft" && browse.prev && prevHref) {
        e.preventDefault();
        markBrowseNeighbor(browse.kind, browse.prev, trackListFocus);
        router.push(prevHref);
      }
      if (e.key === "ArrowRight" && browse.next && nextHref) {
        e.preventDefault();
        markBrowseNeighbor(browse.kind, browse.next, trackListFocus);
        router.push(nextHref);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [browse, nextHref, prevHref, router, trackListFocus]);

  return (
    <nav
      className="browse-bar detail-inset mb-[var(--kr-browse-bar-gap)] flex h-[var(--kr-browse-bar-height)] items-center justify-between gap-2 text-sm"
      aria-label="前後の投稿と戻り"
    >
      <Link
        href={backHref}
        className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-sm text-kr-link hover:bg-neutral-100"
        prefetch
        aria-label={
          browse.backLabel === "戻る" ? "一つ前の詳細に戻る" : "一覧に戻る"
        }
        onClick={() => {
          consumeBrowseBack();
        }}
      >
        <ChevronPrev className="h-3.5 w-3.5" />
        {browse.backLabel}
      </Link>

      <div className="flex shrink-0 items-center">
        {browse.prev && prevHref ? (
          <Link
            href={prevHref}
            className="flex h-7 w-7 items-center justify-center rounded text-kr-muted/70 transition hover:bg-neutral-100 hover:text-kr-text"
            prefetch
            title={browse.prev.title}
            aria-label="前の投稿"
            onClick={() =>
              markBrowseNeighbor(browse.kind, browse.prev, trackListFocus)
            }
          >
            <ChevronPrev className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span
            className="flex h-7 w-7 items-center justify-center text-kr-muted/25"
            aria-hidden
          >
            <ChevronPrev className="h-3.5 w-3.5" />
          </span>
        )}
        {browse.next && nextHref ? (
          <Link
            href={nextHref}
            className="flex h-7 w-7 items-center justify-center rounded text-kr-muted/70 transition hover:bg-neutral-100 hover:text-kr-text"
            prefetch
            title={browse.next.title}
            aria-label="次の投稿"
            onClick={() =>
              markBrowseNeighbor(browse.kind, browse.next, trackListFocus)
            }
          >
            <ChevronNext className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span
            className="flex h-7 w-7 items-center justify-center text-kr-muted/25"
            aria-hidden
          >
            <ChevronNext className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}

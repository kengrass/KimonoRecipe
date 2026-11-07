"use client";

import Link from "next/link";
import type { BrowseContext } from "@/lib/browse";
import { ChevronNext, ChevronPrev } from "./icons/ChevronIcons";
import { markBrowseNeighbor } from "@/base/ListFocusRestore";

type Props = {
  browse: BrowseContext;
  trackListFocus?: boolean;
};

/** PC: 画面端クリックで前後投稿へ（一覧連動） */
export function PostEdgeNav({
  browse,
  trackListFocus = true,
}: Props) {
  const prevHref = browse.prev?.detail_url;
  const nextHref = browse.next?.detail_url;

  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 right-0 z-20 hidden md:block">
      {browse.prev && prevHref ? (
        <Link
          href={prevHref}
          prefetch
          className="pointer-events-auto absolute inset-y-0 left-0 flex w-[8vw] max-w-20 items-center justify-start bg-gradient-to-r from-black/5 to-transparent pl-2 text-kr-navy/40 opacity-0 transition hover:opacity-100"
          aria-label="前の投稿"
          title={browse.prev.title}
          onClick={() =>
            markBrowseNeighbor(browse.kind, browse.prev, trackListFocus)
          }
        >
          <ChevronPrev className="h-8 w-8" />
        </Link>
      ) : null}
      {browse.next && nextHref ? (
        <Link
          href={nextHref}
          prefetch
          className="pointer-events-auto absolute inset-y-0 right-0 flex w-[8vw] max-w-20 items-center justify-end bg-gradient-to-l from-black/5 to-transparent pr-2 text-kr-navy/40 opacity-0 transition hover:opacity-100"
          aria-label="次の投稿"
          title={browse.next.title}
          onClick={() =>
            markBrowseNeighbor(browse.kind, browse.next, trackListFocus)
          }
        >
          <ChevronNext className="h-8 w-8" />
        </Link>
      ) : null}
    </div>
  );
}

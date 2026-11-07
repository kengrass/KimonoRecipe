"use client";

import type { ReactNode } from "react";
import type { BrowseContext } from "@/lib/browse";
import { BrowseBar } from "./BrowseBar";
import { PageShell } from "@/base/PageShell";
import { PostEdgeNav } from "./PostEdgeNav";

type Props = {
  browse: BrowseContext;
  trackListFocus?: boolean;
  children: ReactNode;
};

/** 詳細ページの共通シェル（BrowseBar + 端ナビ） */
export function DetailShell({
  browse,
  trackListFocus = true,
  children,
}: Props) {
  return (
    <PageShell>
      <div className="relative">
        <PostEdgeNav browse={browse} trackListFocus={trackListFocus} />
        <BrowseBar browse={browse} trackListFocus={trackListFocus} />
        {children}
      </div>
    </PageShell>
  );
}

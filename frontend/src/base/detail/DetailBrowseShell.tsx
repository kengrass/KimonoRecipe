"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { BrowseKind } from "@/lib/browse";
import { buildBrowseContext } from "@/lib/browse";
import { resolveBrowseList } from "@/lib/detail-browse";
import type { PublicListItem } from "@/lib/types";
import { DetailShell } from "./DetailShell";
import { readBrowseBack } from "@/base/ListFocusRestore";

type Props = {
  kind: BrowseKind;
  id: string;
  homeList: PublicListItem[];
  children: ReactNode;
};

/** 詳細の Browse 文脈を組み立てて DetailShell に渡す */
export function DetailBrowseShell({ kind, id, homeList, children }: Props) {
  /**
   * 一覧クリックで sessionStorage に載せた前後文脈は SSR では読めない。
   * 初回マウント直後にもう一度 resolve しないと、常に homeList（新着1ページ）基準になり、
   * 「いま見えている一覧の先頭」なのに < が有効、といったずれが起きる。
   */
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    setSessionReady(true);
  }, []);

  const { browse, trackListFocus } = useMemo(() => {
    const resolved = sessionReady
      ? resolveBrowseList(kind, id, homeList)
      : { list: homeList, label: "", trackListFocus: true };
    const back = sessionReady
      ? readBrowseBack()
      : { href: "/", label: "一覧" as const };
    const ctx = buildBrowseContext(
      kind,
      id,
      resolved.list,
      back.href,
      back.label,
    );
    // ハイドレーション一致のため、セッション反映前は端ナビを出さない
    if (!sessionReady) {
      return {
        trackListFocus: resolved.trackListFocus,
        browse: { ...ctx, prev: null, next: null },
      };
    }
    return {
      trackListFocus: resolved.trackListFocus,
      browse: ctx,
    };
  }, [kind, id, homeList, sessionReady]);

  return (
    <DetailShell browse={browse} trackListFocus={trackListFocus}>
      {children}
    </DetailShell>
  );
}

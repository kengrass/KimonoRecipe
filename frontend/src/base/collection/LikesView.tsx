"use client";

import {
  CollectionGuestGate,
  CollectionModeBar,
} from "@/base/collection/CollectionChrome";
import { CollectionList } from "@/base/collection/CollectionList";
import type { LikesPagePayload } from "@/base/collection/load-collection";
import { PageShell } from "@/base/PageShell";
import { buildLikesHref } from "@/lib/collection-page";
import { contentKindLabel } from "@/lib/content-kind";

type Props = {
  payload: LikesPagePayload;
};

const RESULTS_ID = "likes-results";

/**
 * Next・お気に入り（ゼロベース）。
 * 探す一覧：モード切替＋タイトル付きタイル＋ページ。未ログインは API なし。
 */
export function LikesView({ payload }: Props) {
  if (payload.kind === "guest") {
    return (
      <PageShell className="page-enter pb-8 md:pb-10">
        <CollectionGuestGate
          title="お気に入り"
          body="いいねしたコーデとアイテムが、ここに集まります。検索ではなく、見返すための一覧です。"
        />
      </PageShell>
    );
  }

  const { mode, list, counts } = payload;
  const modeLabel = contentKindLabel(mode, "long");

  return (
    <PageShell className="page-enter pb-8 md:pb-10">
      <h1 className="text-base font-semibold text-kr-text">お気に入り</h1>

      <div className="mt-3">
        <CollectionModeBar
          mode={mode}
          counts={counts}
          hrefFor={(m) => buildLikesHref({ mode: m })}
        />
      </div>

      <div className="mt-4">
        <CollectionList
          kind={mode}
          items={list.items}
          browseLabel="お気に入り"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          getPageHref={(p) => buildLikesHref({ mode, page: p })}
          resultsId={RESULTS_ID}
          withTitles
          empty={
            <p className="py-8 text-center text-sm text-kr-muted">
              まだお気に入りの{modeLabel}がありません。
            </p>
          }
        />
      </div>
    </PageShell>
  );
}

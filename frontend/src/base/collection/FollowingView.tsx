"use client";

import { CollectionGuestGate, CollectionModeBar } from "@/base/collection/CollectionChrome";
import { CollectionList } from "@/base/collection/CollectionList";
import { FollowingPeopleSection } from "@/base/collection/FollowingPeopleSection";
import { ScrollToHash } from "@/base/collection/ScrollToHash";
import type { FollowingPagePayload } from "@/base/collection/load-collection";
import { PageShell } from "@/base/PageShell";
import { buildFollowingHref } from "@/lib/collection-page";
import { contentKindLabel } from "@/lib/content-kind";

type Props = {
  payload: FollowingPagePayload;
  viewerUserId: string | null;
};

const RESULTS_ID = "following-results";

/**
 * Next・フォロー（ゼロベース）。
 *
 * 会員: 投稿一覧が主、人リストは下（探す／眺めるの主従をはっきり）。
 * 未ログイン: 誘導＋おすすめのみ（投稿 API は叩かない）。
 */
export function FollowingView({ payload, viewerUserId }: Props) {
  if (payload.kind === "guest") {
    return (
      <PageShell className="page-enter pb-8 md:pb-10">
        <ScrollToHash />
        <CollectionGuestGate
          title="フォロー"
          body="ログインすると、フォローした人のコーデとアイテムがここに並びます。"
        />
        <div className="mt-10 border-t border-kr-border pt-8">
          <FollowingPeopleSection
            initialFollowing={[]}
            initialPickup={payload.pickup}
            viewerId={null}
          />
        </div>
      </PageShell>
    );
  }

  const { mode, list, following, pickup } = payload;
  const modeLabel = contentKindLabel(mode, "long");

  return (
    <PageShell className="page-enter pb-8 md:pb-10">
      <ScrollToHash />

      <header className="flex items-baseline justify-between gap-3">
        <h1 className="min-w-0 text-base font-semibold text-kr-text">
          フォローした人の投稿
        </h1>
        <a
          href="#follow-list"
          className="shrink-0 text-sm text-kr-link hover:underline"
          onClick={(e) => {
            const el = document.getElementById("follow-list");
            if (!el) return;
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", "#follow-list");
          }}
        >
          フォローリスト
        </a>
      </header>

      <div className="mt-3">
        <CollectionModeBar
          mode={mode}
          showCounts={false}
          hrefFor={(m) => buildFollowingHref({ mode: m })}
        />
      </div>

      <div className="mt-4" id="posts">
        <CollectionList
          kind={mode}
          items={list.items}
          browseLabel="フォロー中"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          getPageHref={(p) => buildFollowingHref({ mode, page: p })}
          resultsId={RESULTS_ID}
          withTitles
          empty={
            <p className="py-6 text-sm text-kr-muted">
              まだ{modeLabel}がありません。フォローリストの「おすすめ」から追加できます。
            </p>
          }
        />
      </div>

      <div className="mt-10 border-t border-kr-border pt-8">
        <FollowingPeopleSection
          initialFollowing={following}
          initialPickup={pickup}
          viewerId={viewerUserId}
        />
      </div>
    </PageShell>
  );
}

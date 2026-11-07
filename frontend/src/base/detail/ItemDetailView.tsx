"use client";

/**
 * アイテム詳細。データ組立は `load-detail.ts`。紐付けは Attach*／useDetailAttach。
 * 広告枠は DetailMonetization。
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/base/SectionHeader";
import { useMockFlash } from "@/base/ui/useMockFlash";
import {
  AttachSearchDialog,
  type AttachConfirmResult,
} from "./AttachSearchDialog";
import { AttachResultBanner } from "./AttachResultBanner";
import { mergeAttachSelection } from "./attach-merge";
import { DetailBrowseShell } from "./DetailBrowseShell";
import { useDetailAttach } from "./useDetailAttach";
import { DetailHeroSection } from "./DetailHeroSection";
import {
  DetailAttribution,
  DetailMeta,
  DetailStructuredFields,
} from "./DetailMeta";
import { ItemCollageThumb } from "./ItemCollageThumb";
import { ItemDetailMonetization } from "@/base/monetization/DetailMonetization";
import { RelatedTileGrid } from "./RelatedTileGrid";
import { TagList } from "./TagList";
import { getOwnerItem } from "@/lib/api";
import { USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import {
  getMockAttachedCoordinates,
  setMockAttachedCoordinates,
} from "@/lib/mock-attach-graph";
import {
  createMockTempCoordinate,
  isMockTempCoordinateId,
  listMockTempCoordinatesUsingItem,
  mockTempCollageUrls,
  mockTempToListItem,
  saveMockTempCoordinate,
  type MockTempCoordinateRecord,
} from "@/lib/mock-temp-coordinate";
import { spikeCreateCoordinate } from "@/lib/spike-write";
import { useOwnerFields } from "@/lib/use-owner-fields";
import {
  userItemsByCategoryPath,
  userProfilePath,
} from "@/lib/mypage-data";
import type {
  CoordinateItemRef,
  OwnerItemFields,
  PublicItemDetail,
  PublicListItem,
} from "@/lib/types";

function byNewestPosted(a: PublicListItem, b: PublicListItem) {
  const pa = a.posted_at ?? "";
  const pb = b.posted_at ?? "";
  if (pa && pb && pa !== pb) return pb.localeCompare(pa);
  return b.id.localeCompare(a.id);
}

function splitUsedIn(coords: PublicListItem[]) {
  const main: PublicListItem[] = [];
  const temp: PublicListItem[] = [];
  for (const c of coords) {
    if (c.is_temp || isMockTempCoordinateId(c.id)) temp.push(c);
    else main.push(c);
  }
  main.sort(byNewestPosted);
  temp.sort(byNewestPosted);
  return { main, temp };
}

type Props = {
  item: PublicItemDetail;
  /** サーバで取った本人用フィールド。渡されていればクライアント再取得しない */
  ownerFields?: OwnerItemFields | null;
  /** 前後ナビ用。getDetailNeighborList で当該ページ分のみ */
  browseList?: PublicListItem[];
};

/**
 * Next アイテム詳細。
 * 本文は公開（または本人用フルから抽出）。所有者フィールドは props または owner API。
 */
function itemToCoordinateRef(item: PublicItemDetail): CoordinateItemRef {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    image_url: item.images[0] ?? "",
    detail_url: APP_ROUTES.item(item.id),
  };
}

export function ItemDetailView({
  item,
  ownerFields: ownerFieldsProp,
  browseList = [],
}: Props) {
  const router = useRouter();
  const { flash, Toast } = useMockFlash({ placement: "fixed" });
  const ownerFromClient = useOwnerFields(
    item.id,
    item.user.id,
    getOwnerItem,
    { enabled: ownerFieldsProp === undefined },
  );
  const owner =
    ownerFieldsProp !== undefined ? ownerFieldsProp : ownerFromClient;
  const {
    attachOpen,
    attachResult,
    openAttach,
    closeAttach,
    markAttachResult,
    clearAttachResult,
  } = useDetailAttach();
  const initialSplit = splitUsedIn(item.used_in_coordinates ?? []);
  const [linkedCoords, setLinkedCoords] = useState<PublicListItem[]>(() =>
    USE_SPIKE_API
      ? initialSplit.main
      : getMockAttachedCoordinates(item.id, initialSplit.main),
  );
  const [spikeTempCoords, setSpikeTempCoords] = useState<PublicListItem[]>(
    () => (USE_SPIKE_API ? initialSplit.temp : []),
  );
  const [tempRecords, setTempRecords] = useState<MockTempCoordinateRecord[]>(
    [],
  );
  const tempCoords = useMemo(
    () =>
      USE_SPIKE_API
        ? spikeTempCoords
        : tempRecords.map(mockTempToListItem),
    [spikeTempCoords, tempRecords],
  );

  const refreshTempRecords = () => {
    setTempRecords(listMockTempCoordinatesUsingItem(item.id));
  };

  const handleCreateTempFromItem = () => {
    if (USE_SPIKE_API) {
      void (async () => {
        try {
          const created = await spikeCreateCoordinate({
            title: "",
            gender: item.gender,
            visibility: "private",
            is_temp: true,
            image_urls: [],
            item_ids: [item.id],
          });
          flash("仮コーデを作成しました");
          router.push(APP_ROUTES.coordinate(created.id));
        } catch {
          flash("仮コーデの作成に失敗しました（ログイン済みか確認）");
        }
      })();
      return;
    }
    const record = createMockTempCoordinate(item.user, item.gender, [
      itemToCoordinateRef(item),
    ]);
    saveMockTempCoordinate(record);
    refreshTempRecords();
    flash("仮コーデを作成しました");
    router.push(APP_ROUTES.coordinate(record.id));
  };

  useEffect(() => {
    const split = splitUsedIn(item.used_in_coordinates ?? []);
    if (USE_SPIKE_API) {
      setLinkedCoords(split.main);
      setSpikeTempCoords(split.temp);
      return;
    }
    setLinkedCoords(getMockAttachedCoordinates(item.id, split.main));
  }, [item.id, item.used_in_coordinates]);

  useEffect(() => {
    if (USE_SPIKE_API) return;
    setTempRecords(listMockTempCoordinatesUsingItem(item.id));
  }, [item.id]);

  const carouselAlt =
    item.title.trim() || `${item.user.name}の${item.category}`;
  const hasUsed = linkedCoords.length > 0;
  const hasTempUsed = tempCoords.length > 0;
  const linkedIds = useMemo(
    () => linkedCoords.map((c) => c.id),
    [linkedCoords],
  );
  const previewSrc = item.images[0] ?? "";

  const handleConfirm = (result: AttachConfirmResult) => {
    const previousIds = linkedCoords.map((c) => c.id);
    const nextCoords = mergeAttachSelection(
      linkedCoords,
      result,
      (row) => row,
      { acceptAddedId: (id) => !isMockTempCoordinateId(id) },
    );
    setLinkedCoords(nextCoords);
    markAttachResult(result);
    if (USE_SPIKE_API) {
      void (async () => {
        try {
          const { spikeSyncItemAttachedCoordinates } = await import(
            "@/lib/spike-write"
          );
          await spikeSyncItemAttachedCoordinates(
            item.id,
            previousIds,
            nextCoords.map((c) => c.id),
          );
          flash("紐付けを保存しました");
          router.refresh();
        } catch {
          flash("紐付けの保存に失敗しました");
        }
      })();
      return;
    }
    setMockAttachedCoordinates(item.id, nextCoords, {
      id: item.id,
      title: item.title,
      category: item.category,
      image_url: item.images[0] ?? "",
      detail_url: `/i/${item.id}`,
    });
  };

  return (
    <DetailBrowseShell kind="items" id={item.id} homeList={browseList}>
      {Toast}
      <article className="pb-8">
        <DetailHeroSection images={item.images} alt={carouselAlt} />

        <div className="detail-inset mt-3">
          <DetailMeta
            user={item.user}
            title={item.title}
            description={item.description}
            likeCount={item.like_count}
            sharePath={`/i/${item.id}`}
            shareFallback={`${item.user.name}の${item.category}`}
            interactionKey={`i:${item.id}`}
            eyebrow={item.category}
            eyebrowHref={userItemsByCategoryPath(
              item.user.id,
              item.category,
            )}
            privateNote={owner ? owner.private_note : null}
            favoriteRank={owner?.favorite_rank ?? null}
            showOwnerFavorite={Boolean(owner)}
          />
        </div>

        {hasUsed || owner ? (
          <section className="mt-6">
            <SectionHeader
              title="このアイテムを使ったコーデ"
              trailing={
                attachResult ? (
                  <AttachResultBanner
                    summary={attachResult}
                    onDismiss={clearAttachResult}
                  />
                ) : null
              }
            />
            {owner && !hasUsed ? (
              <p className="detail-inset mb-3 truncate text-xs leading-relaxed text-kr-muted sm:text-sm">
                まだ紐付くコーデがありません。＋から追加
              </p>
            ) : null}
            <RelatedTileGrid
              items={linkedCoords}
              browseKind="coordinates"
              browseLabel="このアイテムを使ったコーデ"
              showAddTile={Boolean(owner)}
              onAddClick={openAttach}
              addLabel="コーデを追加"
            />
          </section>
        ) : null}

        {hasTempUsed || owner ? (
          <section className="mt-6">
            <SectionHeader title="利用した仮コーディネート" />
            {owner ? (
              <div className="detail-inset mb-3 space-y-2">
                {!hasTempUsed ? (
                  <p className="truncate text-xs leading-relaxed text-kr-muted sm:text-sm">
                    まだ仮コーデがありません。このアイテムから組めます。
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreateTempFromItem}
                  className="text-sm font-medium text-kr-link hover:underline"
                >
                  このアイテムで仮コーディネートを組む
                </button>
              </div>
            ) : null}
            {hasTempUsed ? (
              <RelatedTileGrid
                items={tempCoords}
                browseKind="coordinates"
                browseLabel="利用した仮コーディネート"
                media={
                  USE_SPIKE_API
                    ? undefined
                    : (entry) => {
                        const record = tempRecords.find(
                          (r) => r.id === entry.id,
                        );
                        const urls = record
                          ? mockTempCollageUrls(record)
                          : null;
                        if (!urls) return null;
                        return (
                          <ItemCollageThumb
                            urls={urls}
                            alt={entry.title || "仮コーデ"}
                            variant="tile"
                          />
                        );
                      }
                }
              />
            ) : null}
          </section>
        ) : null}

        {item.tags.length > 0 ? (
          <div className="detail-inset mt-6">
            <TagList tags={item.tags} mode="items" />
          </div>
        ) : null}

        <DetailAttribution
          postedAt={item.posted_at}
          visibility={owner?.owner_status ?? null}
          viewCount={owner?.view_count ?? null}
          editUrl={owner?.edit_url ?? null}
          wornOn={null}
          declutterCandidate={Boolean(owner?.declutter_candidate)}
        />

        <ItemDetailMonetization />

        {item.related_items.length > 0 ? (
          <section className="mt-10">
            <SectionHeader
              title="このユーザの他のアイテム"
              moreHref={userProfilePath(item.user.id)}
              moreLabel="もっと見る"
            />
            <RelatedTileGrid
              items={item.related_items.slice(0, 9)}
              browseKind="items"
              browseLabel="このユーザの他のアイテム"
            />
          </section>
        ) : null}
      </article>

      {owner ? (
        <AttachSearchDialog
          open={attachOpen}
          onClose={closeAttach}
          kind="coordinates"
          ownerUserId={item.user.id}
          preview={{ src: previewSrc, alt: carouselAlt }}
          linkedIds={linkedIds}
          linkedRows={linkedCoords}
          onConfirm={handleConfirm}
        />
      ) : null}
    </DetailBrowseShell>
  );
}

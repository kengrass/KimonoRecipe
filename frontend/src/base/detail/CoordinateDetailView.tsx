"use client";

/**
 * コーデ詳細。データ組立は `load-detail.ts`。紐付け UI は Attach*／useDetailAttach。
 * 広告枠は DetailMonetization。spike 時の紐付け保存は spike-write。
 */

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/base/SectionHeader";
import { useMockFlash } from "@/base/ui/useMockFlash";
import {
  AttachSearchDialog,
  type AttachConfirmResult,
} from "./AttachSearchDialog";
import { AttachResultBanner } from "./AttachResultBanner";
import { mergeAttachSelection } from "./attach-merge";
import { CoordinateItemGrid } from "./CoordinateItemGrid";
import { DetailBrowseShell } from "./DetailBrowseShell";
import { useDetailAttach } from "./useDetailAttach";
import { DetailHeroSection } from "./DetailHeroSection";
import {
  DetailAttribution,
  DetailMeta,
  DetailStructuredFields,
} from "./DetailMeta";
import { CoordinateDetailMainMonetization } from "@/base/monetization/DetailMonetization";
import { RelatedTileGrid } from "./RelatedTileGrid";
import { TagList } from "./TagList";
import { getOwnerCoordinate } from "@/lib/api";
import { ItemCollageThumb } from "@/base/detail/ItemCollageThumb";
import { sortCoordinateItemsByCategory } from "@/lib/coordinate-item-order";
import { USE_SPIKE_API } from "@/lib/config";
import {
  getMockAttachedItems,
  setMockAttachedItems,
} from "@/lib/mock-attach-graph";
import {
  getMockTempCollageUrls,
  isMockTempCoordinateId,
  mockTempCollageUrls,
  updateMockTempCoordinateItems,
} from "@/lib/mock-temp-coordinate";
import { TEMP_COORDINATE_ITEM_MAX } from "@/lib/temp-coordinate-collage";
import { useOwnerFields } from "@/lib/use-owner-fields";
import { userProfilePath } from "@/lib/mypage-data";
import { spikePutCoordinateItems } from "@/lib/spike-write";
import type {
  CoordinateItemRef,
  OwnerCoordinateFields,
  PublicCoordinateDetail,
  PublicListItem,
} from "@/lib/types";

function loadLinkedItems(coordinate: PublicCoordinateDetail): CoordinateItemRef[] {
  const raw =
    USE_SPIKE_API || isMockTempCoordinateId(coordinate.id)
      ? coordinate.items
      : getMockAttachedItems(coordinate.id, coordinate.items);
  return sortCoordinateItemsByCategory(raw);
}

type Props = {
  coordinate: PublicCoordinateDetail;
  /**
   * サーバで取った本人用フィールド。渡されていればクライアント再取得しない。
   * （未渡し時のみ useOwnerFields）
   */
  ownerFields?: OwnerCoordinateFields | null;
  /**
   * 前後ナビ用の短い公開一覧（検索セッションが無い直リンク向け）。
   * getDetailNeighborList で当該ページ分のみ。
   */
  browseList?: PublicListItem[];
};

/**
 * Next コーデ詳細。
 * 本文は公開（または本人用フルから抽出）。所有者フィールドは props または owner API。
 */
export function CoordinateDetailView({
  coordinate,
  ownerFields: ownerFieldsProp,
  browseList = [],
}: Props) {
  const ownerFromClient = useOwnerFields(
    coordinate.id,
    coordinate.user.id,
    getOwnerCoordinate,
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
  const { flash, Toast } = useMockFlash({ placement: "fixed" });
  const [linkedItems, setLinkedItems] = useState(() =>
    loadLinkedItems(coordinate),
  );
  const [heroImages, setHeroImages] = useState(coordinate.images);
  const [collageUrls, setCollageUrls] = useState<string[] | null>(() =>
    getMockTempCollageUrls(coordinate.id),
  );

  useEffect(() => {
    setLinkedItems(loadLinkedItems(coordinate));
    setHeroImages(coordinate.images);
    setCollageUrls(getMockTempCollageUrls(coordinate.id));
  }, [coordinate.id, coordinate.items, coordinate.images]);

  const carouselAlt =
    coordinate.title.trim() || `${coordinate.user.name}のコーディネート`;
  const hasItems = linkedItems.length > 0;
  const linkedIds = useMemo(
    () => linkedItems.map((item) => item.id),
    [linkedItems],
  );
  const linkedRows = useMemo(
    (): PublicListItem[] =>
      linkedItems.map((item) => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        user: coordinate.user,
        posted_at: coordinate.posted_at,
        tags: item.category ? [item.category] : [],
        seasons: [],
        gender: coordinate.gender,
        category: item.category,
        detail_url: item.detail_url,
      })),
    [linkedItems, coordinate.user, coordinate.posted_at, coordinate.gender],
  );
  const previewSrc = heroImages[0] ?? "";

  const handleConfirm = (result: AttachConfirmResult) => {
    let nextItems = sortCoordinateItemsByCategory(
      mergeAttachSelection(linkedItems, result, (row) => ({
        id: row.id,
        title: row.title,
        category: row.category || "その他",
        image_url: row.image_url,
        detail_url: row.detail_url,
      })),
    );
    if (
      isMockTempCoordinateId(coordinate.id) &&
      nextItems.length > TEMP_COORDINATE_ITEM_MAX
    ) {
      nextItems = nextItems.slice(0, TEMP_COORDINATE_ITEM_MAX);
    }
    setLinkedItems(nextItems);
    markAttachResult(result);
    if (USE_SPIKE_API && !isMockTempCoordinateId(coordinate.id)) {
      void (async () => {
        try {
          const saved = await spikePutCoordinateItems(
            coordinate.id,
            nextItems.map((i) => i.id),
          );
          if (saved.items) {
            setLinkedItems(
              sortCoordinateItemsByCategory(
                saved.items.map((i) => ({
                  id: i.id,
                  title: i.title,
                  category: i.category,
                  image_url: i.image_url,
                  detail_url: i.detail_url,
                })),
              ),
            );
          }
          if (saved.images?.length) {
            setHeroImages(saved.images);
          } else if (saved.image_url) {
            setHeroImages([saved.image_url]);
          }
        } catch {
          flash("紐付けの保存に失敗しました");
        }
      })();
      return;
    }
    if (isMockTempCoordinateId(coordinate.id)) {
      const record = updateMockTempCoordinateItems(coordinate.id, nextItems);
      if (record) {
        setCollageUrls(mockTempCollageUrls(record));
        setHeroImages(
          record.photos.length > 0 ? record.photos : [record.image_url],
        );
      }
      return;
    }
    setMockAttachedItems(coordinate.id, nextItems, {
      id: coordinate.id,
      title: coordinate.title,
      image_url: coordinate.images[0] ?? "",
      user: coordinate.user,
      posted_at: coordinate.posted_at,
      tags: coordinate.tags,
      seasons: [],
      detail_url: `/c/${coordinate.id}`,
      gender: coordinate.gender,
      obi_knot: coordinate.obi_knot,
    });
  };

  return (
    <DetailBrowseShell
      kind="coordinates"
      id={coordinate.id}
      homeList={browseList}
    >
      {Toast}
      <article className="pb-8">
        {collageUrls ? (
          <div
            className="detail-hero-image relative aspect-square w-full overflow-hidden"
            style={{ maxWidth: "var(--kr-detail-hero-max)" }}
          >
            <ItemCollageThumb
              urls={collageUrls}
              alt={carouselAlt}
              variant="hero"
            />
          </div>
        ) : (
          <DetailHeroSection images={heroImages} alt={carouselAlt} />
        )}

        <div className="detail-inset mt-3">
          <DetailMeta
            user={coordinate.user}
            title={coordinate.title}
            description={coordinate.description}
            likeCount={coordinate.like_count}
            sharePath={`/c/${coordinate.id}`}
            shareFallback={
              coordinate.obi_knot.trim()
                ? `${coordinate.user.name}の${coordinate.obi_knot}`
                : `${coordinate.user.name}のコーディネート`
            }
            interactionKey={`c:${coordinate.id}`}
            privateNote={owner ? owner.private_note : null}
            likeEnabled={!owner?.is_temp}
          />
        </div>

        {hasItems || owner ? (
          <section className="mt-6">
            <SectionHeader
              title="このコーデのアイテム"
              trailing={
                attachResult ? (
                  <AttachResultBanner
                    summary={attachResult}
                    onDismiss={clearAttachResult}
                  />
                ) : null
              }
            />
            {owner && !hasItems ? (
              <p className="detail-inset mb-3 truncate text-xs leading-relaxed text-kr-muted sm:text-sm">
                まだ紐付くアイテムがありません。＋から追加
              </p>
            ) : null}
            <CoordinateItemGrid
              items={linkedItems}
              user={coordinate.user}
              postedAt={coordinate.posted_at}
              showAddTile={Boolean(owner)}
              onAddClick={openAttach}
            />
          </section>
        ) : null}

        {coordinate.tags.length > 0 ? (
          <div className="detail-inset mt-6">
            <TagList tags={coordinate.tags} mode="coordinates" />
          </div>
        ) : null}

        <DetailStructuredFields obiKnot={coordinate.obi_knot} />

        <DetailAttribution
          postedAt={coordinate.posted_at}
          visibility={owner?.owner_status ?? null}
          viewCount={owner?.view_count ?? null}
          editUrl={owner?.edit_url ?? null}
          wornOn={owner?.worn_on ?? null}
        />

        <CoordinateDetailMainMonetization />

        {coordinate.related_coordinates.length > 0 ? (
          <section className="mt-10">
            <SectionHeader
              title="このユーザの他のコーディネート"
              moreHref={userProfilePath(coordinate.user.id)}
              moreLabel="もっと見る"
            />
            <RelatedTileGrid
              items={coordinate.related_coordinates.slice(0, 9)}
              browseKind="coordinates"
              browseLabel="このユーザの他のコーディネート"
            />
          </section>
        ) : null}
      </article>

      {owner ? (
        <AttachSearchDialog
          open={attachOpen}
          onClose={closeAttach}
          kind="items"
          ownerUserId={coordinate.user.id}
          preview={{ src: previewSrc, alt: carouselAlt }}
          linkedIds={linkedIds}
          linkedRows={linkedRows}
          onConfirm={handleConfirm}
        />
      ) : null}
    </DetailBrowseShell>
  );
}

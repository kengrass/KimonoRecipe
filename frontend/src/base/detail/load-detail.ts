/**
 * Next 詳細のサーバ組み立て。
 *
 * ルール:
 * - 公開 API に非公開は載せない
 * - 本人と分かれば本人用フルを使う（初回描画前に完了 → ちらつき防止）
 * - 本人用が取れなければ公開へフォールバック（ログイン切れ等）
 */
import { cache } from "react";
import {
  getDetailNeighborList,
  getOwnerCoordinate,
  getOwnerItem,
  getPublicCoordinate,
  getPublicItem,
} from "@/lib/api";
import {
  ownerCoordinateFieldsFromDetail,
  ownerItemFieldsFromDetail,
  publicCoordinateFromOwner,
  publicItemFromOwner,
} from "@/lib/owner-detail";
import { getServerViewerUserId } from "@/lib/server-viewer";
import type {
  OwnerCoordinateFields,
  OwnerItemFields,
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
} from "@/lib/types";

export type CoordinateDetailPageData = {
  coordinate: PublicCoordinateDetail;
  ownerFields: OwnerCoordinateFields | null;
  browseList: PublicListItem[];
};

export type ItemDetailPageData = {
  item: PublicItemDetail;
  ownerFields: OwnerItemFields | null;
  browseList: PublicListItem[];
};

export const loadCoordinateDetailPage = cache(
  async (id: string): Promise<CoordinateDetailPageData | null> => {
    const viewerUserId = await getServerViewerUserId();

    if (viewerUserId) {
      const ownerFull = await getOwnerCoordinate(id, { viewerUserId });
      if (ownerFull) {
        const browseList = await getDetailNeighborList("coordinates", id);
        return {
          coordinate: publicCoordinateFromOwner(ownerFull),
          ownerFields: ownerCoordinateFieldsFromDetail(ownerFull),
          browseList,
        };
      }
    }

    const coordinate = await getPublicCoordinate(id);
    if (!coordinate) return null;

    const browseList = await getDetailNeighborList("coordinates", id);
    return { coordinate, ownerFields: null, browseList };
  },
);

export const loadItemDetailPage = cache(
  async (id: string): Promise<ItemDetailPageData | null> => {
    const viewerUserId = await getServerViewerUserId();

    if (viewerUserId) {
      const ownerFull = await getOwnerItem(id, { viewerUserId });
      if (ownerFull) {
        const browseList = await getDetailNeighborList("items", id);
        return {
          item: publicItemFromOwner(ownerFull),
          ownerFields: ownerItemFieldsFromDetail(ownerFull),
          browseList,
        };
      }
    }

    const item = await getPublicItem(id);
    if (!item) return null;

    const browseList = await getDetailNeighborList("items", id);
    return { item, ownerFields: null, browseList };
  },
);

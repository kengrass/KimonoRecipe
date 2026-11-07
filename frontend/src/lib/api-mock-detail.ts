/**
 * モック時の詳細組み立て（公開詳細・owner 詳細の共通土台）。
 * 本番／spike では使わない。呼び出しは api-public / api-owner から。
 */

import { LARAVEL_ORIGIN } from "./config";
import {
  DETAILED_COORDINATE_IDS,
  DETAILED_ITEM_IDS,
  MOCK_COORDINATE_DETAIL,
  MOCK_COORDINATE_LIST,
  MOCK_ITEM_DETAIL,
  MOCK_ITEM_LIST,
} from "./mock-data";
import { mockComposeEditUrl } from "./mock-temp-coordinate";
import {
  GRAPH_COORDINATE_DETAILS,
  GRAPH_ITEM_DETAILS,
} from "./mock-graph";
import {
  getMockAttachedCoordinates,
  getMockAttachedItems,
} from "./mock-attach-graph";
import { loadMockApiResponse, loadMockOwnerResponse } from "./mock-api-fixtures";
import type {
  OwnerCoordinateFields,
  OwnerItemFields,
  PublicCoordinateDetail,
  PublicItemDetail,
} from "./types";
import {
  getContentVisibility,
  OWNER_PRIVATE_COORDINATES,
  OWNER_PRIVATE_ITEMS,
} from "./visibility";

function mockViewCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 80 + (h % 2400);
}

/** 手書きモック（graph・代表詳細）。実写サンプルは mocks/api JSON を参照 */
const MOCK_COORDINATE_DETAILS: Record<string, PublicCoordinateDetail> = {
  mckX046: MOCK_COORDINATE_DETAIL,
  ...GRAPH_COORDINATE_DETAILS,
};

const MOCK_ITEM_DETAILS: Record<string, PublicItemDetail> = {
  mckX070: MOCK_ITEM_DETAIL,
  ...GRAPH_ITEM_DETAILS,
};

function buildFallbackCoordinate(id: string): PublicCoordinateDetail | null {
  const listed =
    MOCK_COORDINATE_LIST.find((c) => c.id === id) ??
    OWNER_PRIVATE_COORDINATES.find((c) => c.id === id);
  if (!listed) return null;
  return {
    id: listed.id,
    title: listed.title,
    description: "（モック）詳細データ未整備の一覧派生エントリです。",
    images: [listed.image_url],
    user: listed.user,
    posted_at: listed.posted_at,
    tags: listed.tags,
    like_count: 0,
    gender: listed.gender,
    obi_knot: listed.obi_knot ?? "創作帯結び",
    items: [],
    related_coordinates: MOCK_COORDINATE_LIST.filter(
      (c) => c.id !== id && c.user.id === listed.user.id,
    ).slice(0, 4),
    og: {
      title: `${listed.title || listed.obi_knot || "コーディネート"} | きものレシピ`,
      description: listed.title || listed.id,
      image_url: listed.image_url,
    },
  };
}

function buildFallbackItem(id: string): PublicItemDetail | null {
  const listed =
    MOCK_ITEM_LIST.find((i) => i.id === id) ??
    OWNER_PRIVATE_ITEMS.find((i) => i.id === id);
  if (!listed) return null;
  return {
    id: listed.id,
    title: listed.title,
    description: "（モック）詳細データ未整備の一覧派生エントリです。",
    category: listed.category ?? listed.tags[0] ?? "その他",
    images: [listed.image_url],
    user: listed.user,
    posted_at: listed.posted_at,
    tags: listed.tags,
    like_count: 0,
    gender: listed.gender,
    used_in_coordinates: [],
    related_items: MOCK_ITEM_LIST.filter(
      (i) => i.id !== id && i.user.id === listed.user.id,
    ).slice(0, 4),
    og: {
      title: `${listed.title || listed.category || "アイテム"} | きものレシピ`,
      description: listed.title || listed.id,
      image_url: listed.image_url,
    },
  };
}

function withAttachedCoordinateItems(
  detail: PublicCoordinateDetail,
): PublicCoordinateDetail {
  return {
    ...detail,
    items: getMockAttachedItems(detail.id, detail.items),
  };
}

function withAttachedItemCoordinates(
  detail: PublicItemDetail,
): PublicItemDetail {
  return {
    ...detail,
    used_in_coordinates: getMockAttachedCoordinates(
      detail.id,
      detail.used_in_coordinates,
    ),
  };
}

export function loadMockPublicCoordinateRaw(
  id: string,
): PublicCoordinateDetail | null {
  const fromFixture = loadMockApiResponse(
    `/api/public/coordinates/${id}`,
  ) as PublicCoordinateDetail | null;
  if (fromFixture) return withAttachedCoordinateItems(fromFixture);
  if (DETAILED_COORDINATE_IDS.has(id)) {
    const detailed = MOCK_COORDINATE_DETAILS[id] ?? null;
    return detailed ? withAttachedCoordinateItems(detailed) : null;
  }
  const fallback = buildFallbackCoordinate(id);
  return fallback ? withAttachedCoordinateItems(fallback) : null;
}

export function loadMockPublicItemRaw(id: string): PublicItemDetail | null {
  const fromFixture = loadMockApiResponse(
    `/api/public/items/${id}`,
  ) as PublicItemDetail | null;
  if (fromFixture) return withAttachedItemCoordinates(fromFixture);
  if (DETAILED_ITEM_IDS.has(id)) {
    const detailed = MOCK_ITEM_DETAILS[id] ?? null;
    return detailed ? withAttachedItemCoordinates(detailed) : null;
  }
  const fallback = buildFallbackItem(id);
  return fallback ? withAttachedItemCoordinates(fallback) : null;
}

export function mockOwnerCoordinateOverlay(id: string): OwnerCoordinateFields {
  const fromFixture = loadMockOwnerResponse(
    `/api/owner/coordinates/${id}`,
  ) as OwnerCoordinateFields | null;
  if (fromFixture) {
    return {
      ...fromFixture,
      edit_url: mockComposeEditUrl("coordinate", id),
    };
  }
  return {
    id,
    edit_url: mockComposeEditUrl("coordinate", id),
    add_coordinate_item_url: `${LARAVEL_ORIGIN}/mypage/coordinate/edit?id=${id}&action=add_item`,
    private_note: "",
    owner_status: getContentVisibility(id),
    updated_at: new Date().toISOString(),
    view_count: mockViewCount(id),
  };
}

export function mockOwnerItemOverlay(id: string): OwnerItemFields {
  const fromFixture = loadMockOwnerResponse(
    `/api/owner/items/${id}`,
  ) as OwnerItemFields | null;
  if (fromFixture) {
    return {
      ...fromFixture,
      edit_url: mockComposeEditUrl("item", id),
    };
  }
  const rank = (1 + (mockViewCount(id) % 5)) as 1 | 2 | 3 | 4 | 5;
  return {
    id,
    edit_url: mockComposeEditUrl("item", id),
    add_used_coordinate_url: `${LARAVEL_ORIGIN}/mypage/item/edit?id=${id}&action=add_coordinate`,
    private_note: "",
    owner_status: getContentVisibility(id),
    updated_at: new Date().toISOString(),
    view_count: mockViewCount(id),
    favorite_rank: rank,
    declutter_candidate: mockViewCount(id) % 6 === 0,
  };
}

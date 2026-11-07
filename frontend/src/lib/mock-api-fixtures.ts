/**
 * 擬似 API レスポンスの読み込み口。
 *
 * ファイル配置は本番 API パスに対応:
 *   GET /api/public/coordinates/{id} → public/coordinates/{id}.json
 *   GET /api/public/items/{id}       → public/items/{id}.json
 *   GET /api/owner/coordinates/{id}  → owner/coordinates/{id}.json
 *   GET /api/owner/items/{id}        → owner/items/{id}.json
 *
 * 一覧の上書き（タイトル等）は `_list/{id}.json`。
 * 本命見本: mckX046（コーデ）/ mckX070（アイテム）＋ owner 同 ID。
 * モック JSON は架空テキスト。画像 URL は表示検証用に CDN を残している場合あり。
 * Generated: 2026-09-30T05:13:36.229Z
 */
import coord_mckX046 from "@/mocks/api/public/coordinates/mckX046.json";
import coord_mckX110 from "@/mocks/api/public/coordinates/mckX110.json";
import coord_mckX089 from "@/mocks/api/public/coordinates/mckX089.json";
import coord_mckX017 from "@/mocks/api/public/coordinates/mckX017.json";
import coord_mckX068 from "@/mocks/api/public/coordinates/mckX068.json";
import coord_mckX122 from "@/mocks/api/public/coordinates/mckX122.json";
import coord_mckX136 from "@/mocks/api/public/coordinates/mckX136.json";
import coord_mckX053 from "@/mocks/api/public/coordinates/mckX053.json";
import coord_mckX003 from "@/mocks/api/public/coordinates/mckX003.json";
import coord_mckX124 from "@/mocks/api/public/coordinates/mckX124.json";
import coord_mckX066 from "@/mocks/api/public/coordinates/mckX066.json";
import coord_mckX020 from "@/mocks/api/public/coordinates/mckX020.json";
import item_mckX070 from "@/mocks/api/public/items/mckX070.json";
import item_mckX088 from "@/mocks/api/public/items/mckX088.json";
import item_mckX178 from "@/mocks/api/public/items/mckX178.json";
import item_mckX106 from "@/mocks/api/public/items/mckX106.json";
import item_mckX095 from "@/mocks/api/public/items/mckX095.json";
import item_mckX189 from "@/mocks/api/public/items/mckX189.json";
import item_mckX148 from "@/mocks/api/public/items/mckX148.json";
import item_mckX190 from "@/mocks/api/public/items/mckX190.json";
import item_mckX099 from "@/mocks/api/public/items/mckX099.json";
import item_mckX109 from "@/mocks/api/public/items/mckX109.json";
import item_mckX055 from "@/mocks/api/public/items/mckX055.json";
import item_mckX047 from "@/mocks/api/public/items/mckX047.json";
import coordList_mckX046 from "@/mocks/api/public/coordinates/_list/mckX046.json";
import coordList_mckX110 from "@/mocks/api/public/coordinates/_list/mckX110.json";
import coordList_mckX089 from "@/mocks/api/public/coordinates/_list/mckX089.json";
import coordList_mckX017 from "@/mocks/api/public/coordinates/_list/mckX017.json";
import coordList_mckX068 from "@/mocks/api/public/coordinates/_list/mckX068.json";
import coordList_mckX122 from "@/mocks/api/public/coordinates/_list/mckX122.json";
import coordList_mckX136 from "@/mocks/api/public/coordinates/_list/mckX136.json";
import coordList_mckX053 from "@/mocks/api/public/coordinates/_list/mckX053.json";
import coordList_mckX003 from "@/mocks/api/public/coordinates/_list/mckX003.json";
import coordList_mckX124 from "@/mocks/api/public/coordinates/_list/mckX124.json";
import coordList_mckX066 from "@/mocks/api/public/coordinates/_list/mckX066.json";
import coordList_mckX020 from "@/mocks/api/public/coordinates/_list/mckX020.json";
import itemList_mckX070 from "@/mocks/api/public/items/_list/mckX070.json";
import itemList_mckX088 from "@/mocks/api/public/items/_list/mckX088.json";
import itemList_mckX178 from "@/mocks/api/public/items/_list/mckX178.json";
import itemList_mckX106 from "@/mocks/api/public/items/_list/mckX106.json";
import itemList_mckX095 from "@/mocks/api/public/items/_list/mckX095.json";
import itemList_mckX189 from "@/mocks/api/public/items/_list/mckX189.json";
import itemList_mckX148 from "@/mocks/api/public/items/_list/mckX148.json";
import itemList_mckX190 from "@/mocks/api/public/items/_list/mckX190.json";
import itemList_mckX099 from "@/mocks/api/public/items/_list/mckX099.json";
import itemList_mckX109 from "@/mocks/api/public/items/_list/mckX109.json";
import itemList_mckX055 from "@/mocks/api/public/items/_list/mckX055.json";
import itemList_mckX047 from "@/mocks/api/public/items/_list/mckX047.json";
import ownerCoord_mckX046 from "@/mocks/api/owner/coordinates/mckX046.json";
import ownerItem_mckX070 from "@/mocks/api/owner/items/mckX070.json";
import user_mckDemo from "@/mocks/api/public/users/mckDemo.json";
import user_mckTaro from "@/mocks/api/public/users/mckTaro.json";
import user_mckMidori from "@/mocks/api/public/users/mckMidori.json";
import user_mckBrandA from "@/mocks/api/public/users/mckBrandA.json";
import user_mckBrandB from "@/mocks/api/public/users/mckBrandB.json";
import type {
  OwnerCoordinateFields,
  OwnerItemFields,
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
  PublicUserProfile,
} from "./types";

/** GET /api/public/coordinates/{id} 相当 */
export const REAL_COORDINATE_DETAILS: Record<string, PublicCoordinateDetail> = {
  mckX046: coord_mckX046 as PublicCoordinateDetail,
  mckX110: coord_mckX110 as PublicCoordinateDetail,
  mckX089: coord_mckX089 as PublicCoordinateDetail,
  mckX017: coord_mckX017 as PublicCoordinateDetail,
  mckX068: coord_mckX068 as PublicCoordinateDetail,
  mckX122: coord_mckX122 as PublicCoordinateDetail,
  mckX136: coord_mckX136 as PublicCoordinateDetail,
  mckX053: coord_mckX053 as PublicCoordinateDetail,
  mckX003: coord_mckX003 as PublicCoordinateDetail,
  mckX124: coord_mckX124 as PublicCoordinateDetail,
  mckX066: coord_mckX066 as PublicCoordinateDetail,
  mckX020: coord_mckX020 as PublicCoordinateDetail,
};

/** GET /api/public/items/{id} 相当 */
export const REAL_ITEM_DETAILS: Record<string, PublicItemDetail> = {
  mckX070: item_mckX070 as PublicItemDetail,
  mckX088: item_mckX088 as PublicItemDetail,
  mckX178: item_mckX178 as PublicItemDetail,
  mckX106: item_mckX106 as PublicItemDetail,
  mckX095: item_mckX095 as PublicItemDetail,
  mckX189: item_mckX189 as PublicItemDetail,
  mckX148: item_mckX148 as PublicItemDetail,
  mckX190: item_mckX190 as PublicItemDetail,
  mckX099: item_mckX099 as PublicItemDetail,
  mckX109: item_mckX109 as PublicItemDetail,
  mckX055: item_mckX055 as PublicItemDetail,
  mckX047: item_mckX047 as PublicItemDetail,
};

export const REAL_COORDINATE_LIST_PATCHES: Record<string, PublicListItem> = {
  mckX046: coordList_mckX046 as PublicListItem,
  mckX110: coordList_mckX110 as PublicListItem,
  mckX089: coordList_mckX089 as PublicListItem,
  mckX017: coordList_mckX017 as PublicListItem,
  mckX068: coordList_mckX068 as PublicListItem,
  mckX122: coordList_mckX122 as PublicListItem,
  mckX136: coordList_mckX136 as PublicListItem,
  mckX053: coordList_mckX053 as PublicListItem,
  mckX003: coordList_mckX003 as PublicListItem,
  mckX124: coordList_mckX124 as PublicListItem,
  mckX066: coordList_mckX066 as PublicListItem,
  mckX020: coordList_mckX020 as PublicListItem,
};

export const REAL_ITEM_LIST_PATCHES: Record<string, PublicListItem> = {
  mckX070: itemList_mckX070 as PublicListItem,
  mckX088: itemList_mckX088 as PublicListItem,
  mckX178: itemList_mckX178 as PublicListItem,
  mckX106: itemList_mckX106 as PublicListItem,
  mckX095: itemList_mckX095 as PublicListItem,
  mckX189: itemList_mckX189 as PublicListItem,
  mckX148: itemList_mckX148 as PublicListItem,
  mckX190: itemList_mckX190 as PublicListItem,
  mckX099: itemList_mckX099 as PublicListItem,
  mckX109: itemList_mckX109 as PublicListItem,
  mckX055: itemList_mckX055 as PublicListItem,
  mckX047: itemList_mckX047 as PublicListItem,
};

/** GET /api/owner/coordinates/{id} 相当（本命のみ JSON。他は api.ts で合成） */
export const OWNER_COORDINATE_DETAILS: Record<string, OwnerCoordinateFields> = {
  mckX046: ownerCoord_mckX046 as OwnerCoordinateFields,
};

/** GET /api/owner/items/{id} 相当 */
export const OWNER_ITEM_DETAILS: Record<string, OwnerItemFields> = {
  mckX070: ownerItem_mckX070 as OwnerItemFields,
};

/** GET /api/public/users/{id} 相当（vanity も正規 ID へ） */
export const REAL_USER_PROFILES: Record<string, PublicUserProfile> = {
  mckDemo: user_mckDemo as PublicUserProfile,
  mckTaro: user_mckTaro as PublicUserProfile,
  mckMidori: user_mckMidori as PublicUserProfile,
  mckBrandA: user_mckBrandA as PublicUserProfile,
  mckBrandB: user_mckBrandB as PublicUserProfile,
};

export const REAL_COORDINATE_IDS = new Set(Object.keys(REAL_COORDINATE_DETAILS));
export const REAL_ITEM_IDS = new Set(Object.keys(REAL_ITEM_DETAILS));

/** モック時に API パス相当の公開詳細 JSON を返す */
export function loadMockApiResponse(
  apiPath: string,
): PublicCoordinateDetail | PublicItemDetail | PublicUserProfile | null {
  const coord = apiPath.match(/^\/api\/public\/coordinates\/([^/]+)$/);
  if (coord) return REAL_COORDINATE_DETAILS[coord[1]] ?? null;
  const item = apiPath.match(/^\/api\/public\/items\/([^/]+)$/);
  if (item) return REAL_ITEM_DETAILS[item[1]] ?? null;
  const user = apiPath.match(/^\/api\/public\/users\/([^/]+)$/);
  if (user) return REAL_USER_PROFILES[user[1]] ?? null;
  return null;
}

/** モック時に owner API パス相当の JSON を返す */
export function loadMockOwnerResponse(
  apiPath: string,
): OwnerCoordinateFields | OwnerItemFields | null {
  const coord = apiPath.match(/^\/api\/owner\/coordinates\/([^/]+)$/);
  if (coord) return OWNER_COORDINATE_DETAILS[coord[1]] ?? null;
  const item = apiPath.match(/^\/api\/owner\/items\/([^/]+)$/);
  if (item) return OWNER_ITEM_DETAILS[item[1]] ?? null;
  return null;
}

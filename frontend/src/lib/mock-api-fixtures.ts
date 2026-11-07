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
 * 本命見本: FgNzIyU（コーデ）/ ISSIeSA（アイテム）＋ owner 同 ID。
 * モック JSON は架空テキスト。画像 URL は表示検証用に CDN を残している場合あり。
 * Generated: 2026-09-30T05:13:36.229Z
 */
import coord_FgNzIyU from "@/mocks/api/public/coordinates/FgNzIyU.json";
import coord_MidXIgc from "@/mocks/api/public/coordinates/MidXIgc.json";
import coord_KBVZM0Q from "@/mocks/api/public/coordinates/KBVZM0Q.json";
import coord_ElMiYgQ from "@/mocks/api/public/coordinates/ElMiYgQ.json";
import coord_IJIkJQc from "@/mocks/api/public/coordinates/IJIkJQc.json";
import coord_NIYjZYI from "@/mocks/api/public/coordinates/NIYjZYI.json";
import coord_OEkHNhg from "@/mocks/api/public/coordinates/OEkHNhg.json";
import coord_FyFZeQQ from "@/mocks/api/public/coordinates/FyFZeQQ.json";
import coord_E2ZoGFE from "@/mocks/api/public/coordinates/E2ZoGFE.json";
import coord_NTaURoc from "@/mocks/api/public/coordinates/NTaURoc.json";
import coord_IFB0VAA from "@/mocks/api/public/coordinates/IFB0VAA.json";
import coord_EpdQhgA from "@/mocks/api/public/coordinates/EpdQhgA.json";
import item_ISSIeSA from "@/mocks/api/public/items/ISSIeSA.json";
import item_KAmDEoY from "@/mocks/api/public/items/KAmDEoY.json";
import item_g0dzIXA from "@/mocks/api/public/items/g0dzIXA.json";
import item_MJJjNyM from "@/mocks/api/public/items/MJJjNyM.json";
import item_KIgJNgY from "@/mocks/api/public/items/KIgJNgY.json";
import item_lZRXAjA from "@/mocks/api/public/items/lZRXAjA.json";
import item_QFMhkZg from "@/mocks/api/public/items/QFMhkZg.json";
import item_mIKCMgA from "@/mocks/api/public/items/mIKCMgA.json";
import item_KYFZcXI from "@/mocks/api/public/items/KYFZcXI.json";
import item_MhAjKJU from "@/mocks/api/public/items/MhAjKJU.json";
import item_GFZpQXQ from "@/mocks/api/public/items/GFZpQXQ.json";
import item_FggEZpA from "@/mocks/api/public/items/FggEZpA.json";
import coordList_FgNzIyU from "@/mocks/api/public/coordinates/_list/FgNzIyU.json";
import coordList_MidXIgc from "@/mocks/api/public/coordinates/_list/MidXIgc.json";
import coordList_KBVZM0Q from "@/mocks/api/public/coordinates/_list/KBVZM0Q.json";
import coordList_ElMiYgQ from "@/mocks/api/public/coordinates/_list/ElMiYgQ.json";
import coordList_IJIkJQc from "@/mocks/api/public/coordinates/_list/IJIkJQc.json";
import coordList_NIYjZYI from "@/mocks/api/public/coordinates/_list/NIYjZYI.json";
import coordList_OEkHNhg from "@/mocks/api/public/coordinates/_list/OEkHNhg.json";
import coordList_FyFZeQQ from "@/mocks/api/public/coordinates/_list/FyFZeQQ.json";
import coordList_E2ZoGFE from "@/mocks/api/public/coordinates/_list/E2ZoGFE.json";
import coordList_NTaURoc from "@/mocks/api/public/coordinates/_list/NTaURoc.json";
import coordList_IFB0VAA from "@/mocks/api/public/coordinates/_list/IFB0VAA.json";
import coordList_EpdQhgA from "@/mocks/api/public/coordinates/_list/EpdQhgA.json";
import itemList_ISSIeSA from "@/mocks/api/public/items/_list/ISSIeSA.json";
import itemList_KAmDEoY from "@/mocks/api/public/items/_list/KAmDEoY.json";
import itemList_g0dzIXA from "@/mocks/api/public/items/_list/g0dzIXA.json";
import itemList_MJJjNyM from "@/mocks/api/public/items/_list/MJJjNyM.json";
import itemList_KIgJNgY from "@/mocks/api/public/items/_list/KIgJNgY.json";
import itemList_lZRXAjA from "@/mocks/api/public/items/_list/lZRXAjA.json";
import itemList_QFMhkZg from "@/mocks/api/public/items/_list/QFMhkZg.json";
import itemList_mIKCMgA from "@/mocks/api/public/items/_list/mIKCMgA.json";
import itemList_KYFZcXI from "@/mocks/api/public/items/_list/KYFZcXI.json";
import itemList_MhAjKJU from "@/mocks/api/public/items/_list/MhAjKJU.json";
import itemList_GFZpQXQ from "@/mocks/api/public/items/_list/GFZpQXQ.json";
import itemList_FggEZpA from "@/mocks/api/public/items/_list/FggEZpA.json";
import ownerCoord_FgNzIyU from "@/mocks/api/owner/coordinates/FgNzIyU.json";
import ownerItem_ISSIeSA from "@/mocks/api/owner/items/ISSIeSA.json";
import user_FL6QQa from "@/mocks/api/public/users/FL6QQa.json";
import user_lRTLf6 from "@/mocks/api/public/users/lRTLf6.json";
import user_6ohruL from "@/mocks/api/public/users/6ohruL.json";
import user_dU9xEE from "@/mocks/api/public/users/dU9xEE.json";
import user_WI7JsO from "@/mocks/api/public/users/WI7JsO.json";
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
  FgNzIyU: coord_FgNzIyU as PublicCoordinateDetail,
  MidXIgc: coord_MidXIgc as PublicCoordinateDetail,
  KBVZM0Q: coord_KBVZM0Q as PublicCoordinateDetail,
  ElMiYgQ: coord_ElMiYgQ as PublicCoordinateDetail,
  IJIkJQc: coord_IJIkJQc as PublicCoordinateDetail,
  NIYjZYI: coord_NIYjZYI as PublicCoordinateDetail,
  OEkHNhg: coord_OEkHNhg as PublicCoordinateDetail,
  FyFZeQQ: coord_FyFZeQQ as PublicCoordinateDetail,
  E2ZoGFE: coord_E2ZoGFE as PublicCoordinateDetail,
  NTaURoc: coord_NTaURoc as PublicCoordinateDetail,
  IFB0VAA: coord_IFB0VAA as PublicCoordinateDetail,
  EpdQhgA: coord_EpdQhgA as PublicCoordinateDetail,
};

/** GET /api/public/items/{id} 相当 */
export const REAL_ITEM_DETAILS: Record<string, PublicItemDetail> = {
  ISSIeSA: item_ISSIeSA as PublicItemDetail,
  KAmDEoY: item_KAmDEoY as PublicItemDetail,
  g0dzIXA: item_g0dzIXA as PublicItemDetail,
  MJJjNyM: item_MJJjNyM as PublicItemDetail,
  KIgJNgY: item_KIgJNgY as PublicItemDetail,
  lZRXAjA: item_lZRXAjA as PublicItemDetail,
  QFMhkZg: item_QFMhkZg as PublicItemDetail,
  mIKCMgA: item_mIKCMgA as PublicItemDetail,
  KYFZcXI: item_KYFZcXI as PublicItemDetail,
  MhAjKJU: item_MhAjKJU as PublicItemDetail,
  GFZpQXQ: item_GFZpQXQ as PublicItemDetail,
  FggEZpA: item_FggEZpA as PublicItemDetail,
};

export const REAL_COORDINATE_LIST_PATCHES: Record<string, PublicListItem> = {
  FgNzIyU: coordList_FgNzIyU as PublicListItem,
  MidXIgc: coordList_MidXIgc as PublicListItem,
  KBVZM0Q: coordList_KBVZM0Q as PublicListItem,
  ElMiYgQ: coordList_ElMiYgQ as PublicListItem,
  IJIkJQc: coordList_IJIkJQc as PublicListItem,
  NIYjZYI: coordList_NIYjZYI as PublicListItem,
  OEkHNhg: coordList_OEkHNhg as PublicListItem,
  FyFZeQQ: coordList_FyFZeQQ as PublicListItem,
  E2ZoGFE: coordList_E2ZoGFE as PublicListItem,
  NTaURoc: coordList_NTaURoc as PublicListItem,
  IFB0VAA: coordList_IFB0VAA as PublicListItem,
  EpdQhgA: coordList_EpdQhgA as PublicListItem,
};

export const REAL_ITEM_LIST_PATCHES: Record<string, PublicListItem> = {
  ISSIeSA: itemList_ISSIeSA as PublicListItem,
  KAmDEoY: itemList_KAmDEoY as PublicListItem,
  g0dzIXA: itemList_g0dzIXA as PublicListItem,
  MJJjNyM: itemList_MJJjNyM as PublicListItem,
  KIgJNgY: itemList_KIgJNgY as PublicListItem,
  lZRXAjA: itemList_lZRXAjA as PublicListItem,
  QFMhkZg: itemList_QFMhkZg as PublicListItem,
  mIKCMgA: itemList_mIKCMgA as PublicListItem,
  KYFZcXI: itemList_KYFZcXI as PublicListItem,
  MhAjKJU: itemList_MhAjKJU as PublicListItem,
  GFZpQXQ: itemList_GFZpQXQ as PublicListItem,
  FggEZpA: itemList_FggEZpA as PublicListItem,
};

/** GET /api/owner/coordinates/{id} 相当（本命のみ JSON。他は api.ts で合成） */
export const OWNER_COORDINATE_DETAILS: Record<string, OwnerCoordinateFields> = {
  FgNzIyU: ownerCoord_FgNzIyU as OwnerCoordinateFields,
};

/** GET /api/owner/items/{id} 相当 */
export const OWNER_ITEM_DETAILS: Record<string, OwnerItemFields> = {
  ISSIeSA: ownerItem_ISSIeSA as OwnerItemFields,
};

/** GET /api/public/users/{id} 相当（vanity も正規 ID へ） */
export const REAL_USER_PROFILES: Record<string, PublicUserProfile> = {
  FL6QQa: user_FL6QQa as PublicUserProfile,
  lRTLf6: user_lRTLf6 as PublicUserProfile,
  "6ohruL": user_6ohruL as PublicUserProfile,
  teteko: user_6ohruL as PublicUserProfile,
  dU9xEE: user_dU9xEE as PublicUserProfile,
  JOTAROSAITO: user_dU9xEE as PublicUserProfile,
  WI7JsO: user_WI7JsO as PublicUserProfile,
  kimonomodern: user_WI7JsO as PublicUserProfile,
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

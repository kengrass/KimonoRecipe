/**
 * サイト読み取り API の入口（公開／owner／me）。
 *
 * ファイル分割（迷子防止・挙動は同じ）:
 * | 口 | ファイル |
 * |----|----------|
 * | 共通輸送 | `api-fetch.ts` |
 * | モック詳細土台 | `api-mock-detail.ts` |
 * | `/api/public` | `api-public.ts` |
 * | `/api/owner` | `api-owner.ts` |
 * | `/api/me` | `api-me.ts` |
 *
 * 書き込みは `spike-write.ts`。経路表: `lib/README.md`。
 * 既存の `from "@/lib/api"` はこのまま使える。
 */

export {
  getBrowseFallbackList,
  getDetailNeighborList,
  getMockPublicCoordinates,
  getMockPublicItems,
  getPickupUsers,
  getPublicCoordinate,
  getPublicItem,
  getPublicListPage,
  getPublicProfileListPage,
  getPublicUser,
  getPublicUsersPage,
} from "./api-public";

export {
  getOwnerCoordinate,
  getOwnerItem,
  getOwnerListPage,
} from "./api-owner";

export {
  getMeFavoritesPage,
  getMeFollowingPostsPage,
  getMeFollowingUsers,
} from "./api-me";

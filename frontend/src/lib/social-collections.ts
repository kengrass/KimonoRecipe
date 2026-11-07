import { PICKUP_USERS, type PopularUser } from "./discovery-data";
import { MOCK_OTHER_USER, MOCK_OWNER_USER } from "./mock-data";
import type { PublicUser } from "./types";

/**
 * 一方向の関係だけを扱う。
 * 見られる：自分がフォローした人／自分がいいねした投稿
 * 見えない：自分をフォローした人／自分の投稿をいいねした人
 */

function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

const KNOWN_USERS: PublicUser[] = [
  MOCK_OWNER_USER,
  MOCK_OTHER_USER,
  ...PICKUP_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    profile_url: u.profile_url,
  })),
];

export function findKnownUser(id: string): PublicUser | null {
  return KNOWN_USERS.find((u) => u.id === id) ?? null;
}

/** モック：フォロー中ユーザー（自分がフォローした側） */
export const DEMO_FOLLOWING_USER_IDS = new Set([
  MOCK_OWNER_USER.id,
  MOCK_OTHER_USER.id,
  ...PICKUP_USERS.slice(0, 3).map((u) => u.id),
]);

export function demoFollowingIds(viewerId: string): string[] {
  return [...DEMO_FOLLOWING_USER_IDS].filter((id) => id !== viewerId);
}

export function usersFromIds(ids: string[]): PublicUser[] {
  return ids
    .map((id) => findKnownUser(id))
    .filter((u): u is PublicUser => Boolean(u));
}

export function listDemoFollowing(viewerId: string): PublicUser[] {
  return usersFromIds(demoFollowingIds(viewerId));
}

export function pickupUserById(id: string): PopularUser | undefined {
  return PICKUP_USERS.find((u) => u.id === id);
}

export function contentCountsForUser(id: string): {
  coordinateCount: number;
  itemCount: number;
} {
  const known = pickupUserById(id);
  if (known?.coordinateCount != null && known.itemCount != null) {
    return {
      coordinateCount: known.coordinateCount,
      itemCount: known.itemCount,
    };
  }
  return {
    coordinateCount: 20 + hashIndex(id, 400),
    itemCount: 10 + hashIndex(`${id}i`, 300),
  };
}

/** モック：いいね（検索の「お気に入り」と同じ＝自分がいいねした投稿）
 * ページネーションがモックで確認できるよう、十分な件数になる割合にする。
 */
export function isDemoFavorite(id: string): boolean {
  return hashIndex(id, 2) === 0;
}

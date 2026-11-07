import {
  DEMO_FOLLOWING_USER_IDS,
  demoFollowingIds,
  usersFromIds,
} from "./social-collections";
import type { PublicUser } from "./types";

export const FOLLOW_STORAGE_PREFIX = "kr-follow:";
export const FOLLOW_CHANGE_EVENT = "kr-follow-change";

function storageKey(userId: string): string {
  return `${FOLLOW_STORAGE_PREFIX}${userId}`;
}

/** 明示トグルがあればそれを優先。未操作ならデモのフォロー状態 */
export function isFollowingUser(targetId: string): boolean {
  if (typeof window === "undefined") {
    return DEMO_FOLLOWING_USER_IDS.has(targetId);
  }
  try {
    const raw = sessionStorage.getItem(storageKey(targetId));
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return DEMO_FOLLOWING_USER_IDS.has(targetId);
}

export function writeFollowing(targetId: string, following: boolean): void {
  try {
    sessionStorage.setItem(storageKey(targetId), following ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(FOLLOW_CHANGE_EVENT));
}

/** 自分のフォロー中（デモ ∪ session、解除は除外） */
export function listManagedFollowing(viewerId: string): PublicUser[] {
  const ids = new Set(demoFollowingIds(viewerId));
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key?.startsWith(FOLLOW_STORAGE_PREFIX)) continue;
        const targetId = key.slice(FOLLOW_STORAGE_PREFIX.length);
        const raw = sessionStorage.getItem(key);
        if (raw === "1") ids.add(targetId);
        if (raw === "0") ids.delete(targetId);
      }
    } catch {
      /* ignore */
    }
  }
  ids.delete(viewerId);
  return usersFromIds([...ids]);
}

export function subscribeFollowChange(onChange: () => void): () => void {
  window.addEventListener(FOLLOW_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(FOLLOW_CHANGE_EVENT, onChange);
}

/**
 * モック：公開ユーザー一覧プール。
 * 見本 JSON・既知ユーザー・投稿カタログから重複なく集める。
 */
import { REAL_USER_PROFILES } from "./mock-api-fixtures";
import {
  MOCK_BRAND_A_USER,
  MOCK_BRAND_B_USER,
  MOCK_MEMBER_USER,
  MOCK_OTHER_USER,
  MOCK_OWNER_USER,
  MOCK_DEMO_MIDORI_USER,
} from "./mock-data";
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "./search-catalog";
import type { PublicUserListItem } from "./types";
import { buildMockPublicUserProfile } from "./mypage-data";

function toListItem(
  profile: {
    id: string;
    name: string;
    profile_url: string;
    avatar_url?: string | null;
    bio?: string;
  },
): PublicUserListItem {
  return {
    id: profile.id,
    name: profile.name,
    profile_url: profile.profile_url,
    avatar_url: profile.avatar_url ?? null,
    bio: profile.bio ?? "",
  };
}

/** 公開ユーザー検索のモック全集（1回組み立て） */
let cached: PublicUserListItem[] | null = null;

export function getMockPublicUserListPool(): PublicUserListItem[] {
  if (cached) return cached;

  const byId = new Map<string, PublicUserListItem>();

  for (const profile of Object.values(REAL_USER_PROFILES)) {
    // vanity キーで同じ実体が二重登録されないよう id で寄せる
    if (!byId.has(profile.id)) byId.set(profile.id, toListItem(profile));
  }

  const seeded = [
    MOCK_OWNER_USER,
    MOCK_OTHER_USER,
    MOCK_MEMBER_USER,
    MOCK_DEMO_MIDORI_USER,
    MOCK_BRAND_A_USER,
    MOCK_BRAND_B_USER,
  ];
  for (const user of seeded) {
    if (byId.has(user.id)) continue;
    const profile = buildMockPublicUserProfile(user.id);
    byId.set(
      user.id,
      profile
        ? toListItem(profile)
        : {
            id: user.id,
            name: user.name,
            profile_url: user.profile_url,
            bio: "",
          },
    );
  }

  for (const item of [
    ...getSearchCoordinateCatalog(),
    ...getSearchItemCatalog(),
  ]) {
    const u = item.user;
    if (byId.has(u.id)) continue;
    const profile = buildMockPublicUserProfile(u.id);
    byId.set(
      u.id,
      profile
        ? toListItem(profile)
        : {
            id: u.id,
            name: u.name,
            profile_url: u.profile_url,
            bio: "",
          },
    );
  }

  cached = [...byId.values()];
  return cached;
}

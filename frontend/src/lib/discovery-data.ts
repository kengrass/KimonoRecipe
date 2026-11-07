/**
 * トップ等の発見枠（Pick up ユーザーなど）。
 * 公開一覧カタログ／公開 API から組み立て。UI は `base/home`。
 */

import { CDN_ORIGIN, LARAVEL_ORIGIN } from "./config";
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "./search-catalog";
import type { PublicListItem } from "./types";
import { getContentVisibility } from "./visibility";

export type PopularUser = {
  id: string;
  name: string;
  profile_url: string;
  avatar_url?: string;
  coordinateCount?: number;
  itemCount?: number;
};

function mockPublicContentCounts(userId: string): {
  coordinateCount: number;
  itemCount: number;
} {
  let coordinateCount = 0;
  let itemCount = 0;
  for (const row of getSearchCoordinateCatalog()) {
    if (row.user.id !== userId) continue;
    if (getContentVisibility(row.id) === "public") coordinateCount += 1;
  }
  for (const row of getSearchItemCatalog()) {
    if (row.user.id !== userId) continue;
    if (getContentVisibility(row.id) === "public") itemCount += 1;
  }
  return { coordinateCount, itemCount };
}

/**
 * トップ「Pick upユーザー」枠の元データ（/following#pickup と共通）。
 * 件数はモック投稿カタログの公開数と連動（管理画面と同じ母集団）。
 */
const POPULAR_USER_SEEDS: Omit<PopularUser, "coordinateCount" | "itemCount">[] =
  [
    {
      id: "FL6QQa",
      name: "デモ運営",
      profile_url: "/m/FL6QQa",
    },
    {
      id: "lRTLf6",
      name: "デモ太郎",
      profile_url: "/m/lRTLf6",
    },
    {
      id: "6ohruL",
      name: "デモ花子",
      profile_url: "/m/6ohruL",
    },
    {
      id: "dU9xEE",
      name: "デモブランドA",
      profile_url: "/m/dU9xEE",
    },
    {
      id: "WI7JsO",
      name: "デモブランドB",
      profile_url: "/m/WI7JsO",
    },
  ];

export const POPULAR_USERS: PopularUser[] = POPULAR_USER_SEEDS.map((u) => ({
  ...u,
  ...mockPublicContentCounts(u.id),
}));

/** Pick up 自動選定: 公開コーデ・公開アイテムがそれぞれこの件数以上 */
export const PICKUP_MIN_PUBLIC_EACH = 4;

/** /following の Pick up（現行 /recommend 相当）。モックは件数基準で自動抽出 */
export const PICKUP_USERS: PopularUser[] = POPULAR_USERS.filter(
  (u) =>
    (u.coordinateCount ?? 0) >= PICKUP_MIN_PUBLIC_EACH &&
    (u.itemCount ?? 0) >= PICKUP_MIN_PUBLIC_EACH,
);

export const SPONSOR_LINK = {
  href: `${LARAVEL_ORIGIN}/special_sites/cleaning?utm_source=site&utm_medium=square&utm_campaign=kihadaya`,
  image_url: `${CDN_ORIGIN}/sponsor/c6d84c844af83d5927ccb202e7d9246252f8bce7.png`,
  alt: "着物のクリーニング(悉皆)",
  /** 画面表示用の短い見出し */
  title: "着物のクリーニング（悉皆）",
};

/** 2枠目モック（ジュエリー想定・同じ枠位置でローテ） */
export const SPONSOR_LINK_B = {
  href: `${LARAVEL_ORIGIN}/special_sites/cleaning?utm_source=site&utm_medium=square&utm_campaign=jewelry_mock`,
  image_url: `${CDN_ORIGIN}/sponsor/c6d84c844af83d5927ccb202e7d9246252f8bce7.png`,
  alt: "装身具・ジュエリー（モック）",
  title: "装いのジュエリー（モック2枠目）",
};

export const SPONSOR_SLOTS = [SPONSOR_LINK, SPONSOR_LINK_B] as const;

/**
 * @deprecated 協賛ロゴは `lib/admin/logo-sponsors-store` ＋管理「協賛ロゴ」タブへ。
 * 仮の協賛社名はサイトに出さない。
 */
export type CategorySponsorSlot = {
  category: string;
  sponsorName: string;
  logoLabel?: string;
  href: string;
};

/** 互換用。表示の正は管理の有効協賛（空＝ロゴ列なし） */
export const CATEGORY_SPONSOR_SLOTS: CategorySponsorSlot[] = [];

import { SPONSOR_LINK, SPONSOR_LINK_B } from "@/lib/discovery-data";
import { buildMockAdminUsers } from "./build-mock-admin-users";
import type {
  ActivityBucket,
  ActivityBucketId,
  AdminAd,
  AdminKpis,
  AdminUser,
  SponsorMonthlyReport,
  UsageInsight,
} from "./types";

const DAY = 24 * 60 * 60 * 1000;

/** モック基準時刻（再現性のため固定に近い値を使う） */
const MOCK_NOW = Date.parse("2026-10-24T12:00:00+09:00");

/**
 * 管理ユーザー。投稿件数は公開モックカタログと連動。
 * メール／状態など運営項目だけプロファイル。
 */
export const ADMIN_USERS: AdminUser[] = buildMockAdminUsers();

const BUCKET_DEFS: { id: ActivityBucketId; label: string; maxDays: number | null }[] =
  [
    { id: "24h", label: "〜24時間", maxDays: 1 },
    { id: "7d", label: "〜7日", maxDays: 7 },
    { id: "30d", label: "〜30日", maxDays: 30 },
    { id: "90d", label: "〜90日", maxDays: 90 },
    { id: "180d", label: "〜180日", maxDays: 180 },
    { id: "365d", label: "〜365日", maxDays: 365 },
    { id: "366d+", label: "366日〜", maxDays: null },
  ];

/**
 * 最終利用からの期間帯。
 * 各帯は「直前の帯より古く、この上限以下」（366日〜はそれより古い）。
 */
export function buildActivityBuckets(
  users: AdminUser[],
  nowMs = MOCK_NOW,
): ActivityBucket[] {
  const total = users.length || 1;
  const ages = users.map((u) => {
    const t = Date.parse(u.lastActiveAt);
    return Number.isNaN(t) ? Infinity : (nowMs - t) / DAY;
  });

  const counts: number[] = BUCKET_DEFS.map((def, index) => {
    if (def.maxDays == null) {
      return ages.filter((a) => a > 365).length;
    }
    if (index === 0) {
      return ages.filter((a) => a <= def.maxDays!).length;
    }
    const prevMax = BUCKET_DEFS[index - 1].maxDays ?? 0;
    return ages.filter((a) => a > prevMax && a <= def.maxDays!).length;
  });

  let cumulative = 0;
  return BUCKET_DEFS.map((def, i) => {
    cumulative += counts[i];
    return {
      id: def.id,
      label: def.label,
      count: counts[i],
      share: counts[i] / total,
      cumulativeCount: cumulative,
      cumulativeShare: cumulative / total,
    };
  });
}

export function buildAdminKpis(users: AdminUser[]): AdminKpis {
  let mainCoords = 0;
  let linkedMain = 0;
  let tempCoordinateCount = 0;
  for (const u of users) {
    const main = u.publicCoordinateCount + u.privateCoordinateCount;
    mainCoords += main;
    linkedMain += u.attachmentRate * main;
    tempCoordinateCount += u.tempCoordinateCount;
  }
  return {
    userCount: users.length,
    coordinateCount: mainCoords,
    tempCoordinateCount,
    itemCount: users.reduce(
      (s, u) => s + u.publicItemCount + u.privateItemCount,
      0,
    ),
    imageCount: users.reduce((s, u) => s + u.imageCount, 0),
    attachmentRate: mainCoords > 0 ? linkedMain / mainCoords : 0,
  };
}

export function getAdminUser(id: string): AdminUser | undefined {
  return ADMIN_USERS.find((u) => u.id === id);
}

/** 売れる案件の種（実績は初期0・サイト実測で加算） */
export const ADMIN_ADS: AdminAd[] = [
  {
    id: "a1",
    name: "悉皆クリーニング 秋キャンペーン",
    advertiser: "きはだや",
    placements: ["home_top", "coord_detail"],
    href: SPONSOR_LINK.href,
    imageUrl: SPONSOR_LINK.image_url,
    title: SPONSOR_LINK.title,
    enabled: true,
    startOn: "2026-10-01",
    endOn: "2026-12-31",
    // 実績は trackAdEvent → recordAdStat で加算（初期0）
    impressions: 0,
    clicks: 0,
  },
  {
    id: "a2",
    name: "装いジュエリー（並行配信）",
    advertiser: "ジュエリーモック社",
    placements: ["home_top", "coord_detail"],
    href: SPONSOR_LINK_B.href,
    imageUrl: SPONSOR_LINK_B.image_url,
    title: SPONSOR_LINK_B.title,
    enabled: true,
    startOn: "2026-10-01",
    endOn: "2026-11-30",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "a3",
    name: "アイテム詳細テスト（停止中）",
    advertiser: "きはだや",
    placements: ["item_detail"],
    href: SPONSOR_LINK.href,
    imageUrl: SPONSOR_LINK.image_url,
    title: SPONSOR_LINK.title,
    enabled: false,
    startOn: "",
    endOn: "",
    impressions: 0,
    clicks: 0,
  },
];

/** サービス利用の実態（モック・内部向け） */
export const USAGE_INSIGHT: UsageInsight = {
  today: {
    date: "2026-10-24",
    memberUu: 186,
    guestUu: 1240,
    pv: 4820,
    coordinateCount: 24,
    itemCount: 41,
  },
  last7Days: [
    {
      date: "2026-10-18",
      memberUu: 142,
      guestUu: 980,
      pv: 3610,
      coordinateCount: 18,
      itemCount: 29,
    },
    {
      date: "2026-10-19",
      memberUu: 155,
      guestUu: 1050,
      pv: 3890,
      coordinateCount: 21,
      itemCount: 33,
    },
    {
      date: "2026-10-20",
      memberUu: 168,
      guestUu: 1120,
      pv: 4120,
      coordinateCount: 19,
      itemCount: 36,
    },
    {
      date: "2026-10-21",
      memberUu: 171,
      guestUu: 1180,
      pv: 4300,
      coordinateCount: 27,
      itemCount: 44,
    },
    {
      date: "2026-10-22",
      memberUu: 160,
      guestUu: 1090,
      pv: 4010,
      coordinateCount: 15,
      itemCount: 28,
    },
    {
      date: "2026-10-23",
      memberUu: 178,
      guestUu: 1210,
      pv: 4550,
      coordinateCount: 22,
      itemCount: 38,
    },
    {
      date: "2026-10-24",
      memberUu: 186,
      guestUu: 1240,
      pv: 4820,
      coordinateCount: 24,
      itemCount: 41,
    },
  ],
  pagePv: [
    { pathLabel: "トップ", pv: 1520, memberShare: 0.18 },
    { pathLabel: "検索", pv: 980, memberShare: 0.22 },
    { pathLabel: "コーデ詳細", pv: 1180, memberShare: 0.31 },
    { pathLabel: "アイテム詳細", pv: 740, memberShare: 0.28 },
    { pathLabel: "プロフィール", pv: 400, memberShare: 0.45 },
  ],
  topCoordinates: [
    { id: "c1", kind: "coordinate", title: "モックコーデ", pv: 312 },
    { id: "c2", kind: "coordinate", title: "モックコーデ", pv: 278 },
    { id: "c3", kind: "coordinate", title: "モックコーデ", pv: 241 },
  ],
  topItems: [
    { id: "i1", kind: "item", title: "モックアイテム", pv: 198 },
    { id: "i2", kind: "item", title: "モックアイテム", pv: 176 },
    { id: "i3", kind: "item", title: "モックアイテム", pv: 154 },
  ],
  searches: [
    { query: "浴衣", count: 86, zeroHit: false },
    { query: "帯締め 赤", count: 42, zeroHit: false },
    { query: "着物 メンズ", count: 31, zeroHit: false },
    { query: "〇〇ブランド限定", count: 12, zeroHit: true },
  ],
  funnel: {
    detailViews: 1920,
    authPromptShown: 410,
    loginOrRegist: 58,
  },
};

/** スポンサー向け月次（モック） */
export const SPONSOR_MONTHLY_REPORTS: SponsorMonthlyReport[] = [
  {
    month: "2026-10",
    label: "2026年10月",
    reachUu: 18200,
    memberUu: 2100,
    guestUu: 16100,
    pv: 86400,
    reachMom: 0.084,
    placements: [
      {
        id: "a1",
        name: "トップ中段",
        impressions: 42000,
        clicks: 680,
      },
      {
        id: "b1",
        name: "春の特集バナー",
        impressions: 18500,
        clicks: 420,
      },
      {
        id: "pickup",
        name: "Pick up ユーザー枠",
        impressions: 9600,
        clicks: 310,
      },
    ],
  },
  {
    month: "2026-09",
    label: "2026年9月",
    reachUu: 16800,
    memberUu: 1980,
    guestUu: 14820,
    pv: 79200,
    reachMom: 0.031,
    placements: [
      {
        id: "a1",
        name: "トップ中段",
        impressions: 39000,
        clicks: 610,
      },
      {
        id: "b1",
        name: "春の特集バナー",
        impressions: 17200,
        clicks: 390,
      },
      {
        id: "pickup",
        name: "Pick up ユーザー枠",
        impressions: 9100,
        clicks: 280,
      },
    ],
  },
];

/**
 * モック API 時の PV／UU 日次累計（localStorage）。
 * 送信ロジックは usage-pageview。管理統計のモック表示はここ。
 */

import type { UsageDailySnapshot, UsageInsight } from "@/lib/admin/types";
import { normalizePageviewPath } from "@/lib/usage-path";

const MOCK_STORE_KEY = "kr-mock-usage-v1";
const MOCK_ANON_KEY = "kr-mock-anon-id";

type MockDayBucket = {
  memberKeys: string[];
  guestKeys: string[];
  pv: number;
  paths: Record<string, { pv: number; memberPv: number }>;
};

type MockStore = Record<string, MockDayBucket>;

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayYmdFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOffsetYmd(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return todayYmdFromDate(d);
}

function readMockStore(): MockStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MOCK_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MockStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMockStore(store: MockStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
}

function mockAnonId(): string {
  if (typeof window === "undefined") return "g_ssr";
  let id = window.localStorage.getItem(MOCK_ANON_KEY);
  if (!id) {
    id = `g_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(MOCK_ANON_KEY, id);
  }
  return id;
}

/** モック時の 1 PV 記録（usage-pageview から呼ばれる） */
export function recordMockPageView(path: string, memberId: string | null) {
  const day = todayYmd();
  const store = readMockStore();
  const bucket = store[day] ?? {
    memberKeys: [],
    guestKeys: [],
    pv: 0,
    paths: {},
  };
  bucket.pv += 1;
  const pathKey = normalizePageviewPath(path);
  const pathRow = bucket.paths[pathKey] ?? { pv: 0, memberPv: 0 };
  pathRow.pv += 1;
  if (memberId) {
    pathRow.memberPv += 1;
    if (!bucket.memberKeys.includes(memberId)) bucket.memberKeys.push(memberId);
  } else {
    const gid = mockAnonId();
    if (!bucket.guestKeys.includes(gid)) bucket.guestKeys.push(gid);
  }
  bucket.paths[pathKey] = pathRow;
  store[day] = bucket;
  writeMockStore(store);
}

function snapshotFromMock(day: string): UsageDailySnapshot {
  const bucket = readMockStore()[day];
  return {
    date: day,
    memberUu: bucket?.memberKeys.length ?? 0,
    guestUu: bucket?.guestKeys.length ?? 0,
    pv: bucket?.pv ?? 0,
    coordinateCount: 0,
    itemCount: 0,
  };
}

/** 管理モック統計用 */
export function buildMockUsageInsight(): UsageInsight {
  const today = todayYmd();
  const last7Days: UsageDailySnapshot[] = [];
  for (let i = -6; i <= 0; i++) {
    last7Days.push(snapshotFromMock(dayOffsetYmd(i)));
  }
  const todayBucket = readMockStore()[today];
  const pagePv = Object.entries(todayBucket?.paths ?? {})
    .map(([path, row]) => {
      const pv = Number(row.pv) || 0;
      const memberPv = Number(row.memberPv) || 0;
      return {
        pathLabel: path,
        pv,
        memberShare: pv > 0 ? memberPv / pv : 0,
      };
    })
    .sort((a, b) => b.pv - a.pv)
    .slice(0, 12);

  return {
    today: snapshotFromMock(today),
    last7Days,
    pagePv,
    topCoordinates: [],
    topItems: [],
    searches: [],
    funnel: { detailViews: 0, authPromptShown: 0, loginOrRegist: 0 },
  };
}

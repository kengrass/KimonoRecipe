/**
 * モック時の管理ユーザー。
 * spike シード相当のデモユーザー（mckDemo=デモ花子、mckMidori=デモみどり）。
 * 投稿件数は各 ID のモックカタログ集計。
 */

import { getMockAttachedItems } from "@/lib/mock-attach-graph";
import {
  getSearchCoordinateCatalog,
  getSearchItemCatalog,
} from "@/lib/search-catalog";
import { getContentVisibility } from "@/lib/visibility";
import type { AdminUser } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MOCK_NOW = Date.parse("2026-10-24T12:00:00+09:00");

function hoursAgo(h: number): string {
  return new Date(MOCK_NOW - h * HOUR).toISOString();
}

function daysAgo(d: number): string {
  return new Date(MOCK_NOW - d * DAY).toISOString();
}

/** spike seed.ts の demo / other に対応 */
const DEMO_ACCOUNTS: Array<{
  id: string;
  name: string;
  email: string;
  adminNote: string;
  registeredAt: string;
  lastActiveAt: string;
  premiumId?: string | null;
  mailRejected?: boolean;
}> = [
  {
    id: "mckDemo",
    name: "デモ花子",
    email: "demo@example.com",
    adminNote: "spike demo@example.com 相当",
    registeredAt: "2018-04-01T10:00:00+09:00",
    lastActiveAt: hoursAgo(2),
    premiumId: "P-mckDemo",
  },
  {
    id: "mckMidori",
    name: "デモみどり",
    email: "midori@example.com",
    adminNote: "架空の別投稿者（非管理者）",
    registeredAt: "2019-11-02T14:00:00+09:00",
    lastActiveAt: daysAgo(3),
    premiumId: "P-mckMidori",
    mailRejected: true,
  },
];

type Counts = {
  publicCoordinateCount: number;
  privateCoordinateCount: number;
  tempCoordinateCount: number;
  publicItemCount: number;
  privateItemCount: number;
  attachmentRate: number;
  imageCount: number;
};

function emptyCounts(): Counts {
  return {
    publicCoordinateCount: 0,
    privateCoordinateCount: 0,
    tempCoordinateCount: 0,
    publicItemCount: 0,
    privateItemCount: 0,
    attachmentRate: 0,
    imageCount: 0,
  };
}

function countsForUser(userId: string): Counts {
  const counts = emptyCounts();
  let mainCoords = 0;
  let linkedMainCoords = 0;

  for (const coord of getSearchCoordinateCatalog()) {
    if (coord.user.id !== userId) continue;
    if (getContentVisibility(coord.id) === "private") {
      counts.privateCoordinateCount += 1;
    } else {
      counts.publicCoordinateCount += 1;
    }
    counts.imageCount += 1;
    mainCoords += 1;
    if (getMockAttachedItems(coord.id).length > 0) linkedMainCoords += 1;
  }
  for (const item of getSearchItemCatalog()) {
    if (item.user.id !== userId) continue;
    if (getContentVisibility(item.id) === "private") {
      counts.privateItemCount += 1;
    } else {
      counts.publicItemCount += 1;
    }
    counts.imageCount += 1;
  }
  counts.attachmentRate = mainCoords > 0 ? linkedMainCoords / mainCoords : 0;
  return counts;
}

export function buildMockAdminUsers(): AdminUser[] {
  return DEMO_ACCOUNTS.map((account) => {
    const counts = countsForUser(account.id);
    return {
      id: account.id,
      premiumId: account.premiumId ?? null,
      email: account.email,
      mailRejected: account.mailRejected ?? false,
      name: account.name,
      status: "active" as const,
      adminNote: account.adminNote,
      ...counts,
      registeredAt: account.registeredAt,
      lastActiveAt: account.lastActiveAt,
    };
  });
}

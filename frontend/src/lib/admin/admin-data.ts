/**
 * 管理の読み取り入口（RSC／サーバ寄り）。
 * - モック（USE_MOCK_API）: mock-data
 * - LIVE（!USE_MOCK_API = spike または API_BASE_URL）: GET /api/admin/...
 *   失敗時はモックに落とさず liveError を返す
 *
 * 広告／協賛の配列 CRUD はここではなく ads-store / logo-sponsors-store。
 * @see ./README.md
 */

import {
  adminGetJson,
  liveAdminErrorMessage,
} from "@/lib/admin/admin-fetch";
import {
  ADMIN_USERS,
  buildActivityBuckets,
  buildAdminKpis,
  getAdminUser as getMockAdminUser,
} from "@/lib/admin/mock-data";
import type {
  ActivityBucket,
  AdminKpis,
  AdminUser,
  UsageInsight,
} from "@/lib/admin/types";
import { USE_MOCK_API } from "@/lib/config";
import { buildMockUsageInsight } from "@/lib/usage-tracking";

export type AdminDataSource = "live" | "mock";

export type AdminStatsBundle = {
  source: AdminDataSource;
  kpis: AdminKpis;
  activity: ActivityBucket[];
  usage: UsageInsight | null;
  /** live 取得失敗時（未ログイン等） */
  liveError?: string;
};

export async function loadAdminUsers(): Promise<{
  source: AdminDataSource;
  users: AdminUser[];
  liveError?: string;
}> {
  if (!USE_MOCK_API) {
    const result = await adminGetJson<{
      data: AdminUser[];
      source?: AdminDataSource;
    }>("/api/admin/users");
    if (result.ok && result.body.data) {
      return { source: result.body.source ?? "live", users: result.body.data };
    }
    const status = result.ok ? 0 : result.status;
    return {
      source: "live",
      users: [],
      liveError: liveAdminErrorMessage(status),
    };
  }
  return { source: "mock", users: ADMIN_USERS };
}

export async function loadAdminUser(
  id: string,
): Promise<{ source: AdminDataSource; user: AdminUser } | null> {
  if (!USE_MOCK_API) {
    const result = await adminGetJson<{
      data: AdminUser;
      source?: AdminDataSource;
    }>(`/api/admin/users/${encodeURIComponent(id)}`);
    if (result.ok && result.body.data) {
      return { source: result.body.source ?? "live", user: result.body.data };
    }
    return null;
  }
  const user = getMockAdminUser(id);
  return user ? { source: "mock", user } : null;
}

export async function loadAdminStats(): Promise<AdminStatsBundle> {
  if (!USE_MOCK_API) {
    const result = await adminGetJson<{
      source?: AdminDataSource;
      kpis: AdminKpis;
      activity: ActivityBucket[];
      usage: UsageInsight | null;
    }>("/api/admin/stats");
    if (result.ok && result.body.kpis && result.body.activity) {
      return {
        source: result.body.source ?? "live",
        kpis: result.body.kpis,
        activity: result.body.activity,
        usage: result.body.usage ?? null,
      };
    }
    const status = result.ok ? 0 : result.status;
    return {
      source: "live",
      kpis: {
        userCount: 0,
        coordinateCount: 0,
        tempCoordinateCount: 0,
        itemCount: 0,
        imageCount: 0,
        attachmentRate: 0,
      },
      activity: [],
      usage: null,
      liveError: liveAdminErrorMessage(status),
    };
  }
  return {
    source: "mock",
    kpis: buildAdminKpis(ADMIN_USERS),
    activity: buildActivityBuckets(ADMIN_USERS),
    usage: buildMockUsageInsight(),
  };
}

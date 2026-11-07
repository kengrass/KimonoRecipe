import { cookies } from "next/headers";
import {
  SPIKE_SESSION_COOKIE,
  USE_MOCK_API,
  USE_SPIKE_API,
} from "@/lib/config";
import {
  MOCK_AUTH_COOKIE,
  parseMockAuthMode,
  userForMockAuthMode,
} from "@/lib/mock-session";
import type { MockAuthMode } from "@/lib/types";

/**
 * 閲覧者（誰として見ているか）をサーバで決める入口。
 *
 * - 公開／owner 一覧の出し分けは、ここで返した ID だけを信じる
 * - モック時のみ Cookie `kr-mock-auth-mode`（MockAuthBar）を見る
 * - spike 時は `kr_spike_session` → `/api/me`
 * - 実 API 接続後はモック Cookie を無視する（なりすまし防止）
 * - 本番セッション／JWT はここに差し替える（呼び出し側は変えない）
 */
export async function getServerViewerUserId(): Promise<string | null> {
  if (USE_SPIKE_API) {
    const jar = await cookies();
    const token = jar.get(SPIKE_SESSION_COOKIE)?.value;
    if (!token) return null;
    const origin = (
      process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010"
    ).replace(/\/$/, "");
    try {
      const res = await fetch(`${origin}/api/me`, {
        headers: { Cookie: `${SPIKE_SESSION_COOKIE}=${token}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { user?: { id?: string } };
      return json.user?.id ?? null;
    } catch {
      return null;
    }
  }
  if (!USE_MOCK_API) {
    // 正式棚: ここでセッション／JWT からユーザー ID を差し込む（spike 以外の本番経路）。
    // Next の呼び出し側は変えない。未接続時はゲスト扱い。
    return null;
  }
  const jar = await cookies();
  const mode = parseMockAuthMode(jar.get(MOCK_AUTH_COOKIE)?.value);
  return userForMockAuthMode(mode)?.id ?? null;
}

export async function getServerMockAuthMode(): Promise<MockAuthMode> {
  if (!USE_MOCK_API) return "guest";
  const jar = await cookies();
  return parseMockAuthMode(jar.get(MOCK_AUTH_COOKIE)?.value);
}

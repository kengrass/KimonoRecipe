import {
  API_BASE_URL,
  SPIKE_SESSION_COOKIE,
  USE_MOCK_API,
  USE_SPIKE_API,
} from "@/lib/config";

/**
 * 管理がモックではなく API を叩くか。
 * spike（USE_SPIKE_API）でも本番（API_BASE_URL）でも true。
 * 広告／協賛／ユーザー書き込みはこれを見る（USE_SPIKE_API 単独は使わない）。
 * @see ./README.md
 */
export const ADMIN_USES_LIVE_API = !USE_MOCK_API;

/** RSC は SPIKE_API_ORIGIN 直、ブラウザは同オリジン */
export function adminApiFetchBase(): string {
  if (API_BASE_URL) return API_BASE_URL;
  if (USE_SPIKE_API && typeof window === "undefined") {
    return (process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010").replace(
      /\/$/,
      "",
    );
  }
  return "";
}

export async function adminSpikeHeaders(): Promise<Record<string, string>> {
  if (!USE_SPIKE_API || typeof window !== "undefined") return {};
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get(SPIKE_SESSION_COOKIE)?.value;
    if (token) return { Cookie: `${SPIKE_SESSION_COOKIE}=${token}` };
  } catch {
    /* ignore */
  }
  return {};
}

export function liveAdminErrorMessage(status: number): string {
  if (status === 401) {
    return "管理APIはログインが必要です（spike: demo@example.com / demo-pass）。";
  }
  if (status === 404) {
    return "管理APIが見つかりません。spike/api を再起動してください（npm run dev）。";
  }
  if (status === 0) {
    return "管理APIに接続できません。spike/api が起動しているか確認してください。";
  }
  return `管理APIエラー（HTTP ${status}）。`;
}

export async function adminGetJson<T>(
  path: string,
): Promise<{ ok: true; body: T } | { ok: false; status: number }> {
  try {
    const headers = await adminSpikeHeaders();
    const res = await fetch(`${adminApiFetchBase()}${path}`, {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, body: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

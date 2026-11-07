/**
 * 読み取り API の共通輸送（三口の土台）。
 * ブラウザは同オリジン rewrite、RSC＋spike は SPIKE_API_ORIGIN 直叩き。
 */

import {
  API_BASE_URL,
  SPIKE_SESSION_COOKIE,
  USE_SPIKE_API,
} from "./config";
import type { ListResponse, PublicListItem } from "./types";

export type ListPageResponse = ListResponse<PublicListItem> & {
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

/** ブラウザは同オリジン rewrite、RSC は SPIKE_API_ORIGIN 直叩き */
export function apiFetchBase(): string {
  if (API_BASE_URL) return API_BASE_URL;
  if (USE_SPIKE_API && typeof window === "undefined") {
    return (process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010").replace(
      /\/$/,
      "",
    );
  }
  return "";
}

async function spikeServerHeaders(): Promise<Record<string, string>> {
  if (!USE_SPIKE_API || typeof window !== "undefined") return {};
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get(SPIKE_SESSION_COOKIE)?.value;
    if (token) return { Cookie: `${SPIKE_SESSION_COOKIE}=${token}` };
  } catch {
    /* リクエスト外・クライアント束ねでは無視 */
  }
  return {};
}

export async function fetchJson<T>(path: string): Promise<T> {
  const headers = await spikeServerHeaders();
  const res = await fetch(`${apiFetchBase()}${path}`, {
    credentials: "include",
    headers,
    ...(USE_SPIKE_API
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 } }),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

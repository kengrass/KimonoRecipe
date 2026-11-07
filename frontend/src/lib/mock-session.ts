import { MOCK_MEMBER_USER, MOCK_OWNER_USER } from "@/lib/mock-data";
import { SHOW_MOCK_DEV_CHROME } from "@/lib/config";
import type { MockAuthMode, PublicUser } from "@/lib/types";

/**
 * モック閲覧者 Cookie。
 *
 * なぜ localStorage と二重か:
 * - localStorage … クライアント UI（いいね誘導など）用
 * - Cookie … RSC が閲覧者を読む用（公開範囲の出し分け）
 * MockAuthBar / MockAuthProvider が両方に同じ mode を書く。
 * 実 API 接続後は書かない／読まない（server-viewer）。
 */
export const MOCK_AUTH_COOKIE = "kr-mock-auth-mode";

export function parseMockAuthMode(
  raw: string | null | undefined,
): MockAuthMode {
  if (raw === "guest" || raw === "member" || raw === "owner") return raw;
  return "guest";
}

export function userForMockAuthMode(authMode: MockAuthMode): PublicUser | null {
  if (authMode === "owner") return MOCK_OWNER_USER;
  if (authMode === "member") return MOCK_MEMBER_USER;
  return null;
}

/** ブラウザ → Cookie。モック時のみ。次の RSC で getServerViewerUserId が読める */
export function writeMockAuthCookie(mode: MockAuthMode) {
  if (typeof document === "undefined") return;
  if (!SHOW_MOCK_DEV_CHROME) {
    document.cookie = `${MOCK_AUTH_COOKIE}=; Path=/; Max-Age=0`;
    return;
  }
  document.cookie = `${MOCK_AUTH_COOKIE}=${mode}; Path=/; SameSite=Lax; Max-Age=31536000`;
}

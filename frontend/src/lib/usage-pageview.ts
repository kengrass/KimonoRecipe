/**
 * サイト PV の送信（settle／同一ロード dedupe）。
 * UI は SiteChrome → UsageBeacon → trackPageView。
 * モック累計は usage-mock-store。spike／本番は POST /api/public/usage/pageview。
 *
 * ## PV の定義（一般的な SPA 計測に合わせる）
 * - **数える:** 画面遷移が落ち着いたあと、表示中の pathname ごとに 1 回
 * - **数えない:** 同一ドキュメント読み込み内の同一 pathname 再送（Strict Mode 等）、
 *   認証の後追い、100ms 以内のリダイレクト連鎖、クエリ／hash のみ、管理画面
 * - **フルリロード:** performance.timeOrigin が変わるので、その画面を改めて 1 回
 *
 * キーは `timeOrigin|pathname`。同一ロード内の二重送信を防ぎつつ、
 * A→B→A の再訪やリロードは落とさない。
 *
 * path 正規化は usage-path（spike `lib/usage.ts` の normalizePath と同規則）。
 */

import { USE_MOCK_API, USE_SPIKE_API, API_BASE_URL } from "@/lib/config";
import { recordMockPageView } from "@/lib/usage-mock-store";
import { normalizePageviewPath } from "@/lib/usage-path";

export { normalizePageviewPath } from "@/lib/usage-path";

const PV_COMMIT_STORAGE = "kr-pv-commit-key";

/** リダイレクト・replaceState の連打を1遷移にまとめる（業界定石〜100ms） */
const PV_SETTLE_MS = 100;

let settleTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPath: string | null = null;
let pendingMemberId: string | null = null;
/** このドキュメント読み込みで最後に確定したキー（timeOrigin|path） */
let lastCommitKey: string | null = null;

function commitKeyFor(path: string): string {
  return `${performance.timeOrigin}|${path}`;
}

function hasCommitted(path: string): boolean {
  const key = commitKeyFor(path);
  if (lastCommitKey === key) return true;
  try {
    if (window.sessionStorage.getItem(PV_COMMIT_STORAGE) === key) {
      lastCommitKey = key;
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function markCommitted(path: string): void {
  const key = commitKeyFor(path);
  lastCommitKey = key;
  try {
    window.sessionStorage.setItem(PV_COMMIT_STORAGE, key);
  } catch {
    /* ignore */
  }
}

async function sendPageView(
  path: string,
  memberId: string | null,
): Promise<void> {
  if (USE_MOCK_API) {
    recordMockPageView(path, memberId);
    return;
  }
  if (!USE_SPIKE_API && !API_BASE_URL) return;
  try {
    await fetch("/api/public/usage/pageview", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch {
    /* 計測失敗は本処理を止めない */
  }
}

/**
 * ページ表示を記録する（呼び出し側は遷移のたびに呼んでよい）。
 * 実際の送信は settle 後・未送信の pathname のときだけ。
 */
export function trackPageView(input: {
  path: string;
  memberId?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const path = normalizePageviewPath(input.path || window.location.pathname);
  if (path.startsWith("/admin")) return;

  pendingPath = path;
  pendingMemberId = input.memberId ?? null;

  if (settleTimer != null) clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    settleTimer = null;
    const settled = pendingPath;
    const memberId = pendingMemberId;
    pendingPath = null;
    if (!settled) return;
    if (hasCommitted(settled)) return;
    markCommitted(settled);
    void sendPageView(settled, memberId);
  }, PV_SETTLE_MS);
}

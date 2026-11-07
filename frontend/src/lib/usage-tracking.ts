/**
 * サイト利用の PV／UU 計測の入口。
 * - 送信・定義: usage-pageview
 * - モック日次累計: usage-mock-store
 * 既存 import（`@/lib/usage-tracking`）はこのまま使える。
 */

export { normalizePageviewPath } from "@/lib/usage-path";
export { trackPageView } from "@/lib/usage-pageview";
export { buildMockUsageInsight } from "@/lib/usage-mock-store";

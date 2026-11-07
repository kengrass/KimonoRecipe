/**
 * PV path の正規化（フロント／spike 共通の規則）。
 * pathname のみ・最大 200 文字。クエリ／hash は落とす。
 * spike 側: `spike/api/src/lib/usage.ts` の normalizePath。
 */

export function normalizePageviewPath(path: string): string {
  const trimmed = (path || "/").trim() || "/";
  const noHash = trimmed.split("#")[0] || "/";
  const pathname = noHash.split("?")[0] || "/";
  if (!pathname.startsWith("/")) return `/${pathname}`.slice(0, 200);
  return pathname.slice(0, 200);
}

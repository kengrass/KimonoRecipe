/**
 * 公開ユーザー一覧の絞り込み（サーバ側の正）。
 * フロントで再フィルタしない。
 */
import { LIST_PAGE_SIZE, paginateList, type PaginatedResult } from "./pagination";
import type { PublicUserListItem } from "./types";

export type PublicUserListQuery = {
  q?: string;
  page?: number;
  perPage?: number;
};

export function publicUserListQueryFromSearch(q?: string, page = 1): PublicUserListQuery {
  return { q, page };
}

/** URLSearchParams 用 */
export function publicUserListQueryToSearchParams(
  query: PublicUserListQuery,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.perPage && query.perPage !== LIST_PAGE_SIZE) {
    sp.set("per_page", String(query.perPage));
  }
  return sp;
}

function matchesUserQ(item: PublicUserListItem, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [item.name, item.bio ?? ""].join(" ").toLowerCase();
  return hay.includes(needle);
}

/**
 * モック／フォールバック：プールを q で絞ってページング。
 * q 未指定は空（ユーザー検索はキーワード必須。全件名簿は返さない）。
 */
export function queryPublicUserList(
  pool: PublicUserListItem[],
  query: PublicUserListQuery = {},
): PaginatedResult<PublicUserListItem> {
  const q = query.q?.trim() ?? "";
  if (!q) {
    return paginateList([], query.page ?? 1, query.perPage ?? LIST_PAGE_SIZE);
  }
  const filtered = pool.filter((item) => matchesUserQ(item, q));
  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, "ja"),
  );
  return paginateList(sorted, query.page ?? 1, query.perPage ?? LIST_PAGE_SIZE);
}

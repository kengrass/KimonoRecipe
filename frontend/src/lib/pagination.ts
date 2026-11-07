/** 検索一覧の既定件数（API `per_page` 省略時・契約と一致） */
export const LIST_PAGE_SIZE = 12;

/** URL の page= を安全な1始まり整数へ */
export function parsePositivePage(raw?: string | null, fallback = 1): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

export function paginateList<T>(
  items: T[],
  page: number,
  perPage = LIST_PAGE_SIZE,
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    page: safePage,
    totalPages,
    perPage,
  };
}

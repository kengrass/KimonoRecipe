import { getMockPublicItems } from "@/lib/api";
import { USE_SPIKE_API } from "@/lib/config";
import {
  parsePublicListQueryFromUrl,
  queryPublicList,
} from "@/lib/public-list-query";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/items
 * spike 接続時は API へプロキシ（app route が rewrite より優先されるため）。
 * 未接続時はモック実装。
 */
export async function GET(request: Request) {
  if (USE_SPIKE_API) {
    const origin = (
      process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010"
    ).replace(/\/$/, "");
    const incoming = new URL(request.url);
    const target = `${origin}/api/public/items${incoming.search}`;
    const res = await fetch(target, { cache: "no-store" });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = parsePublicListQueryFromUrl(new URL(request.url), "items");
  const pool = await getMockPublicItems();
  const result = queryPublicList(pool, "items", query);
  return NextResponse.json({
    data: result.items,
    meta: {
      page: result.page,
      per_page: result.perPage,
      total: result.total,
      total_pages: result.totalPages,
    },
  });
}

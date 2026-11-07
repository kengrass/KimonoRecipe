import { USE_SPIKE_API } from "@/lib/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * spike 未専用の /api/* をプロキシする。
 * `/api/public/items` 等の専用 route があるパスはそちらが優先。
 * next.config の rewrite だけだと未マッチ時に App Router の not-found HTML になるため。
 */
async function proxyToSpike(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!USE_SPIKE_API) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { path: parts } = await context.params;
  const rel = parts.map((p) => encodeURIComponent(p)).join("/");
  const origin = (
    process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010"
  ).replace(/\/$/, "");
  const incoming = new URL(request.url);
  const target = `${origin}/api/${rel}${incoming.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const body = await res.arrayBuffer();
  const out = new Headers();
  const resType = res.headers.get("Content-Type");
  if (resType) out.set("Content-Type", resType);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) out.append("Set-Cookie", c);
  if (setCookie.length === 0) {
    const single = res.headers.get("Set-Cookie");
    if (single) out.set("Set-Cookie", single);
  }

  return new NextResponse(body, { status: res.status, headers: out });
}

export const GET = proxyToSpike;
export const PUT = proxyToSpike;
export const POST = proxyToSpike;
export const PATCH = proxyToSpike;
export const DELETE = proxyToSpike;

import { USE_SPIKE_API } from "@/lib/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * /media/* → spike へプロキシ。
 * 非公開画像は spike 側でセッション判定するため Cookie を転送する。
 * （rewrite だけだと Image 最適化や一部経路で Cookie が落ちる）
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!USE_SPIKE_API) {
    return new NextResponse(null, { status: 404 });
  }

  const { path: parts } = await context.params;
  const rel = parts.map((p) => encodeURIComponent(p)).join("/");
  const origin = (
    process.env.SPIKE_API_ORIGIN ?? "http://127.0.0.1:4010"
  ).replace(/\/$/, "");
  const target = `${origin}/media/${rel}`;

  const cookie = request.headers.get("cookie");
  const res = await fetch(target, {
    headers: cookie ? { Cookie: cookie } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse(null, { status: res.status === 404 ? 404 : res.status });
  }

  const buf = await res.arrayBuffer();
  const headers = new Headers();
  const contentType = res.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  const cacheControl = res.headers.get("Cache-Control");
  if (cacheControl) headers.set("Cache-Control", cacheControl);

  return new NextResponse(buf, { status: 200, headers });
}

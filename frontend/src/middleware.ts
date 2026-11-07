import { NextResponse, type NextRequest } from "next/server";

/**
 * 並走検証用 Basic 認証。
 * `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` が両方あるときだけ有効。
 * 本番公開後は両方とも未設定にする。
 */
function basicAuthOk(req: NextRequest): boolean {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return true;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    if (i < 0) return false;
    const u = decoded.slice(0, i);
    const p = decoded.slice(i + 1);
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 実 API / spike 接続時は残存モック認証 Cookie を消す
  if (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_USE_SPIKE_API === "1"
  ) {
    if (req.cookies.get("kr-mock-auth-mode")) {
      res.cookies.set("kr-mock-auth-mode", "", { path: "/", maxAge: 0 });
    }
  }

  if (!basicAuthOk(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="KimonoRecipe preview"',
        "Cache-Control": "no-store",
      },
    });
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * 静的アセット以外。画像・favicon もプレビュー保護下に置く。
     */
    "/((?!_next/static|_next/image).*)",
  ],
};

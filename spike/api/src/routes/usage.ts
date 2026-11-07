import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { newPublicId } from "../lib/ids.js";
import { SESSION_COOKIE, userFromToken } from "../lib/session.js";
import { ANON_COOKIE, recordPageView } from "../lib/usage.js";

/**
 * 利用計測（PV／UU）。広告の trackAdEvent と同型の差し替え口。
 * 本番でも同じ POST を集計基盤へ向ければよい。
 */
export const usageRoutes = new Hono();

const bodySchema = z.object({
  path: z.string().min(1).max(300),
});

usageRoutes.post("/pageview", async (c) => {
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid" }, 400);

  const token = getCookie(c, SESSION_COOKIE);
  const member = userFromToken(token);

  let viewerKind: "member" | "guest" = "guest";
  let viewerKey = "";

  if (member) {
    viewerKind = "member";
    viewerKey = member.id;
  } else {
    viewerKind = "guest";
    viewerKey = getCookie(c, ANON_COOKIE) ?? "";
    if (!viewerKey) {
      viewerKey = `g_${newPublicId(10)}`;
      setCookie(c, ANON_COOKIE, viewerKey, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 400 * 24 * 60 * 60,
      });
    }
  }

  recordPageView({
    path: parsed.data.path,
    viewerKind,
    viewerKey,
  });

  return c.json({ ok: true });
});

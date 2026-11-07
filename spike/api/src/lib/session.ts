import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "../db/client.js";
import { newSessionToken } from "./ids.js";

export const SESSION_COOKIE = "kr_spike_session";
const SESSION_DAYS = 30;

type UserRow = { id: string; email: string; name: string; is_admin: number };

function sessionExpiresAt(from = new Date()): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires.toISOString();
}

/** HTTPS または SPIKE_COOKIE_SECURE=1 のとき Secure を付ける */
function cookieSecure(c: Context): boolean {
  if (process.env.SPIKE_COOKIE_SECURE === "1") return true;
  const proto = c.req.header("x-forwarded-proto") ?? new URL(c.req.url).protocol;
  return proto === "https" || proto === "https:";
}

export function createSession(userId: string): string {
  const token = newSessionToken();
  db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
  ).run(token, userId, sessionExpiresAt());
  return token;
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

/** パスワード／メール変更後: 当該ユーザーの全セッションを落とす */
export function destroySessionsForUser(userId: string) {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export function userFromToken(token: string | undefined): UserRow | null {
  if (!token) return null;
  const now = new Date();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, COALESCE(u.is_admin, 0) AS is_admin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, now.toISOString()) as UserRow | undefined;
  if (!row) return null;
  // 30日スライド（OPS_SECURITY §5.2）
  db.prepare(`UPDATE sessions SET expires_at = ? WHERE token = ?`).run(
    sessionExpiresAt(now),
    token,
  );
  // 管理の「最終利用」用。本番でも同趣旨のタッチで足りる。
  db.prepare(`UPDATE users SET last_active_at = ? WHERE id = ?`).run(
    now.toISOString(),
    row.id,
  );
  return row;
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: cookieSecure(c),
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export function requireUser(c: Context): UserRow | Response {
  const token = getCookie(c, SESSION_COOKIE);
  const user = userFromToken(token);
  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return user;
}

/** 管理 API 用。spike でも is_admin=1 のみ通す（ログイン済みだけでは不可）。 */
export function requireAdmin(c: Context): UserRow | Response {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  if (!user.is_admin) {
    return c.json({ error: "forbidden" }, 403);
  }
  return user;
}

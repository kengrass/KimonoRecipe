import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "../db/client.js";
import { newSessionToken } from "./ids.js";

export const SESSION_COOKIE = "kr_spike_session";
const SESSION_DAYS = 30;

type UserRow = { id: string; email: string; name: string; is_admin: number };

export function createSession(userId: string): string {
  const token = newSessionToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
  ).run(token, userId, expires.toISOString());
  return token;
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function userFromToken(token: string | undefined): UserRow | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, COALESCE(u.is_admin, 0) AS is_admin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;
  if (!row) return null;
  // 管理の「最終利用」用。本番でも同趣旨のタッチで足りる。
  db.prepare(`UPDATE users SET last_active_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
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

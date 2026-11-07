import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { db } from "../db/client.js";
import { newPublicId } from "../lib/ids.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  LIMITS,
  emailSchema,
  plainLine,
} from "../lib/sanitize.js";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  destroySession,
  setSessionCookie,
} from "../lib/session.js";

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(LIMITS.password),
});

const registerSchema = z.object({
  name: plainLine(LIMITS.name, { min: 1 }),
  email: emailSchema,
  password: z.string().min(6).max(LIMITS.password),
});

authRoutes.post("/login", async (c) => {
  const body = loginSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "invalid_body" }, 400);

  const row = db
    .prepare(
      `SELECT id, email, name, password_hash,
              COALESCE(admin_status, 'active') AS admin_status
       FROM users WHERE email = ?`,
    )
    .get(body.data.email) as
    | {
        id: string;
        email: string;
        name: string;
        password_hash: string;
        admin_status: string;
      }
    | undefined;

  if (!row || !verifyPassword(body.data.password, row.password_hash)) {
    return c.json({ error: "invalid_credentials" }, 401);
  }
  if (row.admin_status === "suspended" || row.admin_status === "withdrawn") {
    return c.json({ error: "account_unavailable" }, 403);
  }

  const token = createSession(row.id);
  setSessionCookie(c, token);
  return c.json({
    user: { id: row.id, email: row.email, name: row.name },
  });
});

authRoutes.post("/register", async (c) => {
  const body = registerSchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "invalid_body", details: body.error.flatten() }, 400);
  }

  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get(body.data.email) as { id: string } | undefined;
  if (existing) return c.json({ error: "email_taken" }, 409);

  const id = newPublicId(6);
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, bio, avatar_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    body.data.email,
    body.data.name,
    hashPassword(body.data.password),
    "",
    null,
    new Date().toISOString(),
  );

  const token = createSession(id);
  setSessionCookie(c, token);
  return c.json(
    {
      user: { id, email: body.data.email, name: body.data.name },
    },
    201,
  );
});

authRoutes.post("/logout", (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  destroySession(token);
  clearSessionCookie(c);
  return c.body(null, 204);
});

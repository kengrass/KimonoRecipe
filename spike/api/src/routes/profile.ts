import { Hono } from "hono";
import { z } from "zod";
import {
  countFavorites,
  hasFavorite,
  hasFollow,
  listMeFavorites,
  listMeFollowingPosts,
  listMeFollowingUsers,
  toggleFavorite,
  toggleFollow,
  type MeKind,
} from "../lib/me-collections.js";
import { getCookie } from "hono/cookie";
import {
  LIMITS,
  emailSchema,
  optionalMediaUrlSchema,
  plainLine,
  plainMultiline,
  publicIdSchema,
  sanitizeQuery,
} from "../lib/sanitize.js";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  destroySession,
  destroySessionsForUser,
  requireUser,
  setSessionCookie,
} from "../lib/session.js";
import {
  confirmEmailChange,
  getAccountUser,
  requestEmailChange,
  toMeAccount,
  toPublicProfileExtras,
  updateAccountProfile,
  updatePasswordWithCurrent,
} from "../lib/account.js";
import {
  ProfileNameError,
  deleteUserAccount,
  getUserById,
  listPickupUsers,
  searchPublicUsers,
  toPublicUser,
  updateUserProfile,
} from "../lib/users.js";

export const meRoutes = new Hono();
export const publicUserRoutes = new Hono();

const linkSchema = z.object({
  title: plainLine(80),
  url: z.string().max(500),
});

const publicSizeSchema = z.object({
  label: plainLine(40, { min: 1 }),
  value: plainLine(40, { min: 1 }),
});

const patchSchema = z.object({
  name: plainLine(LIMITS.name, { min: 1 }).optional(),
  bio: plainMultiline(LIMITS.bio).optional(),
  avatar_url: optionalMediaUrlSchema,
  mail_opt_in: z.boolean().optional(),
  links: z.array(linkSchema).max(10).optional(),
  sns: z.record(z.string(), z.string().max(500)).optional(),
  public_size: z.array(publicSizeSchema).max(10).optional(),
});

const emailRequestSchema = z.object({
  email: emailSchema,
});

const emailConfirmSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4).max(12),
});

const passwordSchema = z.object({
  current_password: z.string().min(1).max(LIMITS.password),
  password: z.string().min(6).max(LIMITS.password),
});

function parseKind(raw: string | undefined): MeKind | null {
  if (raw === "coordinates" || raw === "items") return raw;
  return null;
}

function parsePage(c: { req: { query: (k: string) => string | undefined } }) {
  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, Number(c.req.query("per_page") ?? 12) || 12),
  );
  return { page, perPage };
}

meRoutes.get("/", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  const row = getAccountUser(user.id);
  if (!row) return c.json({ error: "unauthorized" }, 401);
  return c.json({ user: toMeAccount(row) });
});

meRoutes.patch("/", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const parsed = patchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: "empty_patch" }, 400);
  }

  try {
    const { mail_opt_in, links, sns, public_size, ...profile } = parsed.data;
    if (
      profile.name !== undefined ||
      profile.bio !== undefined ||
      profile.avatar_url !== undefined
    ) {
      updateUserProfile(user.id, profile);
    }
    if (
      mail_opt_in !== undefined ||
      links !== undefined ||
      sns !== undefined ||
      public_size !== undefined
    ) {
      updateAccountProfile(user.id, {
        mail_opt_in,
        links,
        sns,
        public_size,
      });
    }
    const row = getAccountUser(user.id);
    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json({ user: toMeAccount(row) });
  } catch (e) {
    if (e instanceof ProfileNameError) {
      return c.json({ error: e.code }, 409);
    }
    if (e instanceof Error && e.message === "name_required") {
      return c.json({ error: "name_required" }, 400);
    }
    throw e;
  }
});

/** POST /api/me/email/request — 確認コード発行（spikeは dev_code を返す） */
meRoutes.post("/email/request", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  const parsed = emailRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  try {
    const { email, code } = requestEmailChange(user.id, parsed.data.email);
    return c.json({ sent: true, email, dev_code: code });
  } catch (e) {
    if (e instanceof Error && e.message === "email_taken") {
      return c.json({ error: "email_taken" }, 409);
    }
    throw e;
  }
});

/** POST /api/me/email/confirm */
meRoutes.post("/email/confirm", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  const parsed = emailConfirmSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  try {
    confirmEmailChange(user.id, parsed.data.email, parsed.data.code);
    // 他端末のセッションを無効化し、この端末だけ新セッション
    destroySessionsForUser(user.id);
    const token = createSession(user.id);
    setSessionCookie(c, token);
    const row = getAccountUser(user.id);
    return c.json({ user: row ? toMeAccount(row) : null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg === "no_pending" ||
      msg === "email_mismatch" ||
      msg === "invalid_code" ||
      msg === "code_expired"
    ) {
      return c.json({ error: msg }, 400);
    }
    throw e;
  }
});

/** POST /api/me/password — 現行パスワード必須。他セッション無効化 */
meRoutes.post("/password", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  const parsed = passwordSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  try {
    updatePasswordWithCurrent(
      user.id,
      parsed.data.current_password,
      parsed.data.password,
    );
    destroySessionsForUser(user.id);
    const token = createSession(user.id);
    setSessionCookie(c, token);
    return c.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "password_too_short") {
      return c.json({ error: "password_too_short" }, 400);
    }
    if (e instanceof Error && e.message === "current_password_invalid") {
      return c.json({ error: "current_password_invalid" }, 400);
    }
    throw e;
  }
});
/** DELETE /api/me — 退会（本人アカウント削除） */
meRoutes.delete("/", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const ok = deleteUserAccount(user.id);
  if (!ok) return c.json({ error: "not_found" }, 404);

  const token = getCookie(c, SESSION_COOKIE);
  destroySession(token);
  clearSessionCookie(c);
  return c.body(null, 204);
});

/** GET /api/me/favorites?kind=&page=&per_page= */
meRoutes.get("/favorites", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const kind = parseKind(c.req.query("kind"));
  if (!kind) return c.json({ error: "kind_required" }, 400);

  const { page, perPage } = parsePage(c);
  return c.json(listMeFavorites(user.id, kind, page, perPage));
});

/** GET /api/me/favorites/check?kind=&id= */
meRoutes.get("/favorites/check", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const kind = parseKind(c.req.query("kind"));
  const idParsed = publicIdSchema.safeParse(c.req.query("id"));
  if (!kind || !idParsed.success) {
    return c.json({ error: "kind_and_id_required" }, 400);
  }

  return c.json({
    liked: hasFavorite(user.id, kind, idParsed.data),
    like_count: countFavorites(kind, idParsed.data),
  });
});

const favoriteToggleSchema = z.object({
  kind: z.enum(["coordinates", "items"]),
  id: publicIdSchema,
});

/** POST /api/me/favorites/toggle { kind, id } → { liked, like_count } */
meRoutes.post("/favorites/toggle", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const parsed = favoriteToggleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  const result = toggleFavorite(user.id, parsed.data.kind, parsed.data.id);
  if (!result) return c.json({ error: "not_found" }, 404);
  return c.json(result);
});

/** GET /api/me/following — フォロー中ユーザー一覧 */
meRoutes.get("/following", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;
  return c.json({ data: listMeFollowingUsers(user.id) });
});

/** GET /api/me/following/posts?kind=&page=&per_page= */
meRoutes.get("/following/posts", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const kind = parseKind(c.req.query("kind"));
  if (!kind) return c.json({ error: "kind_required" }, 400);

  const { page, perPage } = parsePage(c);
  return c.json(listMeFollowingPosts(user.id, kind, page, perPage));
});

/** GET /api/me/following/check?user_id= */
meRoutes.get("/following/check", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const userId = publicIdSchema.safeParse(c.req.query("user_id"));
  if (!userId.success) return c.json({ error: "user_id_required" }, 400);

  return c.json({ following: hasFollow(user.id, userId.data) });
});

const followToggleSchema = z.object({
  user_id: publicIdSchema,
});

/** POST /api/me/following/toggle { user_id } → { following } */
meRoutes.post("/following/toggle", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const parsed = followToggleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  const result = toggleFollow(user.id, parsed.data.user_id);
  if (!result) return c.json({ error: "not_found" }, 404);
  return c.json(result);
});

publicUserRoutes.get("/", (c) => {
  const q = sanitizeQuery(c.req.query("q")) ?? "";
  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, Number(c.req.query("per_page") ?? 12) || 12),
  );
  const { rows, total } = searchPublicUsers(q, page, perPage);
  return c.json({
    data: rows.map(toPublicUser),
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage) || 1),
    },
  });
});

/** GET /api/public/users/pickup — 自動 Pick up（公開コーデ・アイテム各10件以上） */
publicUserRoutes.get("/pickup", (c) => {
  const limit = Math.min(
    24,
    Math.max(1, Number(c.req.query("limit") ?? 12) || 12),
  );
  const rows = listPickupUsers(limit, 10);
  return c.json({
    data: rows.map((row) => ({
      ...toPublicUser(row),
      coordinate_count: row.coordinate_count,
      item_count: row.item_count,
    })),
  });
});

publicUserRoutes.get("/:id", (c) => {
  const row = getAccountUser(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({
    ...toPublicUser(row),
    ...toPublicProfileExtras(row),
  });
});

import { Hono } from "hono";
import { z } from "zod";
import {
  adminResetPassword,
  buildActivityBuckets,
  buildAdminKpis,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../lib/admin-users.js";
import { plainLine, plainMultiline } from "../lib/sanitize.js";
import { requireAdmin } from "../lib/session.js";
import { buildUsageInsight } from "../lib/usage.js";

/**
 * 管理画面用。spike でも is_admin=1 のみ（requireAdmin）。
 */
export const adminRoutes = new Hono();

const patchUserSchema = z.object({
  email: z.string().email().optional(),
  name: plainLine(80).optional(),
  status: z.enum(["active", "suspended", "withdrawn"]).optional(),
  adminNote: plainMultiline(2000).optional(),
  mailRejected: z.boolean().optional(),
  premiumId: z.union([plainLine(40), z.null()]).optional(),
});

adminRoutes.get("/users", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  return c.json({ data: listAdminUsers(), source: "live" as const });
});

adminRoutes.get("/users/:id", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const row = getAdminUser(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ data: row, source: "live" as const });
});

adminRoutes.patch("/users/:id", async (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const parsed = patchUserSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const row = updateAdminUser(c.req.param("id"), parsed.data);
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ data: row, source: "live" as const });
});

adminRoutes.post("/users/:id/password-reset", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const result = adminResetPassword(c.req.param("id"));
  if (!result) return c.json({ error: "not_found" }, 404);
  // spike のみ temporaryPassword を返す。本番はメール送信し本文に載せない想定。
  return c.json({
    ok: true,
    temporaryPassword: result.temporaryPassword,
    source: "live" as const,
  });
});

adminRoutes.get("/stats", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const users = listAdminUsers();
  return c.json({
    source: "live" as const,
    kpis: buildAdminKpis(),
    activity: buildActivityBuckets(users),
    usage: buildUsageInsight(),
  });
});

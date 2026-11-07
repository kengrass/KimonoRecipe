import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  createCoordinate,
  deleteCoordinate,
  getCoordinateById,
  listOwnerCoordinates,
  replaceCoordinateItems,
  toOwnerCoordinate,
  toPublicCoordinate,
  updateCoordinate,
} from "../lib/coordinates.js";
import { listPublicNeighbors } from "../lib/public-list.js";
import {
  buildOwnerFacets,
  buildOwnerVisibilityMap,
} from "../lib/owner-facets.js";
import {
  LIMITS,
  mediaUrlSchema,
  plainLine,
  plainMultiline,
  publicIdSchema,
  sanitizeQuery,
  tagsSchema,
} from "../lib/sanitize.js";
import { isContentSeason } from "../lib/seasons.js";
import {
  SESSION_COOKIE,
  requireUser,
  userFromToken,
} from "../lib/session.js";
import { refreshTempCollage } from "../lib/temp-collage.js";
import { incrementCoordinateViewCount } from "../lib/view-count.js";
import { getCookie } from "hono/cookie";

export const ownerCoordinateRoutes = new Hono();
export const publicCoordinateRoutes = new Hono();

const wornOnSchema = z
  .union([
    z.null(),
    z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .pipe(
        z.union([
          z.null(),
          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
        ]),
      ),
  ])
  .optional();

const createSchema = z.object({
  title: plainLine(LIMITS.title).optional().default(""),
  description: plainMultiline(LIMITS.memo).optional().default(""),
  gender: z.enum(["women", "men", "kids"]),
  visibility: z.enum(["public", "private"]),
  obi_knot: plainLine(LIMITS.obiKnot).optional().default(""),
  tags: tagsSchema.optional().default([]),
  image_urls: z.array(mediaUrlSchema).max(LIMITS.imageUrls).optional().default([]),
  private_note: plainMultiline(LIMITS.memo).optional().default(""),
  is_temp: z.boolean().optional().default(false),
  worn_on: wornOnSchema,
  item_ids: z.array(publicIdSchema).max(50).optional().default([]),
});

/** PATCH は未指定キーを触らない（default で空配列を入れない） */
const patchSchema = z.object({
  title: plainLine(LIMITS.title).optional(),
  description: plainMultiline(LIMITS.memo).optional(),
  gender: z.enum(["women", "men", "kids"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  obi_knot: plainLine(LIMITS.obiKnot).optional(),
  tags: tagsSchema.optional(),
  image_urls: z.array(mediaUrlSchema).max(LIMITS.imageUrls).optional(),
  private_note: plainMultiline(LIMITS.memo).optional(),
  is_temp: z.boolean().optional(),
  worn_on: wornOnSchema,
  item_ids: z.array(publicIdSchema).max(50).optional(),
});

const attachSchema = z.object({
  item_ids: z.array(publicIdSchema).max(50),
});

function ownerName(userId: string): string {
  const row = db
    .prepare(`SELECT name FROM users WHERE id = ?`)
    .get(userId) as { name: string } | undefined;
  return row?.name ?? "";
}

ownerCoordinateRoutes.get("/", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, Number(c.req.query("per_page") ?? 12) || 12),
  );
  const tempOnly = c.req.query("temp") === "1";
  const seasonRaw = c.req.query("season")?.trim();
  const season =
    seasonRaw && isContentSeason(seasonRaw) ? seasonRaw : undefined;
  const gender = c.req.query("g")?.trim() || undefined;
  const obi = sanitizeQuery(c.req.query("obi"));
  const q = sanitizeQuery(c.req.query("q"));
  const sort = c.req.query("sort")?.trim() || undefined;
  const statusRaw = c.req.query("status")?.trim();
  const visibility =
    statusRaw === "public" || statusRaw === "private" ? statusRaw : undefined;

  const { rows, total } = listOwnerCoordinates(user.id, page, perPage, {
    tempOnly,
    q,
    gender,
    season: tempOnly ? undefined : season,
    obi,
    visibility,
    sort,
  });
  const name = ownerName(user.id);
  const includeFacets = c.req.query("include_facets") === "1";
  return c.json({
    data: rows.map((row) => toOwnerCoordinate(row, name)),
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
    ...(includeFacets
      ? {
          facets: buildOwnerFacets(user.id, { tempOnly }),
          visibility_by_id: buildOwnerVisibilityMap(user.id, "coordinates"),
        }
      : {}),
  });
});

ownerCoordinateRoutes.post("/", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  try {
    let row = createCoordinate(user.id, parsed.data);
    if (row.is_temp) {
      row = (await refreshTempCollage(row.id)) ?? row;
    }
    return c.json(toOwnerCoordinate(row, user.name), 201);
  } catch (e) {
    if (e instanceof Error && e.message === "image_required") {
      return c.json({ error: "image_required" }, 400);
    }
    if (e instanceof Error && e.message === "invalid_item") {
      return c.json({ error: "invalid_item" }, 400);
    }
    throw e;
  }
});

ownerCoordinateRoutes.get("/:id", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getCoordinateById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);
  return c.json(toOwnerCoordinate(row, user.name));
});

ownerCoordinateRoutes.patch("/:id", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getCoordinateById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);

  const parsed = patchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  try {
    let next = updateCoordinate(row, parsed.data);
    // 仮コーデは紐付け画像から毎回合成（クライアントの古いサムネ上書きを防ぐ）
    if (next.is_temp) {
      next = (await refreshTempCollage(next.id)) ?? next;
    }
    return c.json(toOwnerCoordinate(next, user.name));
  } catch (e) {
    if (e instanceof Error && e.message === "image_required") {
      return c.json({ error: "image_required" }, 400);
    }
    if (e instanceof Error && e.message === "invalid_item") {
      return c.json({ error: "invalid_item" }, 400);
    }
    throw e;
  }
});

ownerCoordinateRoutes.delete("/:id", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getCoordinateById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);
  deleteCoordinate(row.id);
  return c.body(null, 204);
});

/** 紐付け確定（順序付き item_ids で全置換） */
ownerCoordinateRoutes.put("/:id/items", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getCoordinateById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);

  const parsed = attachSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }

  try {
    replaceCoordinateItems(row.id, user.id, parsed.data.item_ids);
    let next = getCoordinateById(row.id)!;
    if (next.is_temp) {
      next = (await refreshTempCollage(next.id)) ?? next;
    }
    return c.json(toOwnerCoordinate(next, user.name));
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_item") {
      return c.json({ error: "invalid_item" }, 400);
    }
    throw e;
  }
});

publicCoordinateRoutes.get("/:id/neighbors", (c) => {
  const body = listPublicNeighbors("coordinates", c.req.param("id"));
  if (!body) return c.json({ error: "not_found" }, 404);
  return c.json(body);
});

publicCoordinateRoutes.get("/:id", (c) => {
  const row = getCoordinateById(c.req.param("id"));
  // 仮コーデは公開詳細にも出さない（本人は owner 詳細へ）
  if (!row || row.visibility !== "public" || row.is_temp) {
    return c.json({ error: "not_found" }, 404);
  }
  const viewer = userFromToken(getCookie(c, SESSION_COOKIE));
  incrementCoordinateViewCount(row.id, viewer?.id);
  return c.json(
    toPublicCoordinate(row, ownerName(row.owner_id), { includeRelated: true }),
  );
});

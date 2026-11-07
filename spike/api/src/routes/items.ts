import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { favoriteCount } from "../lib/favorite-stats.js";
import { listCoordinatesUsingItem } from "../lib/item-usage.js";
import {
  createItem,
  deleteItem,
  getItemById,
  listOwnerItems,
  listRelatedItems,
  toOwnerItem,
  toPublicItem,
  updateItem,
} from "../lib/items.js";
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
  sanitizeQuery,
  tagsSchema,
} from "../lib/sanitize.js";
import {
  SESSION_COOKIE,
  requireUser,
  userFromToken,
} from "../lib/session.js";
import { incrementItemViewCount } from "../lib/view-count.js";
import { getCookie } from "hono/cookie";

export const ownerItemRoutes = new Hono();
export const publicItemRoutes = new Hono();

const createSchema = z.object({
  title: plainLine(LIMITS.title).optional().default(""),
  description: plainMultiline(LIMITS.memo).optional().default(""),
  category: plainLine(LIMITS.category, { min: 1 }),
  gender: z.enum(["women", "men", "kids"]),
  visibility: z.enum(["public", "private"]),
  color_tone: z.union([plainLine(LIMITS.colorTone), z.null()]).optional(),
  tags: tagsSchema.optional().default([]),
  // 相対 /media/... も可（spike 内）
  image_urls: z.array(mediaUrlSchema).min(1).max(LIMITS.imageUrls),
  private_note: plainMultiline(LIMITS.memo).optional().default(""),
  favorite_rank: z.number().int().min(1).max(5).nullable().optional(),
  declutter_candidate: z.boolean().optional().default(false),
});

function ownerName(userId: string): string {
  const row = db
    .prepare(`SELECT name FROM users WHERE id = ?`)
    .get(userId) as { name: string } | undefined;
  return row?.name ?? "";
}

ownerItemRoutes.get("/", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, Number(c.req.query("per_page") ?? 12) || 12),
  );
  const q = sanitizeQuery(c.req.query("q"));
  const gender = c.req.query("g")?.trim() || undefined;
  const category = sanitizeQuery(c.req.query("cat"));
  const declutterOnly = c.req.query("declutter") === "1";
  const sort = c.req.query("sort")?.trim() || undefined;
  const statusRaw = c.req.query("status")?.trim();
  const visibility =
    statusRaw === "public" || statusRaw === "private" ? statusRaw : undefined;
  const seasonRaw = c.req.query("season")?.trim();
  const season =
    seasonRaw === "春" ||
    seasonRaw === "夏" ||
    seasonRaw === "秋" ||
    seasonRaw === "冬"
      ? seasonRaw
      : undefined;

  const { rows, total } = listOwnerItems(user.id, page, perPage, {
    q,
    gender,
    category,
    season,
    visibility,
    declutterOnly,
    sort,
  });
  const name = ownerName(user.id);
  const includeFacets = c.req.query("include_facets") === "1";
  return c.json({
    data: rows.map((row) => toOwnerItem(row, name)),
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
    ...(includeFacets
      ? {
          facets: buildOwnerFacets(user.id),
          visibility_by_id: buildOwnerVisibilityMap(user.id, "items"),
        }
      : {}),
  });
});

ownerItemRoutes.post("/", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  try {
    const row = createItem(user.id, parsed.data);
    return c.json(toOwnerItem(row, user.name), 201);
  } catch (e) {
    if (e instanceof Error && e.message === "image_required") {
      return c.json({ error: "image_required" }, 400);
    }
    throw e;
  }
});

ownerItemRoutes.get("/:id", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getItemById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);
  return c.json(toOwnerItem(row, user.name));
});

const patchSchema = z.object({
  title: plainLine(LIMITS.title).optional(),
  description: plainMultiline(LIMITS.memo).optional(),
  category: plainLine(LIMITS.category, { min: 1 }).optional(),
  gender: z.enum(["women", "men", "kids"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  color_tone: z.union([plainLine(LIMITS.colorTone), z.null()]).optional(),
  tags: tagsSchema.optional(),
  image_urls: z.array(mediaUrlSchema).min(1).max(LIMITS.imageUrls).optional(),
  private_note: plainMultiline(LIMITS.memo).optional(),
  favorite_rank: z.number().int().min(1).max(5).nullable().optional(),
  declutter_candidate: z.boolean().optional(),
});

ownerItemRoutes.patch("/:id", async (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getItemById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);

  const parsed = patchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400);
  }

  try {
    const next = updateItem(row, parsed.data);
    return c.json(toOwnerItem(next, user.name));
  } catch (e) {
    if (e instanceof Error && e.message === "image_required") {
      return c.json({ error: "image_required" }, 400);
    }
    throw e;
  }
});

ownerItemRoutes.delete("/:id", (c) => {
  const user = requireUser(c);
  if (user instanceof Response) return user;

  const row = getItemById(c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);
  if (row.owner_id !== user.id) return c.json({ error: "forbidden" }, 403);
  deleteItem(row.id);
  return c.body(null, 204);
});

publicItemRoutes.get("/:id/neighbors", (c) => {
  const body = listPublicNeighbors("items", c.req.param("id"));
  if (!body) return c.json({ error: "not_found" }, 404);
  return c.json(body);
});

publicItemRoutes.get("/:id", (c) => {
  const row = getItemById(c.req.param("id"));
  if (!row || row.visibility !== "public") {
    return c.json({ error: "not_found" }, 404);
  }
  const viewer = userFromToken(getCookie(c, SESSION_COOKIE));
  incrementItemViewCount(row.id, viewer?.id);
  const name = ownerName(row.owner_id);
  // 公開詳細でもアバターは載せてよい（非公開フィールドは載せない）
  const owner = db
    .prepare(`SELECT avatar_url FROM users WHERE id = ?`)
    .get(row.owner_id) as { avatar_url: string | null } | undefined;
  return c.json({
    ...toPublicItem(row),
    user: {
      id: row.owner_id,
      name,
      profile_url: `/m/${row.owner_id}`,
      avatar_url: owner?.avatar_url ?? null,
    },
    like_count: favoriteCount("items", row.id),
    used_in_coordinates: listCoordinatesUsingItem(row.id, { publicOnly: true }),
    related_items: listRelatedItems(row.owner_id, row.category, row.id),
    og: {
      title: row.title || `${name}のアイテム`,
      description: row.description.slice(0, 120),
      image_url: toPublicItem(row).image_url,
    },
  });
});

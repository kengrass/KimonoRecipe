import { Hono } from "hono";
import { buildOwnerFacets } from "../lib/owner-facets.js";
import {
  listPublicCoordinates,
  listPublicItems,
} from "../lib/public-list.js";
import { publicIdSchema, sanitizeQuery } from "../lib/sanitize.js";
import { isContentSeason } from "../lib/seasons.js";

export const publicItemListRoutes = new Hono();
export const publicCoordinateListRoutes = new Hono();

function parseListQuery(c: {
  req: { query: (k: string) => string | undefined };
}) {
  const seasonRaw = c.req.query("season")?.trim();
  const season =
    seasonRaw && isContentSeason(seasonRaw) ? seasonRaw : undefined;
  const gender = c.req.query("g")?.trim() || undefined;
  const userParsed = publicIdSchema.safeParse(c.req.query("user"));

  return {
    q: sanitizeQuery(c.req.query("q")),
    page: Math.max(1, Number(c.req.query("page") ?? 1) || 1),
    perPage: Math.min(
      50,
      Math.max(1, Number(c.req.query("per_page") ?? 12) || 12),
    ),
    userId: userParsed.success ? userParsed.data : undefined,
    gender: gender && gender !== "all" ? gender : undefined,
    season,
    category: sanitizeQuery(c.req.query("cat")),
    obi: sanitizeQuery(c.req.query("obi")),
    tag: sanitizeQuery(c.req.query("tag")),
    sort: c.req.query("sort")?.trim() || undefined,
  };
}

publicItemListRoutes.get("/", (c) => {
  const query = parseListQuery(c);
  const body = listPublicItems(query);
  const includeFacets = c.req.query("include_facets") === "1";
  if (includeFacets && query.userId) {
    return c.json({
      ...body,
      facets: buildOwnerFacets(query.userId, { publicOnly: true }),
    });
  }
  return c.json(body);
});

publicCoordinateListRoutes.get("/", (c) => {
  const query = parseListQuery(c);
  const body = listPublicCoordinates(query);
  const includeFacets = c.req.query("include_facets") === "1";
  if (includeFacets && query.userId) {
    return c.json({
      ...body,
      facets: buildOwnerFacets(query.userId, {
        publicOnly: true,
        tempOnly: false,
      }),
    });
  }
  return c.json(body);
});

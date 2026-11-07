import { Hono } from "hono";
import { z } from "zod";
import {
  listAds,
  listLogoSponsors,
  listVisibleLogoSponsors,
  pickAd,
  recordAdEvent,
  replaceAds,
  replaceLogoSponsors,
  type AdDto,
  type LogoSponsorDto,
} from "../lib/ads.js";
import { requireAdmin } from "../lib/session.js";

export const adminAdRoutes = new Hono();
export const publicAdRoutes = new Hono();

const adSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().max(200),
  advertiser: z.string().max(200),
  placements: z.array(
    z.enum(["home_top", "coord_detail", "item_detail"]),
  ),
  href: z.string().max(2000),
  imageUrl: z.string().max(2000),
  title: z.string().max(200),
  enabled: z.boolean(),
  startOn: z.string().max(32),
  endOn: z.string().max(32),
  impressions: z.number().int().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
});

const logoSchema = z.object({
  id: z.string().min(1).max(40),
  sponsorName: z.string().max(200),
  logoUrl: z.string().max(2000),
  href: z.string().max(2000),
  packageNote: z.string().max(500),
  enabled: z.boolean(),
  startOn: z.string().max(32),
  endOn: z.string().max(32),
  sortOrder: z.number().int(),
});

adminAdRoutes.get("/ads", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  return c.json({ data: listAds(), source: "live" as const });
});

adminAdRoutes.put("/ads", async (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const parsed = z.array(adSchema).safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const data = replaceAds(parsed.data as AdDto[]);
  return c.json({ data, source: "live" as const });
});

adminAdRoutes.get("/logo-sponsors", (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  return c.json({ data: listLogoSponsors(), source: "live" as const });
});

adminAdRoutes.put("/logo-sponsors", async (c) => {
  const user = requireAdmin(c);
  if (user instanceof Response) return user;
  const parsed = z.array(logoSchema).safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "invalid_body" }, 400);
  }
  const data = replaceLogoSponsors(parsed.data as LogoSponsorDto[]);
  return c.json({ data, source: "live" as const });
});

publicAdRoutes.get("/pick", (c) => {
  const placement = c.req.query("placement") ?? "";
  const ad = pickAd(placement);
  return c.json({ data: ad });
});

publicAdRoutes.get("/logo-sponsors", (c) => {
  return c.json({ data: listVisibleLogoSponsors() });
});

publicAdRoutes.post("/events", async (c) => {
  const body = z
    .object({
      adId: z.string().min(1),
      type: z.enum(["impression", "click"]),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "invalid_body" }, 400);
  recordAdEvent(body.data.adId, body.data.type);
  return c.json({ ok: true });
});

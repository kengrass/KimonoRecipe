import { db } from "../db/client.js";
import { newPublicId } from "./ids.js";

export type AdPlacement = "home_top" | "coord_detail" | "item_detail";

export type AdDto = {
  id: string;
  name: string;
  advertiser: string;
  placements: AdPlacement[];
  href: string;
  imageUrl: string;
  title: string;
  enabled: boolean;
  startOn: string;
  endOn: string;
  impressions: number;
  clicks: number;
};

export type LogoSponsorDto = {
  id: string;
  sponsorName: string;
  logoUrl: string;
  href: string;
  packageNote: string;
  enabled: boolean;
  startOn: string;
  endOn: string;
  sortOrder: number;
};

type AdRow = {
  id: string;
  name: string;
  advertiser: string;
  placements_json: string;
  href: string;
  image_url: string;
  title: string;
  enabled: number;
  start_on: string;
  end_on: string;
  impressions: number;
  clicks: number;
};

type LogoRow = {
  id: string;
  sponsor_name: string;
  logo_url: string;
  href: string;
  package_note: string;
  enabled: number;
  start_on: string;
  end_on: string;
  sort_order: number;
};

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parsePlacements(raw: string): AdPlacement[] {
  try {
    const v = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is AdPlacement =>
        x === "home_top" || x === "coord_detail" || x === "item_detail",
    );
  } catch {
    return [];
  }
}

function withinSchedule(startOn: string, endOn: string, today = todayYmd()) {
  if (startOn && startOn > today) return false;
  if (endOn && endOn < today) return false;
  return true;
}

function toAdDto(row: AdRow): AdDto {
  return {
    id: row.id,
    name: row.name,
    advertiser: row.advertiser,
    placements: parsePlacements(row.placements_json),
    href: row.href,
    imageUrl: row.image_url,
    title: row.title,
    enabled: row.enabled === 1,
    startOn: row.start_on || "",
    endOn: row.end_on || "",
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
  };
}

function toLogoDto(row: LogoRow): LogoSponsorDto {
  return {
    id: row.id,
    sponsorName: row.sponsor_name,
    logoUrl: row.logo_url,
    href: row.href,
    packageNote: row.package_note,
    enabled: row.enabled === 1,
    startOn: row.start_on || "",
    endOn: row.end_on || "",
    sortOrder: row.sort_order || 0,
  };
}

export function listAds(): AdDto[] {
  const rows = db
    .prepare(`SELECT * FROM ads ORDER BY updated_at DESC`)
    .all() as AdRow[];
  return rows.map(toAdDto);
}

export function replaceAds(rows: AdDto[]): AdDto[] {
  const now = new Date().toISOString();
  const tx = db.transaction((items: AdDto[]) => {
    db.prepare(`DELETE FROM ads`).run();
    const insert = db.prepare(
      `INSERT INTO ads (
        id, name, advertiser, placements_json, href, image_url, title,
        enabled, start_on, end_on, impressions, clicks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const ad of items) {
      insert.run(
        ad.id || newPublicId(10),
        ad.name ?? "",
        ad.advertiser ?? "",
        JSON.stringify(ad.placements ?? []),
        ad.href ?? "",
        ad.imageUrl ?? "",
        ad.title ?? "",
        ad.enabled ? 1 : 0,
        ad.startOn ?? "",
        ad.endOn ?? "",
        ad.impressions ?? 0,
        ad.clicks ?? 0,
        now,
        now,
      );
    }
  });
  tx(rows);
  return listAds();
}

export function pickAd(placement: string): AdDto | null {
  const candidates = listAds().filter(
    (ad) =>
      ad.enabled &&
      ad.imageUrl &&
      ad.placements.includes(placement as AdPlacement) &&
      withinSchedule(ad.startOn, ad.endOn),
  );
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function recordAdEvent(adId: string, type: "impression" | "click") {
  if (type === "impression") {
    db.prepare(
      `UPDATE ads SET impressions = impressions + 1, updated_at = ? WHERE id = ?`,
    ).run(new Date().toISOString(), adId);
  } else {
    db.prepare(
      `UPDATE ads SET clicks = clicks + 1, updated_at = ? WHERE id = ?`,
    ).run(new Date().toISOString(), adId);
  }
}

export function listLogoSponsors(): LogoSponsorDto[] {
  const rows = db
    .prepare(`SELECT * FROM logo_sponsors ORDER BY sort_order ASC, id ASC`)
    .all() as LogoRow[];
  return rows.map(toLogoDto);
}

export function replaceLogoSponsors(rows: LogoSponsorDto[]): LogoSponsorDto[] {
  const now = new Date().toISOString();
  const tx = db.transaction((items: LogoSponsorDto[]) => {
    db.prepare(`DELETE FROM logo_sponsors`).run();
    const insert = db.prepare(
      `INSERT INTO logo_sponsors (
        id, sponsor_name, logo_url, href, package_note, enabled,
        start_on, end_on, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of items) {
      insert.run(
        row.id || newPublicId(10),
        row.sponsorName ?? "",
        row.logoUrl ?? "",
        row.href ?? "",
        row.packageNote ?? "",
        row.enabled ? 1 : 0,
        row.startOn ?? "",
        row.endOn ?? "",
        row.sortOrder ?? 0,
        now,
        now,
      );
    }
  });
  tx(rows);
  return listLogoSponsors();
}

export function listVisibleLogoSponsors(): LogoSponsorDto[] {
  return listLogoSponsors()
    .filter(
      (r) => r.enabled && withinSchedule(r.startOn, r.endOn),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

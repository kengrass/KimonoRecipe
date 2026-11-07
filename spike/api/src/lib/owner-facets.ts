import { db } from "../db/client.js";
import { SYSTEM_ITEM_CATEGORIES } from "./item-categories.js";
import { CONTENT_SEASONS } from "./seasons.js";

function categoryOptionsFromCounts(
  counts: Map<string, number>,
): Array<{ name: string; count: number }> {
  const options = SYSTEM_ITEM_CATEGORIES.map((name) => ({
    name,
    count: counts.get(name) ?? 0,
  }));
  for (const [name, count] of counts) {
    if (!(SYSTEM_ITEM_CATEGORIES as readonly string[]).includes(name)) {
      options.push({ name, count });
    }
  }
  return options;
}

/** owner / 公開プロフィール一覧用 facets */
export function buildOwnerFacets(
  ownerId: string,
  opts?: { tempOnly?: boolean; publicOnly?: boolean },
) {
  const tempOnly = Boolean(opts?.tempOnly);
  const publicOnly = Boolean(opts?.publicOnly);

  const coordParts = [`owner_id = ?`];
  if (tempOnly) coordParts.push(`is_temp = 1`);
  else coordParts.push(`is_temp = 0`);
  if (publicOnly) coordParts.push(`visibility = 'public'`);
  const coordWhere = coordParts.join(" AND ");

  const itemParts = [`owner_id = ?`];
  if (publicOnly) itemParts.push(`visibility = 'public'`);
  const itemWhere = itemParts.join(" AND ");

  const coordinateCount = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM coordinates WHERE ${coordWhere}`)
      .get(ownerId) as { c: number }
  ).c;
  // ヘッダの「コーデ」件数は本コーデ基準（公開のみのときは公開本コーデ）
  const mainCoordParts = [`owner_id = ?`, `is_temp = 0`];
  if (publicOnly) mainCoordParts.push(`visibility = 'public'`);
  const mainCoordinateCount = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM coordinates WHERE ${mainCoordParts.join(" AND ")}`,
      )
      .get(ownerId) as { c: number }
  ).c;
  const itemCount = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM items WHERE ${itemWhere}`)
      .get(ownerId) as { c: number }
  ).c;
  const declutterCount = publicOnly
    ? 0
    : (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM items WHERE owner_id = ? AND declutter_candidate = 1`,
          )
          .get(ownerId) as { c: number }
      ).c;

  const catRows = db
    .prepare(
      `SELECT category AS name, COUNT(*) AS count
       FROM items WHERE ${itemWhere}
       GROUP BY category`,
    )
    .all(ownerId) as Array<{ name: string; count: number }>;
  const catCounts = new Map(catRows.map((r) => [r.name, r.count]));

  const declutterCounts = new Map<string, number>();
  if (!publicOnly) {
    const declutterCatRows = db
      .prepare(
        `SELECT category AS name, COUNT(*) AS count
         FROM items WHERE owner_id = ? AND declutter_candidate = 1
         GROUP BY category`,
      )
      .all(ownerId) as Array<{ name: string; count: number }>;
    for (const r of declutterCatRows) declutterCounts.set(r.name, r.count);
  }

  const seasonCounts: Record<string, number> = {
    all: coordinateCount,
    春: 0,
    夏: 0,
    秋: 0,
    冬: 0,
  };
  const tagRows = db
    .prepare(`SELECT tags_json FROM coordinates WHERE ${coordWhere}`)
    .all(ownerId) as Array<{ tags_json: string }>;
  for (const row of tagRows) {
    let tags: string[] = [];
    try {
      const v = JSON.parse(row.tags_json) as unknown;
      tags = Array.isArray(v) ? v.map(String) : [];
    } catch {
      tags = [];
    }
    for (const season of CONTENT_SEASONS) {
      if (tags.includes(season)) seasonCounts[season] += 1;
    }
  }

  return {
    coordinate_count: mainCoordinateCount,
    item_count: itemCount,
    declutter_count: declutterCount,
    season_counts: seasonCounts,
    my_folders: [],
    item_categories: categoryOptionsFromCounts(catCounts),
    item_my_categories: [],
    item_declutter_categories: publicOnly
      ? []
      : categoryOptionsFromCounts(declutterCounts),
  };
}

export function buildOwnerVisibilityMap(
  ownerId: string,
  kind: "coordinates" | "items",
): Record<string, "public" | "private"> {
  const table = kind === "coordinates" ? "coordinates" : "items";
  const rows = db
    .prepare(`SELECT id, visibility FROM ${table} WHERE owner_id = ?`)
    .all(ownerId) as Array<{ id: string; visibility: string }>;
  const out: Record<string, "public" | "private"> = {};
  for (const row of rows) {
    if (row.visibility === "public" || row.visibility === "private") {
      out[row.id] = row.visibility;
    }
  }
  return out;
}

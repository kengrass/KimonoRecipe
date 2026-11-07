import { db } from "../db/client.js";
import {
  toPublicCoordinate,
  type CoordinateRow,
} from "./coordinates.js";

/**
 * このアイテムを使っているコーデ一覧（used_in）。
 * publicOnly: 公開かつ本コーデのみ。ownerId 指定時はその人の仮含むすべて。
 */
export function listCoordinatesUsingItem(
  itemId: string,
  opts: { publicOnly?: boolean; ownerId?: string } = {},
) {
  const where = [`ci.item_id = ?`];
  const params: unknown[] = [itemId];
  if (opts.ownerId) {
    where.push(`c.owner_id = ?`);
    params.push(opts.ownerId);
  }
  if (opts.publicOnly) {
    where.push(`c.visibility = 'public'`);
    where.push(`c.is_temp = 0`);
  }
  const rows = db
    .prepare(
      `SELECT c.* FROM coordinate_items ci
       JOIN coordinates c ON c.id = ci.coordinate_id
       WHERE ${where.join(" AND ")}
       ORDER BY c.created_at DESC`,
    )
    .all(...params) as CoordinateRow[];

  return rows.map((row) => {
    const name =
      (
        db
          .prepare(`SELECT name FROM users WHERE id = ?`)
          .get(row.owner_id) as { name: string } | undefined
      )?.name ?? "";
    const full = toPublicCoordinate(row, name);
    return {
      id: full.id,
      title: full.title,
      image_url: full.image_url,
      detail_url: full.detail_url,
      gender: full.gender,
      tags: full.tags,
      seasons: full.seasons,
      user: full.user,
      posted_at: full.posted_at,
      like_count: full.like_count,
      obi_knot: full.obi_knot,
      is_temp: Boolean(row.is_temp),
    };
  });
}

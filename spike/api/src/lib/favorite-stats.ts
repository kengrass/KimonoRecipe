import { db } from "../db/client.js";

export function favoriteCount(
  kind: "items" | "coordinates",
  targetId: string,
): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM favorites WHERE kind = ? AND target_id = ?`,
      )
      .get(kind, targetId) as { c: number }
  ).c;
}

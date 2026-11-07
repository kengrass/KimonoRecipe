import { db } from "../db/client.js";

/**
 * 公開詳細の閲覧を加算。
 * 所有者本人の閲覧は数えない（自分で開いても 0 のままにしない／インフレ防止）。
 */
export function incrementItemViewCount(
  id: string,
  viewerId: string | null | undefined,
) {
  if (viewerId) {
    db.prepare(
      `UPDATE items SET view_count = view_count + 1
       WHERE id = ? AND owner_id != ?`,
    ).run(id, viewerId);
    return;
  }
  db.prepare(
    `UPDATE items SET view_count = view_count + 1 WHERE id = ?`,
  ).run(id);
}

export function incrementCoordinateViewCount(
  id: string,
  viewerId: string | null | undefined,
) {
  if (viewerId) {
    db.prepare(
      `UPDATE coordinates SET view_count = view_count + 1
       WHERE id = ? AND owner_id != ? AND is_temp = 0`,
    ).run(id, viewerId);
    return;
  }
  db.prepare(
    `UPDATE coordinates SET view_count = view_count + 1
     WHERE id = ? AND is_temp = 0`,
  ).run(id);
}

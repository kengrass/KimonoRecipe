import { db } from "../db/client.js";
import { likeContains } from "./sanitize.js";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
};

export function getUserById(id: string): UserRow | null {
  return (
    (db
      .prepare(
        `SELECT id, email, name, bio, avatar_url, created_at FROM users WHERE id = ?`,
      )
      .get(id) as UserRow | undefined) ?? null
  );
}

export function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    profile_url: `/m/${row.id}`,
    avatar_url: row.avatar_url,
    bio: row.bio ?? "",
  };
}

export function toMeUser(row: UserRow) {
  return {
    ...toPublicUser(row),
    email: row.email,
  };
}

const NAME_COOLDOWN_DAYS = 180;

export type ProfileNameErrorCode = "name_taken" | "name_recently_used";

export class ProfileNameError extends Error {
  readonly code: ProfileNameErrorCode;
  constructor(code: ProfileNameErrorCode) {
    super(code);
    this.code = code;
  }
}

function isNameTakenByOther(userId: string, name: string): boolean {
  const row = db
    .prepare(
      `SELECT id FROM users
       WHERE name = ? COLLATE NOCASE AND id != ?
       LIMIT 1`,
    )
    .get(name, userId) as { id: string } | undefined;
  return Boolean(row);
}

/** 本人が直近 NAME_COOLDOWN_DAYS 日以内に使っていた表示名か */
function isNameRecentlyUsedBySelf(userId: string, name: string): boolean {
  const since = new Date();
  since.setDate(since.getDate() - NAME_COOLDOWN_DAYS);
  const row = db
    .prepare(
      `SELECT 1 AS ok FROM user_name_history
       WHERE user_id = ? AND name = ? COLLATE NOCASE AND changed_at >= ?
       LIMIT 1`,
    )
    .get(userId, name, since.toISOString()) as { ok: number } | undefined;
  return Boolean(row);
}

export function updateUserProfile(
  id: string,
  patch: { name?: string; bio?: string; avatar_url?: string | null },
): UserRow {
  const row = getUserById(id);
  if (!row) throw new Error("not_found");

  let nextName = row.name;
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new Error("name_required");
    if (trimmed.localeCompare(row.name, undefined, { sensitivity: "accent" }) !== 0) {
      if (isNameTakenByOther(id, trimmed)) {
        throw new ProfileNameError("name_taken");
      }
      if (isNameRecentlyUsedBySelf(id, trimmed)) {
        throw new ProfileNameError("name_recently_used");
      }
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO user_name_history (user_id, name, changed_at)
         VALUES (?, ?, ?)`,
      ).run(id, row.name, now);
      nextName = trimmed;
    }
  }

  db.prepare(
    `UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?`,
  ).run(
    nextName,
    patch.bio !== undefined ? patch.bio : row.bio,
    patch.avatar_url !== undefined ? patch.avatar_url : row.avatar_url,
    id,
  );
  return getUserById(id)!;
}

/**
 * 退会：本人の投稿・セッション等は FK CASCADE。
 * 他人の favorites が指す target は FK が無いので先に掃除。
 */
export function deleteUserAccount(userId: string): boolean {
  const row = getUserById(userId);
  if (!row) return false;

  const itemIds = (
    db.prepare(`SELECT id FROM items WHERE owner_id = ?`).all(userId) as Array<{
      id: string;
    }>
  ).map((r) => r.id);
  const coordIds = (
    db
      .prepare(`SELECT id FROM coordinates WHERE owner_id = ?`)
      .all(userId) as Array<{ id: string }>
  ).map((r) => r.id);

  const delFav = db.prepare(
    `DELETE FROM favorites WHERE kind = ? AND target_id = ?`,
  );
  for (const id of itemIds) delFav.run("items", id);
  for (const id of coordIds) delFav.run("coordinates", id);

  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return true;
}

export function searchPublicUsers(q: string, page: number, perPage: number) {
  const needle = q.trim();
  if (!needle) {
    return { rows: [] as UserRow[], total: 0 };
  }
  const like = likeContains(needle);
  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM users
         WHERE name LIKE ? ESCAPE '\\' OR bio LIKE ? ESCAPE '\\'`,
      )
      .get(like, like) as { c: number }
  ).c;
  const offset = (page - 1) * perPage;
  const rows = db
    .prepare(
      `SELECT id, email, name, bio, avatar_url, created_at FROM users
       WHERE name LIKE ? ESCAPE '\\' OR bio LIKE ? ESCAPE '\\'
       ORDER BY name COLLATE NOCASE ASC
       LIMIT ? OFFSET ?`,
    )
    .all(like, like, perPage, offset) as UserRow[];
  return { rows, total };
}

export type PickupUserRow = UserRow & {
  coordinate_count: number;
  item_count: number;
};

/** Pick up: 公開コーデ・公開アイテムがそれぞれ min 件以上。足りなければ件数上位で補完 */
export function listPickupUsers(
  limit = 12,
  minPublicEach = 10,
): PickupUserRow[] {
  const scored = `
    SELECT u.id, u.email, u.name, u.bio, u.avatar_url, u.created_at,
      (SELECT COUNT(*) FROM coordinates c
        WHERE c.owner_id = u.id AND c.visibility = 'public' AND c.is_temp = 0
      ) AS coordinate_count,
      (SELECT COUNT(*) FROM items i
        WHERE i.owner_id = u.id AND i.visibility = 'public'
      ) AS item_count
    FROM users u
  `;

  const qualified = db
    .prepare(
      `SELECT * FROM (${scored}) AS scored
       WHERE coordinate_count >= ? AND item_count >= ?
       ORDER BY (coordinate_count + item_count) DESC, name COLLATE NOCASE ASC
       LIMIT ?`,
    )
    .all(minPublicEach, minPublicEach, limit) as PickupUserRow[];

  if (qualified.length >= limit) return qualified;

  const taken = new Set(qualified.map((r) => r.id));
  const fillers = db
    .prepare(
      `SELECT * FROM (${scored}) AS scored
       WHERE coordinate_count >= 1 AND item_count >= 1
       ORDER BY (coordinate_count + item_count) DESC, name COLLATE NOCASE ASC
       LIMIT ?`,
    )
    .all(limit) as PickupUserRow[];

  for (const row of fillers) {
    if (taken.has(row.id)) continue;
    qualified.push(row);
    if (qualified.length >= limit) break;
  }
  return qualified;
}

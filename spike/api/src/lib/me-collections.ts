import { db } from "../db/client.js";
import { getCoordinateById, toPublicCoordinate, type CoordinateRow } from "./coordinates.js";
import { favoriteCount } from "./favorite-stats.js";
import { getItemById, toPublicItem, type ItemRow } from "./items.js";

export type MeKind = "coordinates" | "items";

function ownerName(userId: string): string {
  const row = db
    .prepare(`SELECT name FROM users WHERE id = ?`)
    .get(userId) as { name: string } | undefined;
  return row?.name ?? "";
}

function meta(page: number, perPage: number, total: number) {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage) || 1),
  };
}

function itemSummary(row: ItemRow) {
  const pub = toPublicItem(row);
  return {
    id: pub.id,
    title: pub.title,
    image_url: pub.image_url,
    detail_url: pub.detail_url,
    gender: pub.gender,
    tags: pub.tags,
    seasons: pub.seasons,
    category: pub.category,
    user: {
      id: row.owner_id,
      name: ownerName(row.owner_id),
      profile_url: `/m/${row.owner_id}`,
    },
    posted_at: pub.posted_at,
    like_count: favoriteCount("items", row.id),
  };
}

function coordinateSummary(row: CoordinateRow) {
  const full = toPublicCoordinate(row, ownerName(row.owner_id));
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
    like_count: favoriteCount("coordinates", row.id),
    obi_knot: full.obi_knot,
  };
}

/** コーデ一覧系は本コーデのみ（仮は公開フィードに混ぜない） */
function publicCoordClause(alias = "t"): string {
  return `${alias}.visibility = 'public' AND ${alias}.is_temp = 0`;
}

function publicItemClause(alias = "t"): string {
  return `${alias}.visibility = 'public'`;
}

/**
 * いいねした投稿。公開は誰の分も、非公開は本人の投稿のみ。
 * いいね日時の新しい順。
 */
export function listMeFavorites(
  userId: string,
  kind: MeKind,
  page: number,
  perPage: number,
) {
  const table = kind === "coordinates" ? "coordinates" : "items";
  const visible =
    kind === "coordinates" ? publicCoordClause("t") : publicItemClause("t");
  // 他人の非公開は出さない。自分の非公開へのいいねは一覧に含める
  const scope = `(${visible} OR t.owner_id = f.user_id)`;
  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS c
         FROM favorites f
         JOIN ${table} t ON t.id = f.target_id
         WHERE f.user_id = ? AND f.kind = ? AND ${scope}`,
      )
      .get(userId, kind) as { c: number }
  ).c;

  const offset = (page - 1) * perPage;
  const rows = db
    .prepare(
      `SELECT f.target_id AS id
       FROM favorites f
       JOIN ${table} t ON t.id = f.target_id
       WHERE f.user_id = ? AND f.kind = ? AND ${scope}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(userId, kind, perPage, offset) as Array<{ id: string }>;

  const data =
    kind === "items"
      ? rows
          .map((r) => getItemById(r.id))
          .filter((row): row is ItemRow => Boolean(row))
          .map(itemSummary)
      : rows
          .map((r) => getCoordinateById(r.id))
          .filter((row): row is CoordinateRow => Boolean(row))
          .map(coordinateSummary);

  return { data, meta: meta(page, perPage, total) };
}

/**
 * フォロー中ユーザーの公開投稿。投稿日時の新しい順。
 */
export function listMeFollowingPosts(
  userId: string,
  kind: MeKind,
  page: number,
  perPage: number,
) {
  const table = kind === "coordinates" ? "coordinates" : "items";
  const visible =
    kind === "coordinates" ? publicCoordClause("t") : publicItemClause("t");
  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS c
         FROM ${table} t
         JOIN follows f ON f.followee_id = t.owner_id
         WHERE f.follower_id = ? AND ${visible}`,
      )
      .get(userId) as { c: number }
  ).c;

  const offset = (page - 1) * perPage;
  const rows = db
    .prepare(
      `SELECT t.id AS id
       FROM ${table} t
       JOIN follows f ON f.followee_id = t.owner_id
       WHERE f.follower_id = ? AND ${visible}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(userId, perPage, offset) as Array<{ id: string }>;

  const data =
    kind === "items"
      ? rows
          .map((r) => getItemById(r.id))
          .filter((row): row is ItemRow => Boolean(row))
          .map(itemSummary)
      : rows
          .map((r) => getCoordinateById(r.id))
          .filter((row): row is CoordinateRow => Boolean(row))
          .map(coordinateSummary);

  return { data, meta: meta(page, perPage, total) };
}

export function countFavorites(kind: MeKind, targetId: string): number {
  return favoriteCount(kind, targetId);
}

export function hasFavorite(
  userId: string,
  kind: MeKind,
  targetId: string,
): boolean {
  const row = db
    .prepare(
      `SELECT 1 AS ok FROM favorites
       WHERE user_id = ? AND kind = ? AND target_id = ?`,
    )
    .get(userId, kind, targetId) as { ok: number } | undefined;
  return Boolean(row);
}

function canFavoriteTarget(
  userId: string,
  kind: MeKind,
  targetId: string,
): boolean {
  if (kind === "items") {
    const item = getItemById(targetId);
    if (!item) return false;
    // 公開は誰でも。非公開は本人のみいいね可
    return item.visibility === "public" || item.owner_id === userId;
  }
  const coord = getCoordinateById(targetId);
  if (!coord || coord.is_temp) return false;
  return coord.visibility === "public" || coord.owner_id === userId;
}

export function addFavorite(
  userId: string,
  kind: MeKind,
  targetId: string,
): boolean {
  if (!canFavoriteTarget(userId, kind, targetId)) return false;
  db.prepare(
    `INSERT OR IGNORE INTO favorites (user_id, kind, target_id, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, kind, targetId, new Date().toISOString());
  return true;
}

export function removeFavorite(
  userId: string,
  kind: MeKind,
  targetId: string,
): void {
  db.prepare(
    `DELETE FROM favorites WHERE user_id = ? AND kind = ? AND target_id = ?`,
  ).run(userId, kind, targetId);
}

/** トグル。成功時 liked / like_count。対象がいいね不可なら null */
export function toggleFavorite(
  userId: string,
  kind: MeKind,
  targetId: string,
): { liked: boolean; like_count: number } | null {
  if (!canFavoriteTarget(userId, kind, targetId)) return null;
  if (hasFavorite(userId, kind, targetId)) {
    removeFavorite(userId, kind, targetId);
    return { liked: false, like_count: countFavorites(kind, targetId) };
  }
  if (!addFavorite(userId, kind, targetId)) return null;
  return { liked: true, like_count: countFavorites(kind, targetId) };
}

/** フォロー中ユーザー一覧（プロフィールリンク用） */
export function listMeFollowingUsers(followerId: string) {
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.bio, u.avatar_url, u.created_at
       FROM follows f
       JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC`,
    )
    .all(followerId) as Array<{
    id: string;
    email: string;
    name: string;
    bio: string;
    avatar_url: string | null;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    profile_url: `/m/${row.id}`,
    avatar_url: row.avatar_url,
    bio: row.bio ?? "",
  }));
}

export function hasFollow(followerId: string, followeeId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 AS ok FROM follows
       WHERE follower_id = ? AND followee_id = ?`,
    )
    .get(followerId, followeeId) as { ok: number } | undefined;
  return Boolean(row);
}

export function addFollow(followerId: string, followeeId: string): boolean {
  if (followerId === followeeId) return false;
  const followee = db
    .prepare(`SELECT id FROM users WHERE id = ?`)
    .get(followeeId) as { id: string } | undefined;
  if (!followee) return false;
  db.prepare(
    `INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at)
     VALUES (?, ?, ?)`,
  ).run(followerId, followeeId, new Date().toISOString());
  return true;
}

export function removeFollow(followerId: string, followeeId: string): void {
  db.prepare(
    `DELETE FROM follows WHERE follower_id = ? AND followee_id = ?`,
  ).run(followerId, followeeId);
}

export function toggleFollow(
  followerId: string,
  followeeId: string,
): { following: boolean } | null {
  if (followerId === followeeId) return null;
  const followee = db
    .prepare(`SELECT id FROM users WHERE id = ?`)
    .get(followeeId) as { id: string } | undefined;
  if (!followee) return null;
  if (hasFollow(followerId, followeeId)) {
    removeFollow(followerId, followeeId);
    return { following: false };
  }
  addFollow(followerId, followeeId);
  return { following: true };
}

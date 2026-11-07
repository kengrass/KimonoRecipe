import { db } from "../db/client.js";

/**
 * /media の閲覧可否。
 *
 * - 公開アイテム／公開本コーデが参照していれば誰でも可（CDN 型）
 * - それ以外（非公開・仮・未使用プールのみ）は所有者のセッション必須
 * - 公開と非公開で同一 URL を共有している場合は公開扱い（URL が既に公知のため）
 */

export function normalizeMediaPath(input: string): string {
  const bare = input.split("?")[0].split("#")[0];
  const withSlash = bare.startsWith("/") ? bare : `/${bare}`;
  if (withSlash.startsWith("/media/")) return withSlash;
  return `/media/${withSlash.replace(/^\/+/, "")}`;
}

function likeParam(mediaPath: string): string {
  return `%${mediaPath}%`;
}

/** 公開コンテンツがこの URL を載せていれば true */
export function isMediaPubliclyReadable(mediaPathRaw: string): boolean {
  const mediaPath = normalizeMediaPath(mediaPathRaw);
  const like = likeParam(mediaPath);

  const publicItem = db
    .prepare(
      `SELECT 1 AS ok FROM items
       WHERE visibility = 'public' AND images_json LIKE ?
       LIMIT 1`,
    )
    .get(like) as { ok: number } | undefined;
  if (publicItem) return true;

  const publicCoord = db
    .prepare(
      `SELECT 1 AS ok FROM coordinates
       WHERE visibility = 'public' AND is_temp = 0 AND images_json LIKE ?
       LIMIT 1`,
    )
    .get(like) as { ok: number } | undefined;
  return Boolean(publicCoord);
}

/**
 * 非公開扱いのときの所有者 ID。
 * images テーブル → 参照している投稿の owner → パス先頭セグメントの順。
 */
export function resolveMediaOwnerId(mediaPathRaw: string): string | null {
  const mediaPath = normalizeMediaPath(mediaPathRaw);
  const like = likeParam(mediaPath);

  const fromImages = db
    .prepare(
      `SELECT owner_id FROM images
       WHERE master_url = ? OR square_url = ?
          OR master_url LIKE ? OR square_url LIKE ?
       LIMIT 1`,
    )
    .get(mediaPath, mediaPath, like, like) as { owner_id: string } | undefined;
  if (fromImages?.owner_id) return fromImages.owner_id;

  const fromItem = db
    .prepare(
      `SELECT owner_id FROM items WHERE images_json LIKE ? LIMIT 1`,
    )
    .get(like) as { owner_id: string } | undefined;
  if (fromItem?.owner_id) return fromItem.owner_id;

  const fromCoord = db
    .prepare(
      `SELECT owner_id FROM coordinates WHERE images_json LIKE ? LIMIT 1`,
    )
    .get(like) as { owner_id: string } | undefined;
  if (fromCoord?.owner_id) return fromCoord.owner_id;

  // /media/{ownerId}/...
  const parts = mediaPath.replace(/^\/media\//, "").split("/");
  const maybeOwner = parts[0]?.trim();
  if (maybeOwner && /^[A-Za-z0-9_-]+$/.test(maybeOwner)) {
    const user = db
      .prepare(`SELECT id FROM users WHERE id = ?`)
      .get(maybeOwner) as { id: string } | undefined;
    if (user) return user.id;
  }
  return null;
}

/** viewerId が取れるなら所有者一致で許可。公開なら常に許可。 */
export function canReadMedia(
  mediaPathRaw: string,
  viewerId: string | null,
): boolean {
  if (isMediaPubliclyReadable(mediaPathRaw)) return true;
  const ownerId = resolveMediaOwnerId(mediaPathRaw);
  if (!ownerId || !viewerId) return false;
  return ownerId === viewerId;
}

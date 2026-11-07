import { db } from "../db/client.js";

/** `/media/{owner}/{imageId}/…` から imageId を取る */
export function imageIdFromMediaUrl(url: string): string | null {
  const bare = url.split("?")[0].split("#")[0];
  const m = bare.match(
    /^\/media\/[A-Za-z0-9_-]+\/([A-Za-z0-9_-]+)\/(?:master|square(?:-\d+)?)\.jpe?g$/i,
  );
  return m?.[1] ?? null;
}

export function setImagesUnusedPool(
  ownerId: string,
  imageIds: string[],
  unused: boolean,
) {
  const ids = [...new Set(imageIds.filter(Boolean))];
  if (!ids.length) return;
  const stmt = db.prepare(
    `UPDATE images SET in_unused_pool = ? WHERE owner_id = ? AND id = ?`,
  );
  const flag = unused ? 1 : 0;
  const tx = db.transaction(() => {
    for (const id of ids) stmt.run(flag, ownerId, id);
  });
  tx();
}

/** 投稿に載った画像は未使用プールから外す */
export function unparkImagesFromUrls(ownerId: string, urls: string[]) {
  const ids = urls
    .map(imageIdFromMediaUrl)
    .filter((id): id is string => Boolean(id));
  setImagesUnusedPool(ownerId, ids, false);
}

/** 投稿 images_json で当該画像フォルダが参照されているか */
export function imageRowReferenced(
  ownerId: string,
  imageId: string,
  masterUrl: string,
  squareUrl: string,
): boolean {
  const needle = `/media/${ownerId}/${imageId}/`;
  const masterBare = masterUrl.split("?")[0];
  const squareBare = squareUrl.split("?")[0];
  const rows = db
    .prepare(
      `SELECT images_json FROM items UNION ALL SELECT images_json FROM coordinates`,
    )
    .all() as Array<{ images_json: string }>;
  for (const row of rows) {
    if (!row.images_json) continue;
    if (row.images_json.includes(needle)) return true;
    if (row.images_json.includes(masterBare)) return true;
    if (row.images_json.includes(squareBare)) return true;
  }
  return false;
}

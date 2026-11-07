/** spike `/media/{ownerId}/{imageId}/master|square.jpg` のパス解析 */

export type SpikeMediaParts = {
  ownerId: string;
  imageId: string;
  kind: "master" | "square" | "other";
  masterUrl: string;
  squareUrl: string;
};

export function parseSpikeMediaPath(src: string): SpikeMediaParts | null {
  const bare = src.split("?")[0].split("#")[0];
  // square.jpg / square-1730….jpg / master.jpg を同一画像フォルダとして扱う
  const m = bare.match(
    /^\/media\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/(master|square(?:-\d+)?)\.jpe?g$/i,
  );
  if (!m) return null;
  const ownerId = m[1]!;
  const imageId = m[2]!;
  const file = m[3]!.toLowerCase();
  const kind = file === "master" ? "master" : "square";
  return {
    ownerId,
    imageId,
    kind,
    masterUrl: `/media/${ownerId}/${imageId}/master.jpg`,
    squareUrl: `/media/${ownerId}/${imageId}/square.jpg`,
  };
}

/** 表示 URL からマスター URL を推測（無ければ undefined） */
export function masterUrlFromDisplay(src: string): string | undefined {
  return parseSpikeMediaPath(src)?.masterUrl;
}

export function withCacheBust(src: string): string {
  const bare = src.split("?")[0];
  return `${bare}?v=${Date.now()}`;
}

/** 表示・保存は square を正にする（master が混入しても寄せる） */
export function preferSquareMediaUrl(src: string): string {
  const [bare, query] = src.split("?");
  if (!bare) return src;
  if (/\/master\.jpe?g$/i.test(bare)) {
    const square = bare.replace(/\/master\.jpe?g$/i, "/square.jpg");
    return query ? `${square}?${query}` : square;
  }
  return src;
}

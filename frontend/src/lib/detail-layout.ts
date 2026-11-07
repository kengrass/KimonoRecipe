/** 詳細内3列。タイトルが1つでもあるときだけキャプション用 row-gap */
export function tileGridClass(opts?: { withCaptions?: boolean }): string {
  const meta = opts?.withCaptions ? " detail-tile-grid--meta" : "";
  return `detail-tile-grid detail-tile-grid--content${meta}`;
}

export function tileImageSizes(): string {
  return "(max-width: 767px) 33vw, 180px";
}

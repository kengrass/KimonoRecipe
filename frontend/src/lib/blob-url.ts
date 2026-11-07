/** blob: URL なら revoke（クロップ／合成／未使用アップ共通） */
export function revokeBlobUrl(src: string | null | undefined) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

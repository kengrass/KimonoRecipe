import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import { USE_SPIKE_API } from "@/lib/config";
import { spikeEnsureUploadedUrl } from "@/lib/spike-write";

/**
 * blob: URL をアップロード済み URL に差し替える。
 *
 * | 環境 | 挙動 |
 * |------|------|
 * | spike（USE_SPIKE_API） | `spikeEnsureUploadedUrl` で実 URL に変換 |
 * | モック | blob のまま返す（デモ用） |
 * | LIVE だが spike 以外（API_BASE_URL のみ等） | blob が残っていたら throw（黙って保存しない） |
 *
 * 本番アップロード手続きが決まったら、spike 分岐の隣に足す。
 * @see ./README.md
 */
export async function mapRowsWithUploadedUrls<T>(
  rows: T[],
  getUrl: (row: T) => string,
  withUrl: (row: T, url: string) => T,
): Promise<T[]> {
  if (USE_SPIKE_API) {
    const out: T[] = [];
    for (const row of rows) {
      const url = getUrl(row);
      const next =
        url && url.startsWith("blob:")
          ? await spikeEnsureUploadedUrl(url)
          : url;
      out.push(withUrl(row, next));
    }
    return out;
  }

  if (ADMIN_USES_LIVE_API) {
    for (const row of rows) {
      const url = getUrl(row);
      if (url.startsWith("blob:")) {
        throw new Error(
          "画像アップロードは spike 接続時のみ対応しています（本番 API 手続きは未接続）",
        );
      }
    }
  }

  return rows;
}

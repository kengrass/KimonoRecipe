import type { AttachConfirmResult } from "@/base/detail/AttachSearchDialog";
import type { PublicListItem } from "@/lib/types";

/**
 * 紐付け確定：既存のうち残す分 ＋ 追加分をマージする。
 * コーデ→アイテム／アイテム→コーデの双方で使う。
 */
export function mergeAttachSelection<T extends { id: string }>(
  linked: T[],
  result: AttachConfirmResult,
  mapAdded: (row: PublicListItem) => T | null,
  opts?: { acceptAddedId?: (id: string) => boolean },
): T[] {
  const byId = new Map(result.selectedRows.map((row) => [row.id, row]));
  const kept = linked.filter((item) => result.selectedIds.includes(item.id));
  const keptIds = new Set(kept.map((item) => item.id));
  const added: T[] = [];
  for (const id of result.addedIds) {
    if (keptIds.has(id)) continue;
    if (opts?.acceptAddedId && !opts.acceptAddedId(id)) continue;
    const row = byId.get(id);
    if (!row) continue;
    const mapped = mapAdded(row);
    if (mapped) added.push(mapped);
  }
  return [...kept, ...added];
}

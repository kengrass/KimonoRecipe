"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * 選択順を保つ ID 選択（未使用画像の整理・ピッカー共通）。
 */
export function useOrderedIdSelection(selectableIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedCount = selectedIds.length;
  const allSelected =
    selectableIds.length > 0 && selectedCount === selectableIds.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectableKey = selectableIds.join("\0");

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const ids = selectableKey ? selectableKey.split("\0") : [];
      if (ids.length > 0 && prev.length === ids.length) return [];
      return ids;
    });
  }, [selectableKey]);

  const clear = useCallback(() => setSelectedIds([]), []);

  return {
    selectedIds,
    selectedSet,
    selectedCount,
    allSelected,
    toggle,
    toggleAll,
    clear,
    setSelectedIds,
  };
}

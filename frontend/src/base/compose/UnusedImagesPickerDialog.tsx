"use client";

import { useEffect, useMemo, useState } from "react";
import { UnusedImageTile } from "@/base/compose/UnusedImageTile";
import { useOrderedIdSelection } from "@/base/compose/useOrderedIdSelection";
import { ModalDialog } from "@/base/ui/ModalDialog";
import { PrimaryButton } from "@/base/form/form-ui";
import { USE_SPIKE_API } from "@/lib/config";
import type { ComposePresetImage } from "@/lib/compose-preset";
import {
  getMockUnusedImages,
  subscribeMockUnusedImages,
} from "@/lib/mock-unused-images";
import { spikeListUnusedImages } from "@/lib/spike-write";

type Props = {
  open: boolean;
  /** すでにセット済みの id（選択不可） */
  excludeIds: string[];
  onClose: () => void;
  onAdd: (images: ComposePresetImage[]) => void;
};

/**
 * 編集画面から未使用画像を追加（モック）。
 * プールは整理画面と共有。追加順は選択した順。
 */
export function UnusedImagesPickerDialog({
  open,
  excludeIds,
  onClose,
  onAdd,
}: Props) {
  const [pool, setPool] = useState(() =>
    USE_SPIKE_API ? [] : getMockUnusedImages(),
  );
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const selectable = useMemo(
    () => pool.filter((img) => !excluded.has(img.id)),
    [pool, excluded],
  );
  const selectableIds = useMemo(
    () => selectable.map((img) => img.id),
    [selectable],
  );
  const {
    selectedIds,
    selectedSet,
    selectedCount,
    allSelected,
    toggle,
    toggleAll,
    clear,
  } = useOrderedIdSelection(selectableIds);

  useEffect(() => {
    if (!open) {
      clear();
      return;
    }
    if (USE_SPIKE_API) {
      let cancelled = false;
      void spikeListUnusedImages()
        .then((rows) => {
          if (!cancelled) setPool(rows);
        })
        .catch(() => {
          if (!cancelled) setPool([]);
        });
      return () => {
        cancelled = true;
      };
    }
    setPool(getMockUnusedImages());
    return subscribeMockUnusedImages(() => {
      setPool(getMockUnusedImages());
    });
  }, [open, clear]);

  const handleClose = () => {
    clear();
    onClose();
  };

  const handleAdd = () => {
    const byId = new Map(pool.map((img) => [img.id, img]));
    const picked = selectedIds
      .map((id) => byId.get(id))
      .filter((img): img is ComposePresetImage => Boolean(img));
    if (!picked.length) return;
    onAdd(picked);
    clear();
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      title="未使用写真から選択"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text"
          >
            キャンセル
          </button>
          <PrimaryButton
            className="min-h-11 flex-[1.4]"
            disabled={selectedCount === 0}
            onClick={handleAdd}
          >
            {selectedCount > 0 ? `${selectedCount}枚を追加` : "追加"}
          </PrimaryButton>
        </div>
      }
    >
      {!selectable.length ? (
        <p className="py-6 text-center text-sm text-kr-muted">
          追加できる未使用画像はありません
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-kr-navy underline-offset-2 hover:underline"
            >
              {allSelected ? "選択を解除" : "すべて選択"}
            </button>
            <p className="text-xs text-kr-muted">{selectedCount}枚選択中</p>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {selectable.map((img) => {
              const order = selectedIds.indexOf(img.id);
              return (
                <li key={img.id}>
                  <UnusedImageTile
                    image={img}
                    selected={selectedSet.has(img.id)}
                    selectOrder={order >= 0 ? order + 1 : undefined}
                    onToggle={toggle}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ModalDialog>
  );
}

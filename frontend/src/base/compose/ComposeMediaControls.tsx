"use client";

import { useCallback, useEffect } from "react";
import { ComposeImageSection } from "@/base/compose/ComposeImageSection";
import { ImageCropDialog } from "@/base/compose/ImageCropDialog";
import { UnusedImagesPickerDialog } from "@/base/compose/UnusedImagesPickerDialog";
import { useComposeCropSession } from "@/base/compose/useComposeCropSession";
import { useComposeImageList } from "@/base/compose/useComposeImageList";
import { USE_SPIKE_API } from "@/lib/config";
import type { ComposePresetImage } from "@/lib/compose-preset";
import { prependMockUnusedImages } from "@/lib/mock-unused-images";
import { parseSpikeMediaPath } from "@/lib/spike-media";
import { spikeParkUnusedImage } from "@/lib/spike-write";

type Props = {
  flash: (message: string) => void;
  seedImages?: ComposePresetImage[];
  seedRevision?: number;
  onImagesChange?: (images: ComposePresetImage[]) => void;
};

/**
 * 投稿編集の画像まわり（アップ／未使用選択／トリミング／並べ替え）。
 */
export function ComposeMediaControls({
  flash,
  seedImages,
  seedRevision = 0,
  onImagesChange,
}: Props) {
  const list = useComposeImageList(seedImages, seedRevision);
  const crop = useComposeCropSession({
    applyToList: list.applyCropResult,
    flash,
  });

  useEffect(() => {
    onImagesChange?.(list.images);
  }, [list.images]); // onImagesChange は親の ref 更新想定

  /** 投稿から外す＝未使用プールへ（明示削除のみ流入） */
  const removeToUnused = useCallback(
    (id: string) => {
      const target = list.images.find((img) => img.id === id);
      list.remove(id);
      if (!target) return;

      if (!USE_SPIKE_API) {
        prependMockUnusedImages([
          {
            id: target.id,
            src: target.src,
            masterSrc: target.masterSrc,
            alt: target.alt || "未使用画像",
          },
        ]);
        flash("未使用画像に移しました（モック）");
        return;
      }

      const parsed = parseSpikeMediaPath(target.masterSrc || target.src);
      const serverId = parsed?.imageId ?? target.id;
      void spikeParkUnusedImage(serverId)
        .then((row) => {
          if (row) flash("未使用画像に移しました");
        })
        .catch(() => {
          /* ローカルからは外済み。プール同期失敗は黙る */
        });
    },
    [flash, list.images, list.remove],
  );

  return (
    <>
      {crop.fileInput}

      {crop.session ? (
        <ImageCropDialog
          key={crop.session.id}
          sourceSrc={crop.session.sourceSrc}
          initialViewport={crop.session.initialViewport}
          onClose={crop.close}
          onConfirm={crop.confirm}
        />
      ) : null}

      <UnusedImagesPickerDialog
        open={list.pickerOpen}
        excludeIds={list.images.map((img) => img.id)}
        onClose={list.closePicker}
        onAdd={(picked) => {
          list.addUnused(picked);
          flash(
            USE_SPIKE_API
              ? `${picked.length}枚を追加しました`
              : `${picked.length}枚を追加しました（モック）`,
          );
        }}
      />

      <ComposeImageSection
        title="画像"
        images={list.images}
        onRemove={removeToUnused}
        onUpload={crop.openNew}
        onPickUnused={list.openPicker}
        reorderMode={list.reorderMode}
        onToggleReorder={list.toggleReorder}
        onMove={list.move}
        onRecrop={crop.openRecrop}
      />

      {crop.uploading ? (
        <p className="mt-2 text-xs text-kr-muted">画像をアップロード中…</p>
      ) : null}
    </>
  );
}

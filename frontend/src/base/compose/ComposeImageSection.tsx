"use client";

import { ComposePresetGallery } from "@/base/compose/ComposePresetGallery";
import {
  PrimaryButton,
  SecondaryButton,
  UploadLimitsNote,
} from "@/base/form/form-ui";
import type { ComposePresetImage } from "@/lib/compose-preset";

type Props = {
  title: string;
  images: ComposePresetImage[];
  onRemove: (id: string) => void;
  onUpload: () => void;
  onPickUnused: () => void;
  reorderMode: boolean;
  onToggleReorder: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRecrop: (image: ComposePresetImage) => void;
};

/** コーデ／アイテム共通：画像セット＋アップロード＋未使用から選択 */
export function ComposeImageSection({
  title,
  images,
  onRemove,
  onUpload,
  onPickUnused,
  reorderMode,
  onToggleReorder,
  onMove,
  onRecrop,
}: Props) {
  const canReorder = images.length >= 2;

  return (
    <section className="page-section">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-kr-muted">
          {title}
          {images.length > 0 ? (
            <span className="ml-2 text-xs font-normal tabular-nums text-kr-muted">
              {images.length}枚
            </span>
          ) : null}
        </h2>
        {canReorder ? (
          <button
            type="button"
            onClick={onToggleReorder}
            aria-pressed={reorderMode}
            className="shrink-0 text-sm font-medium text-kr-navy underline-offset-2 hover:underline"
          >
            {reorderMode ? "完了" : "並べ替え"}
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        {images.length > 0 ? (
          <ComposePresetGallery
            images={images}
            onRemove={reorderMode ? undefined : onRemove}
            reorderMode={reorderMode}
            onMove={onMove}
            onRecrop={reorderMode ? undefined : onRecrop}
          />
        ) : null}

        <div className="space-y-1.5">
          <PrimaryButton onClick={onUpload}>
            新しい写真をアップロード
          </PrimaryButton>
          <UploadLimitsNote />
        </div>

        <SecondaryButton
          tone="soft"
          className="w-full"
          onClick={onPickUnused}
        >
          アップ済の未使用写真から選択
        </SecondaryButton>
      </div>
    </section>
  );
}

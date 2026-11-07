"use client";

import { UnusedImageTile } from "@/base/compose/UnusedImageTile";
import { useUnusedImages } from "@/base/compose/useUnusedImages";
import {
  FormPage,
  PageTitle,
  PrimaryButton,
  SecondaryButton,
  UploadLimitsNote,
} from "@/base/form/form-ui";

/**
 * 未使用画像（余り画像の再利用・アップロード）。
 * クロップなし。トリミングは編集画面側。
 */
export function UnusedImagesView() {
  const {
    Toast,
    inputRef,
    images,
    selected,
    selectedIds,
    selectedCount,
    allSelected,
    openFilePicker,
    onFileChange,
    toggle,
    toggleAll,
    openCompose,
    deleteSelected,
  } = useUnusedImages();

  const hasImages = images.length > 0;
  const canAct = selectedCount > 0;

  return (
    <FormPage>
      {/* タイトル〜本体の余白は FormPage の space-y-8 より詰める */}
      <div>
        <PageTitle>未使用画像</PageTitle>
        {Toast}

        <div className="mt-3 space-y-3 md:mt-3.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />

          <div className="space-y-1.5">
            <PrimaryButton onClick={openFilePicker}>
              画像をアップロード
            </PrimaryButton>
            <UploadLimitsNote />
          </div>

          {!hasImages ? (
            <p className="py-8 text-center text-sm text-kr-muted">
              未使用の画像はありません
            </p>
          ) : (
            <div className="space-y-2 pt-3 md:pt-4">
              <ActionBar
                disabled={!canAct}
                onCoordinate={() => openCompose("coordinate")}
                onItem={() => openCompose("item")}
                onDelete={deleteSelected}
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm font-medium text-kr-navy underline-offset-2 hover:underline"
                >
                  {allSelected ? "選択を解除" : "すべて選択"}
                </button>
                <p className="text-xs tabular-nums text-kr-muted">
                  {canAct
                    ? `${selectedCount} / ${images.length} 枚選択`
                    : `${images.length} 枚`}
                </p>
              </div>

              <ul
                className="grid grid-cols-3"
                style={{ gap: "var(--kr-tile-gap)" }}
                aria-label="未使用画像"
              >
                {images.map((image) => (
                  <li key={image.id}>
                    <UnusedImageTile
                      image={image}
                      selected={selected.has(image.id)}
                      onToggle={toggle}
                      selectOrder={
                        selected.has(image.id)
                          ? selectedIds.indexOf(image.id) + 1
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>

              <p className="text-[11px] leading-relaxed text-kr-muted">
                複数選択してコーデ／アイテム作成や削除ができます
              </p>
            </div>
          )}
        </div>
      </div>
    </FormPage>
  );
}

function ActionBar({
  disabled,
  onCoordinate,
  onItem,
  onDelete,
}: {
  disabled: boolean;
  onCoordinate: () => void;
  onItem: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="sticky top-[var(--kr-aside-sticky-top)] z-10 grid grid-cols-3 gap-2 bg-white/95 py-0.5 backdrop-blur">
      <SecondaryButton
        tone="soft"
        className="text-xs disabled:opacity-40"
        disabled={disabled}
        onClick={onCoordinate}
      >
        コーディネート
      </SecondaryButton>
      <SecondaryButton
        tone="soft"
        className="text-xs disabled:opacity-40"
        disabled={disabled}
        onClick={onItem}
      >
        アイテム
      </SecondaryButton>
      <SecondaryButton
        tone="danger"
        className="text-xs disabled:opacity-40"
        disabled={disabled}
        onClick={onDelete}
      >
        削除
      </SecondaryButton>
    </div>
  );
}

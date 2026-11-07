"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useOrderedIdSelection } from "@/base/compose/useOrderedIdSelection";
import { useMockFlash } from "@/base/ui/useMockFlash";
import { USE_SPIKE_API } from "@/lib/config";
import {
  setComposePreset,
  type ComposePresetImage,
} from "@/lib/compose-preset";
import { APP_ROUTES } from "@/lib/laravel-urls";
import {
  deleteMockUnusedImages,
  getMockUnusedImages,
  prependMockUnusedImages,
  subscribeMockUnusedImages,
} from "@/lib/mock-unused-images";
import {
  spikeDeleteUnusedImage,
  spikeListUnusedImages,
  spikeUploadImage,
} from "@/lib/spike-write";

/** 仮制限（UploadLimitsNote と揃える） */
export const UNUSED_UPLOAD_BATCH_MAX = 10;

/**
 * 未使用画像整理の状態・操作（モック）。
 * プールは投稿ピッカーと共有。選択順を保って投稿画面へ渡す。
 */
export function useUnusedImages() {
  const router = useRouter();
  const { flash, Toast } = useMockFlash();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ComposePresetImage[]>(() =>
    USE_SPIKE_API ? [] : getMockUnusedImages(),
  );
  const imageIds = useMemo(() => images.map((img) => img.id), [images]);
  const {
    selectedIds,
    selectedSet: selected,
    selectedCount,
    allSelected,
    toggle,
    toggleAll,
    clear: clearSelection,
  } = useOrderedIdSelection(imageIds);

  useEffect(() => {
    if (USE_SPIKE_API) {
      let cancelled = false;
      void spikeListUnusedImages()
        .then((rows) => {
          if (!cancelled) setImages(rows);
        })
        .catch(() => {
          if (!cancelled) setImages([]);
        });
      return () => {
        cancelled = true;
      };
    }
    return subscribeMockUnusedImages(() => {
      setImages(getMockUnusedImages());
    });
  }, []);

  const byId = useMemo(
    () => new Map(images.map((img) => [img.id, img])),
    [images],
  );
  const selectedImages = useMemo(
    () =>
      selectedIds
        .map((id) => byId.get(id))
        .filter((img): img is ComposePresetImage => Boolean(img)),
    [byId, selectedIds],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      e.target.value = "";
      if (!files.length) return;

      const capped = files.slice(0, UNUSED_UPLOAD_BATCH_MAX);
      if (USE_SPIKE_API) {
        void (async () => {
          try {
            const added: ComposePresetImage[] = [];
            for (const file of capped) {
              const uploaded = await spikeUploadImage(
                file,
                file.name || "upload.jpg",
                { unused: true },
              );
              added.push({
                id: uploaded.id,
                src: uploaded.url,
                masterSrc: uploaded.master_url,
                alt: file.name || "アップロード",
              });
            }
            setImages((prev) => [...added, ...prev]);
            flash(`${added.length}枚をアップロードしました`);
          } catch {
            flash("アップロードに失敗しました（ログイン済みか確認）");
          }
        })();
        return;
      }

      const stamp = Date.now();
      const added: ComposePresetImage[] = capped.map((file, i) => {
        const src = URL.createObjectURL(file);
        return {
          id: `upload-${stamp}-${i}`,
          src,
          masterSrc: src,
          alt: file.name || "アップロード（モック）",
        };
      });
      prependMockUnusedImages(added);
      flash(`${added.length}枚を追加しました（モック）`);
    },
    [flash],
  );

  const requireSelection = useCallback(() => {
    if (selectedCount > 0) return true;
    flash("画像を選択してください");
    return false;
  }, [flash, selectedCount]);

  const openCompose = useCallback(
    (kind: "coordinate" | "item") => {
      if (!requireSelection()) return;
      setComposePreset(selectedImages);
      router.push(
        kind === "coordinate" ? APP_ROUTES.addCoordinate : APP_ROUTES.addItem,
      );
    },
    [requireSelection, router, selectedImages],
  );

  const deleteSelected = useCallback(() => {
    if (!requireSelection()) return;
    const count = selectedCount;
    if (USE_SPIKE_API) {
      const ids = [...selectedIds];
      void (async () => {
        let ok = 0;
        let inUse = 0;
        for (const id of ids) {
          try {
            const result = await spikeDeleteUnusedImage(id);
            if (result === "ok") ok += 1;
            else inUse += 1;
          } catch {
            /* 個別失敗はスキップ */
          }
        }
        try {
          const rows = await spikeListUnusedImages();
          setImages(rows);
        } catch {
          setImages((prev) =>
            prev.filter((img) => !(ok > 0 && ids.includes(img.id))),
          );
        }
        clearSelection();
        if (inUse > 0 && ok === 0) {
          flash("投稿で使用中のため削除できませんでした");
        } else if (inUse > 0) {
          flash(`${ok}枚を削除（${inUse}枚は使用中のため残しました）`);
        } else {
          flash(`${ok || count}枚を削除しました`);
        }
      })();
      return;
    }
    deleteMockUnusedImages(selectedIds);
    clearSelection();
    flash(`${count}枚を削除（モック）`);
  }, [
    clearSelection,
    flash,
    requireSelection,
    selectedCount,
    selectedIds,
  ]);

  return {
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
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeCropState } from "@/base/compose/compose-crop-math";
import {
  takeComposePreset,
  type ComposeCropState,
  type ComposePresetImage,
} from "@/lib/compose-preset";
import {
  masterUrlFromDisplay,
  preferSquareMediaUrl,
} from "@/lib/spike-media";

export type ComposeCropApplyPayload = {
  previewSrc: string;
  masterSrc?: string;
  serverId?: string;
  replaceId?: string | null;
  crop: ComposeCropState;
};

/**
 * 投稿画面の画像セット（プリセット・並べ替え・未使用追加・トリミング結果反映）。
 */
export function useComposeImageList(
  seedImages?: ComposePresetImage[],
  seedRevision = 0,
) {
  const [images, setImages] = useState<ComposePresetImage[]>([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const seedRef = useRef(seedImages);
  seedRef.current = seedImages;
  const appliedRevision = useRef(0);

  useEffect(() => {
    const preset = takeComposePreset();
    if (preset.length) {
      setImages(preset);
      return;
    }
    if (seedRef.current) setImages(seedRef.current);
  }, []);

  useEffect(() => {
    if (seedRevision === 0) return;
    if (seedRevision === appliedRevision.current) return;
    appliedRevision.current = seedRevision;
    setImages(seedImages ?? []);
  }, [seedRevision, seedImages]);

  useEffect(() => {
    if (images.length < 2) setReorderMode(false);
  }, [images.length]);

  const remove = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setImages((prev) => {
      const i = prev.findIndex((img) => img.id === id);
      if (i < 0) return prev;
      const j = i + direction;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[i]!;
      next[i] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }, []);

  const addUnused = useCallback((picked: ComposePresetImage[]) => {
    setImages((prev) => {
      const have = new Set(prev.map((img) => img.id));
      const fresh = picked.filter((img) => !have.has(img.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);

  const applyCropResult = useCallback((result: ComposeCropApplyPayload) => {
    const preview = preferSquareMediaUrl(result.previewSrc);
    const crop = normalizeCropState(result.crop) ?? result.crop;
    const replaceId = result.replaceId ?? null;

    if (replaceId) {
      setImages((prev) =>
        prev.map((img) => {
          if (img.id !== replaceId) return img;
          return {
            ...img,
            id: result.serverId ?? img.id,
            src: preview,
            masterSrc:
              result.masterSrc ??
              img.masterSrc ??
              masterUrlFromDisplay(preview),
            crop,
          };
        }),
      );
      return;
    }

    setImages((prev) => [
      {
        id: result.serverId ?? `upload-${Date.now()}`,
        src: preview,
        masterSrc: result.masterSrc ?? masterUrlFromDisplay(preview),
        crop,
        alt: preview.startsWith("/media/")
          ? "アップロード"
          : "アップロード（モック）",
      },
      ...prev,
    ]);
  }, []);

  return {
    images,
    remove,
    move,
    addUnused,
    applyCropResult,
    reorderMode,
    toggleReorder: () => setReorderMode((v) => !v),
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  };
}

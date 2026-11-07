"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComposePresetImage } from "@/lib/compose-preset";
import { revokeBlobUrl } from "@/lib/blob-url";
import { renderItemCollageToObjectUrl } from "@/lib/temp-coordinate-collage";

/**
 * 仮コーデ用：アイテムURL群を1枚の合成画像シードにする。
 * object URL の revoke も面倒を見る。
 */
export function useCollageSeedImages() {
  const [seedImages, setSeedImages] = useState<ComposePresetImage[] | undefined>();
  const [seedRevision, setSeedRevision] = useState(0);
  const collageObjectUrlRef = useRef<string | null>(null);

  const revokeCurrentCollage = useCallback(() => {
    revokeBlobUrl(collageObjectUrlRef.current);
    collageObjectUrlRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      revokeCurrentCollage();
    };
  }, [revokeCurrentCollage]);

  const bumpSeed = useCallback((images: ComposePresetImage[]) => {
    setSeedImages(images);
    setSeedRevision((n) => n + 1);
  }, []);

  const applyCollageAsSingleImage = useCallback(
    async (sourceUrls: string[], alt: string) => {
      const objectUrl = await renderItemCollageToObjectUrl(sourceUrls);
      revokeCurrentCollage();
      if (!objectUrl) {
        bumpSeed([]);
        return;
      }
      collageObjectUrlRef.current = objectUrl;
      bumpSeed([{ id: "temp-collage", src: objectUrl, alt }]);
    },
    [bumpSeed, revokeCurrentCollage],
  );

  const setPlainSeedImages = useCallback(
    (images: ComposePresetImage[]) => {
      revokeCurrentCollage();
      bumpSeed(images);
    },
    [bumpSeed, revokeCurrentCollage],
  );

  return {
    seedImages,
    seedRevision,
    applyCollageAsSingleImage,
    setPlainSeedImages,
  };
}

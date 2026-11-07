"use client";

import {
  createElement,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { ImageCropResult } from "@/base/compose/ImageCropDialog";
import { normalizeCropState } from "@/base/compose/compose-crop-math";
import {
  recallCropViewportKeys,
  rememberCropViewportKeys,
} from "@/base/compose/compose-crop-memory";
import type {
  ComposeCropState,
  ComposePresetImage,
} from "@/lib/compose-preset";
import { revokeBlobUrl } from "@/lib/blob-url";
import { USE_SPIKE_API } from "@/lib/config";
import {
  masterUrlFromDisplay,
  parseSpikeMediaPath,
  withCacheBust,
} from "@/lib/spike-media";
import {
  spikeReplaceSquare,
  spikeUploadImage,
  spikeUploadImagePair,
} from "@/lib/spike-write";

/** 未トリミング追加時の既定（全体収め） */
const DEFAULT_FIT_CROP: ComposeCropState = {
  zoom: 1,
  offsetXRatio: 0,
  offsetYRatio: 0,
  rotation: 0,
  flipHorizontal: false,
};

export type CropSession = {
  /** マウント用 key */
  id: number;
  /** 編集ソース（マスター or 新規 blob） */
  sourceSrc: string;
  /** 再クロップ対象のギャラリー id。新規は null */
  replaceId: string | null;
  /** 再オープン時の枠 */
  initialViewport: ComposeCropState | null;
};

type ApplyToList = (payload: ImageCropResult & {
  previewSrc: string;
  masterSrc?: string;
  serverId?: string;
  replaceId?: string | null;
  crop: ComposeCropState;
}) => void;

type Options = {
  applyToList: ApplyToList;
  flash: (message: string) => void;
};

function flashFor(
  mode: ImageCropResult["mode"],
  kind: "replaced" | "uploaded" | "mock",
) {
  const label = mode === "fit" ? "全体" : "クローズアップ";
  if (kind === "replaced") return `トリミングを反映しました（${label}）`;
  if (kind === "uploaded") {
    return `トリミング画像を保存しました（${label}）。投稿の保存で本文に反映されます`;
  }
  return `トリミングを確定しました（モック・${label}）`;
}

function viewportKeysFor(image: {
  id?: string | null;
  src?: string | null;
  masterSrc?: string | null;
}) {
  const fromSrc = image.src ? parseSpikeMediaPath(image.src) : null;
  const fromMaster = image.masterSrc
    ? parseSpikeMediaPath(image.masterSrc)
    : null;
  return [
    image.id,
    fromSrc?.imageId,
    fromMaster?.imageId,
    image.src?.split("?")[0],
    image.masterSrc?.split("?")[0],
  ];
}

/**
 * トリミングダイアログのセッション（開く／閉じる／確定アップロード）。
 * 状態は session 1本。開くたびに id を増やしてダイアログをマウントし直す。
 */
export function useComposeCropSession({ applyToList, flash }: Options) {
  const [session, setSession] = useState<CropSession | null>(null);
  const sessionRef = useRef<CropSession | null>(null);
  sessionRef.current = session;
  const [uploading, setUploading] = useState(false);
  const seqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setSession((prev) => {
      if (prev?.sourceSrc.startsWith("blob:")) {
        revokeBlobUrl(prev.sourceSrc);
      }
      return null;
    });
  }, []);

  const openNew = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /** 新規アップはトリミングを挟まず追加。調整したい人だけ openRecrop */
  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      if (!USE_SPIKE_API) {
        const blobUrl = URL.createObjectURL(file);
        applyToList({
          mode: "fit",
          rotation: 0,
          flipHorizontal: false,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          stageSize: 800,
          outputSrc: blobUrl,
          previewSrc: blobUrl,
          masterSrc: blobUrl,
          replaceId: null,
          crop: DEFAULT_FIT_CROP,
        });
        flash("画像を追加しました（モック）");
        return;
      }

      setUploading(true);
      void (async () => {
        try {
          const uploaded = await spikeUploadImage(
            file,
            file.name || "upload.jpg",
          );
          const squareUrl = uploaded.square_url || uploaded.url;
          applyToList({
            mode: "fit",
            rotation: 0,
            flipHorizontal: false,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            stageSize: 800,
            outputSrc: withCacheBust(squareUrl),
            previewSrc: withCacheBust(squareUrl),
            masterSrc: uploaded.master_url || uploaded.url,
            serverId: uploaded.id,
            replaceId: null,
            crop: DEFAULT_FIT_CROP,
          });
          flash("画像を追加しました");
        } catch {
          flash("画像のアップロードに失敗しました");
        } finally {
          setUploading(false);
        }
      })();
    },
    [applyToList, flash],
  );

  const openRecrop = useCallback((image: ComposePresetImage) => {
    const sourceSrc =
      image.masterSrc ||
      masterUrlFromDisplay(image.src) ||
      image.src;
    seqRef.current += 1;
    setSession({
      id: seqRef.current,
      sourceSrc,
      replaceId: image.id,
      initialViewport: recallCropViewportKeys(
        viewportKeysFor(image),
        image.crop,
      ),
    });
  }, []);

  const confirm = useCallback(
    (result: ImageCropResult) => {
      const current = sessionRef.current;
      if (!current) return;
      const replaceId = current.replaceId;
      const sourceSrc = current.sourceSrc;
      const viewport = normalizeCropState(result.crop) ?? result.crop;
      const parsedSource = parseSpikeMediaPath(sourceSrc);

      // アップロード完了を待たず枠を残す（すぐ再トリムしても復元できる）
      rememberCropViewportKeys(
        [
          replaceId,
          parsedSource?.imageId,
          ...viewportKeysFor({
            id: replaceId,
            src: sourceSrc,
            masterSrc: sourceSrc,
          }),
        ],
        viewport,
      );

      // 再クロップ時のみ楽観反映（新規は二重追加を避けるためアップロード後）
      if (replaceId) {
        applyToList({
          ...result,
          previewSrc: result.outputSrc,
          masterSrc: parsedSource?.masterUrl || sourceSrc,
          serverId: parsedSource?.imageId,
          replaceId,
          crop: viewport,
        });
      }
      setSession(null);

      if (!USE_SPIKE_API) {
        if (!replaceId) {
          applyToList({
            ...result,
            previewSrc: result.outputSrc,
            masterSrc: sourceSrc,
            replaceId,
            crop: viewport,
          });
        }
        flash(flashFor(result.mode, "mock"));
        return;
      }

      setUploading(true);
      void (async () => {
        let uploadedOk = false;
        try {
          const squareRes = await fetch(result.outputSrc);
          if (!squareRes.ok) throw new Error("square_blob_fetch");
          const squareBlob = await squareRes.blob();
          const parsed = parseSpikeMediaPath(sourceSrc);

          if (parsed) {
            try {
              const replaced = await spikeReplaceSquare(
                parsed.imageId,
                squareBlob,
              );
              const squareUrl = replaced.square_url || replaced.url;
              const serverId = replaced.id || parsed.imageId;
              rememberCropViewportKeys(
                [serverId, replaceId, parsed.imageId],
                viewport,
              );
              applyToList({
                ...result,
                outputSrc: withCacheBust(squareUrl),
                previewSrc: withCacheBust(squareUrl),
                masterSrc: replaced.master_url || parsed.masterUrl,
                serverId,
                replaceId,
                crop: viewport,
              });
              uploadedOk = true;
              flash(flashFor(result.mode, "replaced"));
              return;
            } catch (err) {
              const msg = err instanceof Error ? err.message : "";
              if (!msg.includes(":404")) throw err;
            }
          }

          const masterRes = await fetch(parsed?.masterUrl ?? sourceSrc);
          if (!masterRes.ok) throw new Error("master_blob_fetch");
          const masterBlob = await masterRes.blob();
          const uploaded = await spikeUploadImagePair(
            masterBlob,
            squareBlob,
            "master.jpg",
          );
          const squareUrl = uploaded.square_url || uploaded.url;
          rememberCropViewportKeys(
            [uploaded.id, replaceId, parsedSource?.imageId],
            viewport,
          );
          applyToList({
            ...result,
            outputSrc: withCacheBust(squareUrl),
            previewSrc: withCacheBust(squareUrl),
            masterSrc: parsed?.masterUrl || uploaded.master_url,
            serverId: uploaded.id,
            replaceId,
            crop: viewport,
          });
          uploadedOk = true;
          flash(flashFor(result.mode, "uploaded"));
        } catch {
          flash("画像のアップロードに失敗しました");
          // 楽観反映は済んでいるので枠付きプレビューは残す
        } finally {
          if (uploadedOk) {
            revokeBlobUrl(result.outputSrc);
            if (sourceSrc.startsWith("blob:")) revokeBlobUrl(sourceSrc);
          }
          setUploading(false);
        }
      })();
    },
    [applyToList, flash],
  );

  const fileInput: ReactNode = createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: onFileChange,
  });

  return {
    session,
    uploading,
    fileInput,
    openNew,
    openRecrop,
    close,
    confirm,
  };
}

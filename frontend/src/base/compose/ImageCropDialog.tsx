"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  clampCropOffset,
  normalizeCropState,
} from "@/base/compose/compose-crop-math";
import {
  CROP_ZOOM_MAX,
  CROP_ZOOM_MIN,
  ImageCropToolbar,
} from "@/base/compose/ImageCropToolbar";
import {
  fitScaleFor,
  renderViewportSquare,
  rotatedSize,
} from "@/base/compose/renderSquareImage";
import { PrimaryButton } from "@/base/form/form-ui";
import { ModalDialog } from "@/base/ui/ModalDialog";
import type { ComposeCropState } from "@/lib/compose-preset";

export type ImageCropMode = "fit" | "closeup";

export type ImageCropResult = {
  mode: ImageCropMode;
  rotation: number;
  flipHorizontal: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
  stageSize: number;
  outputSrc: string;
  /** 再オープン用に正規化した枠 */
  crop: ComposeCropState;
};

type Props = {
  /** 編集ソース（マスター） */
  sourceSrc: string;
  /** 前回確定枠。無ければ全体収めから開始 */
  initialViewport?: ComposeCropState | null;
  onClose: () => void;
  onConfirm: (result: ImageCropResult) => void;
};

/**
 * トリミング UI。親がマウントしたときだけ生きる（開くたびに新規マウント）。
 * initialViewport はマウント時の初期値としてだけ使う。
 */
export function ImageCropDialog({
  sourceSrc,
  initialViewport = null,
  onClose,
  onConfirm,
}: Props) {
  // マウント時だけ固定（親の再レンダーで消さない）
  const bootRef = useRef(normalizeCropState(initialViewport));
  const boot = bootRef.current;

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(boot?.zoom ?? CROP_ZOOM_MIN);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(boot?.rotation ?? 0);
  const [flipH, setFlipH] = useState(boot?.flipHorizontal ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 枠復元が終わるまでプレビューを隠す（一瞬全体収めに見えるのを防ぐ） */
  const [frameReady, setFrameReady] = useState(() => !boot);
  const appliedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNatural(null);
    setError(null);
    const img = new Image();
    if (sourceSrc.startsWith("http://") || sourceSrc.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (!cancelled) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      if (!cancelled) {
        setNatural(null);
        setError("画像を読み込めませんでした");
      }
    };
    img.src = sourceSrc;
    return () => {
      cancelled = true;
    };
  }, [sourceSrc]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setStageSize(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = useCallback(
    (x: number, y: number, z: number, rot: number) => {
      if (!natural || stageSize < 1) return { x: 0, y: 0 };
      return clampCropOffset(x, y, z, rot, natural, stageSize);
    },
    [natural, stageSize],
  );

  // natural が effect 再実行で一度 null になっても、揃い直したら枠を適用する
  useLayoutEffect(() => {
    if (!natural || stageSize < 8) {
      if (!natural) appliedRef.current = false;
      return;
    }
    if (appliedRef.current) return;
    appliedRef.current = true;
    const snap = bootRef.current;

    if (!snap) {
      setZoom(CROP_ZOOM_MIN);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setFlipH(false);
      setFrameReady(true);
      return;
    }

    setZoom(snap.zoom);
    setRotation(snap.rotation);
    setFlipH(snap.flipHorizontal);
    setOffset(
      clampCropOffset(
        snap.offsetXRatio * stageSize,
        snap.offsetYRatio * stageSize,
        snap.zoom,
        snap.rotation,
        natural,
        stageSize,
      ),
    );
    setFrameReady(true);
  }, [natural, stageSize]);

  const canPan =
    frameReady &&
    Boolean(natural) &&
    stageSize > 0 &&
    (() => {
      if (!natural) return false;
      const fit = fitScaleFor(natural.w, natural.h, rotation, stageSize);
      const scale = fit * zoom;
      const { width, height } = rotatedSize(natural.w, natural.h, rotation);
      return (
        Math.abs(width * scale - stageSize) > 0.5 ||
        Math.abs(height * scale - stageSize) > 0.5
      );
    })();

  const onZoomChange = (next: number) => {
    const z = Math.min(CROP_ZOOM_MAX, Math.max(CROP_ZOOM_MIN, next));
    setZoom(z);
    setOffset((prev) => clamp(prev.x, prev.y, z, rotation));
  };

  const rotate90 = () => {
    const next = (rotation + 90) % 360;
    setRotation(next);
    setOffset((prev) => clamp(prev.x, prev.y, zoom, next));
  };

  const handleReset = () => {
    setZoom(CROP_ZOOM_MIN);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset(
      clamp(
        drag.origX + (e.clientX - drag.startX),
        drag.origY + (e.clientY - drag.startY),
        zoom,
        rotation,
      ),
    );
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const handleConfirm = async () => {
    if (busy || !natural || stageSize < 1 || !frameReady) return;
    setBusy(true);
    setError(null);
    try {
      const outputSrc = await renderViewportSquare({
        src: sourceSrc,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
        rotation,
        flipHorizontal: flipH,
        stageSize,
      });
      const crop = {
        zoom,
        offsetXRatio: offset.x / stageSize,
        offsetYRatio: offset.y / stageSize,
        rotation,
        flipHorizontal: flipH,
      };
      onConfirm({
        mode: zoom <= CROP_ZOOM_MIN + 0.02 ? "fit" : "closeup",
        rotation,
        flipHorizontal: flipH,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
        stageSize,
        outputSrc,
        crop,
      });
    } catch {
      setBusy(false);
      setError("トリミングに失敗しました。別の画像で試すか、再度お試しください。");
    }
  };

  const imgStyle =
    natural && stageSize > 0
      ? (() => {
          const fit = fitScaleFor(natural.w, natural.h, rotation, stageSize);
          const scale = fit * zoom;
          return {
            width: natural.w * scale,
            height: natural.h * scale,
            transform: [
              `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              `rotate(${rotation}deg)`,
              `scaleX(${flipH ? -1 : 1})`,
            ].join(" "),
          } as const;
        })()
      : undefined;

  return (
    <ModalDialog
      open
      title="画像をトリミング"
      onClose={onClose}
      size="lg"
      scrollBody={false}
      showCloseButton={false}
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text disabled:opacity-50"
          >
            キャンセル
          </button>
          <PrimaryButton
            className="min-h-11 flex-[1.4]"
            onClick={() => void handleConfirm()}
            disabled={busy || !natural || !frameReady}
          >
            {busy ? "処理中…" : "確定"}
          </PrimaryButton>
        </div>
      }
    >
      {error ? (
        <p className="mt-2 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div
        ref={stageRef}
        className={`relative mx-auto mt-3 aspect-square w-full max-w-[min(24rem,calc(100dvh-16rem))] overflow-hidden bg-neutral-100 ${
          canPan ? "cursor-grab touch-none active:cursor-grabbing" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {frameReady ? (
          // eslint-disable-next-line @next/next/no-img-element -- パン／ズーム用プレビュー
          <img
            src={sourceSrc}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={imgStyle}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-kr-muted">
            読み込み中…
          </div>
        )}
      </div>

      <ImageCropToolbar
        zoom={zoom}
        flipHorizontal={flipH}
        onZoomChange={onZoomChange}
        onRotate90={rotate90}
        onToggleFlip={() => setFlipH((v) => !v)}
        onResetFrame={handleReset}
      />
      <p className="mt-2 text-center text-[11px] text-kr-muted">
        初期に戻すは枠のリセットのみ。保存するには確定を押してください
      </p>
    </ModalDialog>
  );
}

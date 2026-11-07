"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronNext, ChevronPrev } from "./icons/ChevronIcons";
import { TileImage } from "@/base/TileImage";

type Props = {
  images: string[];
  alt: string;
};

const SNAP_RATIO = 0.22;
const SNAP_MS = 240;

/**
 * RoomClip 系のシンプル切替：画像はそのまま動かし、切替でグレーを挟まない。
 * PC はホバー時のみ薄い矢印。
 * 隣スライドは幅確定後にだけマウント（初期 width=0 だと ±1px で重なりチラつく）。
 */
export function ImageCarousel({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [width, setWidth] = useState(0);
  /** 1枚目が表示できてから隣を先読み（帯域を奪わない） */
  const [readyForNeighbors, setReadyForNeighbors] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const offsetRef = useRef(0);
  const dragged = useRef(false);
  const settleTimer = useRef(0);

  const total = images.length;
  offsetRef.current = offsetX;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setIndex(0);
    setOffsetX(0);
    setDragging(false);
    setAnimating(false);
    setReadyForNeighbors(false);
  }, [images]);

  /** onLoad が欠ける場合の保険（隣だけ先読み再開） */
  useEffect(() => {
    if (readyForNeighbors || total <= 1) return;
    const timer = window.setTimeout(() => setReadyForNeighbors(true), 500);
    return () => window.clearTimeout(timer);
  }, [readyForNeighbors, total, images]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const settleTo = useCallback((target: number, nextIndex: number | null) => {
    setAnimating(true);
    setDragging(false);
    setOffsetX(target);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (nextIndex != null) setIndex(nextIndex);
      setOffsetX(0);
      setAnimating(false);
      dragged.current = false;
    }, SNAP_MS);
  }, []);

  if (total === 0) return null;

  const sized = width > 0;
  const w = sized ? width : 1;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;
  const canSlide = total > 1;
  const showNeighbors = canSlide && sized && readyForNeighbors;

  const goPrev = () => {
    if (!canSlide || animating || !sized) return;
    settleTo(w, prevIndex);
  };
  const goNext = () => {
    if (!canSlide || animating || !sized) return;
    settleTo(-w, nextIndex);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlide || animating || !sized) return;
    if ((e.target as HTMLElement | null)?.closest?.("[data-carousel-nav]")) {
      return;
    }
    startX.current = e.clientX;
    dragged.current = false;
    setDragging(true);
    setAnimating(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) dragged.current = true;
    setOffsetX(dx);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    const dx = offsetRef.current;
    const threshold = w * SNAP_RATIO;
    const wasDrag = dragged.current;
    setDragging(false);

    if (Math.abs(dx) >= threshold) {
      settleTo(dx < 0 ? -w : w, dx < 0 ? nextIndex : prevIndex);
      return;
    }
    if (wasDrag) {
      settleTo(0, null);
      return;
    }

    setOffsetX(0);
    if (
      canSlide &&
      !animating &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) settleTo(w, prevIndex);
      else settleTo(-w, nextIndex);
    }
  };

  return (
    <div>
      <div
        ref={rootRef}
        className={`group/carousel relative aspect-square w-full overflow-hidden touch-pan-y select-none ${
          canSlide ? (dragging ? "cursor-grabbing" : "md:cursor-grab") : ""
        }`}
        style={{ maxWidth: "var(--kr-detail-hero-max)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        role={canSlide ? "group" : undefined}
        tabIndex={canSlide ? 0 : undefined}
        aria-label={
          canSlide
            ? `画像 ${index + 1} / ${total}（ドラッグまたはクリックで切替）`
            : alt
        }
        onKeyDown={(e) => {
          if (!canSlide || animating) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            goNext();
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            goPrev();
          }
        }}
      >
        {showNeighbors ? (
          <Slide
            key={`p-${prevIndex}-${images[prevIndex]}`}
            src={images[prevIndex]}
            alt=""
            x={offsetX - w}
            live={dragging}
            snap={animating}
            hidden
          />
        ) : null}
        <Slide
          key={`c-${index}-${images[index]}`}
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          x={offsetX}
          live={dragging}
          snap={animating}
          priority
          onReady={() => setReadyForNeighbors(true)}
        />
        {showNeighbors ? (
          <Slide
            key={`n-${nextIndex}-${images[nextIndex]}`}
            src={images[nextIndex]}
            alt=""
            x={offsetX + w}
            live={dragging}
            snap={animating}
            hidden
          />
        ) : null}
        {canSlide ? (
          <>
            <NavButton side="prev" onClick={goPrev} />
            <NavButton side="next" onClick={goNext} />
          </>
        ) : null}
      </div>

      <div className="mt-3 flex h-2 items-center justify-center gap-1.5">
        {canSlide
          ? images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (animating || i === index || !sized) return;
                  setIndex(i);
                  setOffsetX(0);
                }}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "scale-110 bg-kr-navy" : "bg-kr-muted/50"
                }`}
                aria-label={`画像 ${i + 1}`}
                aria-current={i === index}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "prev" | "next";
  onClick: () => void;
}) {
  const prev = side === "prev";
  return (
    <button
      type="button"
      data-carousel-nav
      aria-label={prev ? "前の画像" : "次の画像"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`tile-overlay-btn absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 opacity-0 transition group-hover/carousel:opacity-100 md:flex ${
        prev ? "left-2" : "right-2"
      }`}
    >
      {prev ? (
        <ChevronPrev className="h-5 w-5" />
      ) : (
        <ChevronNext className="h-5 w-5" />
      )}
    </button>
  );
}

function Slide({
  src,
  alt,
  x,
  live,
  snap,
  priority,
  hidden,
  onReady,
}: {
  src: string;
  alt: string;
  x: number;
  live: boolean;
  snap: boolean;
  priority?: boolean;
  hidden?: boolean;
  onReady?: () => void;
}) {
  return (
    <div
      className="absolute inset-0"
      aria-hidden={hidden}
      style={{
        transform: `translate3d(${x}px, 0, 0)`,
        transition: live
          ? "none"
          : snap
            ? `transform ${SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "none",
        willChange: "transform",
      }}
    >
      <TileImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 767px) 100vw, 560px"
        className="pointer-events-none object-cover"
        draggable={false}
        onLoad={() => onReady?.()}
      />
    </div>
  );
}

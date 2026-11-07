"use client";

import {
  collageGridForCount,
  TEMP_COORDINATE_ITEM_MAX,
} from "@/lib/temp-coordinate-collage";

type Props = {
  urls: string[];
  alt?: string;
  /** タイル用（親の tile-thumb 内）か、詳細ヒーロー用か */
  variant?: "tile" | "hero";
  className?: string;
};

/**
 * 仮コーデ用：紐付けアイテムサムネの合成表示。
 * 1〜4枚 → 2×2、5〜9枚 → 3×3。外周は紺枠。
 */
export function ItemCollageThumb({
  urls,
  alt = "",
  variant = "tile",
  className = "",
}: Props) {
  const list = urls.filter(Boolean).slice(0, TEMP_COORDINATE_ITEM_MAX);
  const grid = collageGridForCount(list.length);
  const cells = grid * grid;
  const border =
    variant === "hero"
      ? "border-[6px] border-kr-navy sm:border-8"
      : "border-[3px] border-kr-navy";

  return (
    <span
      className={`absolute inset-0 grid overflow-hidden bg-kr-navy ${border} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${grid}, minmax(0, 1fr))`,
        gap: variant === "hero" ? 3 : 2,
      }}
      role="img"
      aria-label={alt || "アイテム合成サムネ"}
    >
      {Array.from({ length: cells }, (_, i) => {
        const src = list[i];
        return (
          <span
            key={i}
            className="relative min-h-0 min-w-0 overflow-hidden bg-[#e8ecef]"
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- 合成セルは同一オリジン制約を避ける
              <img
                src={src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

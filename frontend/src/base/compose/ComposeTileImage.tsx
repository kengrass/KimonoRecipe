"use client";

import Image from "next/image";
import { USE_SPIKE_API } from "@/lib/config";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  /** cover（既定）= 正方形切り出し見え / contain = 全体表示 */
  fit?: "cover" | "contain";
  className?: string;
};

/**
 * タイル用画像。
 * blob / spike `/media`（Cookie 必須）は next/image 最適化を外す。
 */
export function ComposeTileImage({
  src,
  alt,
  sizes = "(max-width: 640px) 33vw, 180px",
  fit = "cover",
  className,
}: Props) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const remoteHttp = src.startsWith("http://") || src.startsWith("https://");
  const knownCdn =
    src.includes("cloudfront.net") || src.includes("kimonorecipe.com");
  const hasQuery = src.includes("?");
  const spikeMedia =
    USE_SPIKE_API &&
    (src.startsWith("/media/") || src.includes("/media/"));
  const unoptimized =
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    hasQuery ||
    spikeMedia ||
    (remoteHttp && !knownCdn);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className ? `${fitClass} ${className}` : fitClass}
      unoptimized={unoptimized}
    />
  );
}

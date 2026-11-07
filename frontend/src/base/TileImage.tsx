"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { USE_SPIKE_API } from "@/lib/config";

/**
 * 取得が遅いときだけ下地を出す。
 * 速い／キャッシュ済みではグレーを挟まない（最短表示時間なし）。
 */
const WAIT_BG_AFTER_MS = 120;

type Props = Omit<ImageProps, "placeholder" | "blurDataURL">;

export function TileImage({ onLoad, className, src, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [showWait, setShowWait] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setShowWait(false);
    const timer = window.setTimeout(() => {
      setShowWait(true);
    }, WAIT_BG_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [src]);

  const srcStr = typeof src === "string" ? src : "";
  // 仮コーデ追加直後など画像未設定
  if (!srcStr) {
    return (
      <span
        className={`absolute inset-0 bg-[#e8ecef] ${className ?? ""}`}
        aria-hidden
      />
    );
  }
  // spike 試作の外部ダミー URL や未設定ホストで next/image が落ちないようにする
  const remoteHttp =
    srcStr.startsWith("http://") || srcStr.startsWith("https://");
  const knownCdn =
    srcStr.includes("cloudfront.net") || srcStr.includes("kimonorecipe.com");
  // Next Image は localPatterns 未設定の ?query 付きパスを拒否する
  const hasQuery = srcStr.includes("?");
  // spike の /media は非公開時に Cookie 必須。optimizer 経由だと Cookie が乗らないので直読み
  const spikeMedia =
    USE_SPIKE_API &&
    (srcStr.startsWith("/media/") || srcStr.includes("/media/"));
  const unoptimized =
    rest.unoptimized ||
    srcStr.startsWith("data:") ||
    srcStr.startsWith("blob:") ||
    hasQuery ||
    spikeMedia ||
    (remoteHttp && !knownCdn);

  return (
    <>
      {showWait && !loaded ? (
        <span className="absolute inset-0 bg-[#e5e5e5]" aria-hidden />
      ) : null}
      <Image
        {...rest}
        src={src}
        unoptimized={unoptimized}
        className={className}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
    </>
  );
}

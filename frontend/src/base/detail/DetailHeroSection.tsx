"use client";

import { ImageCarousel } from "./ImageCarousel";

type Props = {
  images: string[];
  alt: string;
};

/** 詳細ヒーロー（メイン画像カルーセル） */
export function DetailHeroSection({ images, alt }: Props) {
  return (
    <div
      className="detail-hero-image"
      style={{ maxWidth: "var(--kr-detail-hero-max)" }}
    >
      <ImageCarousel key={images[0] ?? "empty"} images={images} alt={alt} />
    </div>
  );
}

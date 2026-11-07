"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  pickAdForPlacementAsync,
  subscribeAdminAds,
} from "@/lib/admin/ads-store";
import type { AdminAd } from "@/lib/admin/types";
import {
  trackAdEvent,
  type AdPlacement,
} from "@/lib/ad-tracking";

type SponsorAdProps = {
  className?: string;
  placement: AdPlacement;
};

function isRemoteImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

/**
 * 純広告枠。有効案件からランダム1件（同枠の複数販売向け）。
 * 抽選: ads-store。計測: ad-tracking（impression=ビューアブル 50%×1s）。
 * 案件が無いときは何も出さない。管理 UI は base/admin。
 */
export function SponsorAd({ className = "", placement }: SponsorAdProps) {
  const rootRef = useRef<HTMLElement>(null);
  const impressed = useRef(false);
  const [ad, setAd] = useState<AdminAd | null>(null);

  useEffect(() => {
    let cancelled = false;
    const roll = () => {
      void pickAdForPlacementAsync(placement).then((next) => {
        if (!cancelled) setAd(next);
      });
    };
    roll();
    return subscribeAdminAds(roll);
  }, [placement]);

  useEffect(() => {
    impressed.current = false;
  }, [ad?.id]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !ad || impressed.current) return;

    /** IAB 系ビューアブル: 面積の半分以上が連続 1 秒 */
    const VIEWABLE_MS = 1000;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer == null) return;
      clearTimeout(timer);
      timer = null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (impressed.current) return;
        const viewable =
          Boolean(entry?.isIntersecting) &&
          (entry?.intersectionRatio ?? 0) >= 0.5;
        if (!viewable) {
          clearTimer();
          return;
        }
        if (timer != null) return;
        timer = setTimeout(() => {
          timer = null;
          if (impressed.current) return;
          impressed.current = true;
          void trackAdEvent({
            adId: ad.id,
            placement,
            type: "impression",
          });
          observer.disconnect();
        }, VIEWABLE_MS);
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => {
      clearTimer();
      observer.disconnect();
    };
  }, [ad, placement]);

  if (!ad) return null;

  const onClick = () => {
    void trackAdEvent({
      adId: ad.id,
      placement,
      type: "click",
    });
  };

  return (
    <aside
      ref={rootRef}
      className={`sponsor-ad ${className}`.trim()}
      aria-label="スポンサー広告"
      data-ad-id={ad.id}
      data-ad-placement={placement}
    >
      <div className="mx-auto max-w-xs">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-kr-muted">
          広告 · スポンサー
        </p>
        <a
          href={ad.href}
          onClick={onClick}
          className="block overflow-hidden rounded border border-kr-border bg-white"
          target="_blank"
          rel="sponsored noreferrer"
        >
          {isRemoteImage(ad.imageUrl) ? (
            <Image
              src={ad.imageUrl}
              alt={ad.title || ad.name}
              width={320}
              height={320}
              className="h-auto w-full"
              unoptimized
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title || ad.name}
              className="h-auto w-full"
            />
          )}
        </a>
        {ad.title ? (
          <p className="mt-1.5 text-xs text-kr-muted">{ad.title}</p>
        ) : null}
      </div>
    </aside>
  );
}

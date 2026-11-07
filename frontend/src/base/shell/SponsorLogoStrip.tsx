"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadVisibleLogoSponsorsFromApi,
  subscribeLogoSponsors,
} from "@/lib/admin/logo-sponsors-store";
import type { AdminLogoSponsor } from "@/lib/admin/types";
import { APP_ROUTES } from "@/lib/laravel-urls";

/**
 * フッター直上の協賛帯。
 * 説明文は /sponsors。ここはロゴ＋ミニマムな導線のみ。
 */
export function SponsorLogoStrip() {
  const [slots, setSlots] = useState<AdminLogoSponsor[]>([]);

  useEffect(() => {
    const sync = () => {
      void loadVisibleLogoSponsorsFromApi().then(setSlots);
    };
    sync();
    return subscribeLogoSponsors(sync);
  }, []);

  return (
    <aside
      className="border-t border-kr-border bg-kr-bg py-5"
      aria-label="協賛"
    >
      <div className="container-kr">
        <p className="mb-3 text-center text-[11px] font-medium tracking-wide text-kr-muted">
          協賛
        </p>
        {slots.length > 0 ? (
          <ul
            className="mx-auto grid w-full max-w-3xl gap-x-3 gap-y-3"
            style={{
              // 等幅スロットに収め、ロゴ実寸差でも列の中央（3件なら真ん中）が揃う
              gridTemplateColumns: `repeat(${Math.min(slots.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {slots.map((slot) => (
              <li key={slot.id} className="flex min-w-0 items-center justify-center">
                <a
                  href={slot.href}
                  target="_blank"
                  rel="sponsored noreferrer"
                  title={slot.sponsorName}
                  className="inline-flex h-11 w-full max-w-[10rem] items-center justify-center px-1 text-sm tracking-wide text-kr-text/70 transition-opacity hover:text-kr-text hover:opacity-100"
                >
                  {slot.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.logoUrl}
                      alt={slot.sponsorName}
                      className="max-h-11 max-w-full object-contain"
                    />
                  ) : (
                    <span className="truncate text-center">{slot.sponsorName}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <p className={`${slots.length > 0 ? "mt-3" : ""} text-center`}>
          <Link
            href={APP_ROUTES.sponsors}
            className="text-[11px] text-kr-muted hover:text-kr-text hover:underline"
          >
            協賛について
          </Link>
        </p>
      </div>
    </aside>
  );
}

"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { ListFocusRestore } from "@/base/ListFocusRestore";
import { MockAuthBar } from "@/base/dev/MockAuthBar";
import { SpikeAuthBar } from "@/base/dev/SpikeAuthBar";
import { NavProgress } from "@/base/shell/NavProgress";
import { UsageBeacon } from "@/base/shell/UsageBeacon";
import { SHOW_MOCK_DEV_CHROME, USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SponsorLogoStrip } from "./SponsorLogoStrip";

const CHROME_STICKY_VAR = "--kr-aside-sticky-top";

type Props = {
  children: ReactNode;
  homeHref?: string;
  searchHref?: string;
};

/**
 * Next のサイトシェル（Header／Footer／協賛帯／開発バー）。
 * PV は子の UsageBeacon。一覧フォーカス復帰は ListFocusRestore。
 */
export function SiteChrome({
  children,
  homeHref = APP_ROUTES.home,
  searchHref = APP_ROUTES.search,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        CHROME_STICKY_VAR,
        `${height}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty(CHROME_STICKY_VAR);
    };
  }, []);

  return (
    <>
      <div ref={ref} className="sticky top-0 z-40">
        {SHOW_MOCK_DEV_CHROME ? (
          <Suspense fallback={null}>
            <MockAuthBar />
          </Suspense>
        ) : null}
        {USE_SPIKE_API ? (
          <Suspense fallback={null}>
            <SpikeAuthBar />
          </Suspense>
        ) : null}
        <NavProgress />
        <Header homeHref={homeHref} searchHref={searchHref} />
      </div>
      <Suspense fallback={null}>
        <UsageBeacon />
      </Suspense>
      <main className="relative flex-1 pt-[var(--kr-main-pad-y)] md:pt-[var(--kr-main-pad-y-md)] pb-4 md:pb-6">
        <ListFocusRestore />
        {children}
      </main>
      <SponsorLogoStrip />
      <Footer />
    </>
  );
}

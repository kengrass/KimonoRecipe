"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** 遷移中の細いプログレスバー（リンク押下から表示） */
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const el = (e.target as Element | null)?.closest?.("a");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        return;
      }
      let path = href;
      if (href.startsWith(window.location.origin)) {
        path = href.slice(window.location.origin.length) || "/";
      }
      path = path.split("?")[0]?.split("#")[0] || "/";
      if (path === pathname) return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const done = window.setTimeout(() => setActive(false), 120);
    return () => window.clearTimeout(done);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const failsafe = window.setTimeout(() => setActive(false), 1200);
    return () => window.clearTimeout(failsafe);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
      aria-hidden
    >
      <div className="h-full w-full origin-left animate-[progress_700ms_ease-out] bg-kr-teal" />
    </div>
  );
}

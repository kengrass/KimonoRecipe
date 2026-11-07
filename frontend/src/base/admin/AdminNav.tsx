"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "統計", exact: true },
  { href: "/admin/users", label: "ユーザー", exact: false },
  { href: "/admin/sponsors", label: "スポンサー", exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="運営メニュー"
      className="flex min-w-0 items-stretch gap-0 overflow-x-auto"
    >
      {ADMIN_NAV_LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-tab shrink-0 border-0 border-b-2 bg-transparent px-3 py-2.5 text-[15px] font-bold transition-colors ${
              active
                ? "border-[var(--fg)] text-[color:var(--fg)]"
                : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--fg)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useMockAuth } from "@/lib/auth";
import { APP_ROUTES, LARAVEL } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";

type Props = {
  open: boolean;
  onClose: () => void;
};

const INFO_LINKS = [
  { href: LARAVEL.about, label: "きものレシピとは？" },
] as const;

const ENTER_MS = 220;
const EXIT_MS = 180;

const itemClass =
  "block rounded px-3 py-2.5 text-sm text-kr-text hover:bg-neutral-100";
const itemStrongClass = `${itemClass} font-medium`;

/** ヘッダー左ハンバーガーのサイドメニュー */
export function SiteMenu({ open, onClose }: Props) {
  const { isLoggedIn, currentUser } = useMockAuth();
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setEntered(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const duration = entered ? ENTER_MS : EXIT_MS;
  const mypageHref = currentUser
    ? userProfilePath(currentUser.id)
    : APP_ROUTES.search;

  return (
    <div className="fixed inset-0 z-[55]" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 transition-opacity ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${duration}ms` }}
        aria-label="メニューを閉じる"
        onClick={onClose}
      />
      <nav
        aria-label="サイトメニュー"
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl transition-transform ease-out ${
          entered ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        <div className="flex h-14 items-center justify-between border-b border-kr-border px-4">
          <p className="text-sm font-semibold text-kr-text">メニュー</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-kr-muted hover:bg-neutral-100"
          >
            閉じる
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {isLoggedIn ? (
            <div className="mb-3 space-y-1 border-b border-kr-border px-2 pb-3">
              <p className="px-2 pb-1 text-xs text-kr-muted">
                {currentUser?.name}
                {currentUser ? " としてログイン中" : "ログイン中"}
              </p>
              <MenuNavLink href={mypageHref} onClick={onClose} strong>
                自分の投稿
              </MenuNavLink>
              <MenuNavLink
                href={APP_ROUTES.likes}
                onClick={onClose}
                strong
              >
                お気に入りした投稿
              </MenuNavLink>
              <MenuNavLink
                href={APP_ROUTES.following}
                onClick={onClose}
                strong
              >
                フォローした人の投稿
              </MenuNavLink>
              <MenuNavLink
                href={APP_ROUTES.unusedImages}
                onClick={onClose}
                strong
              >
                未使用画像
              </MenuNavLink>

              <MenuNavLink
                href={APP_ROUTES.profileSettings}
                onClick={onClose}
              >
                設定
              </MenuNavLink>
            </div>
          ) : (
            <div className="mb-3 space-y-1 border-b border-kr-border px-2 pb-3">
              <MenuNavLink href={APP_ROUTES.login} onClick={onClose} strong>
                ログイン
              </MenuNavLink>
              <MenuNavLink href={APP_ROUTES.regist} onClick={onClose} strong>
                新規登録
              </MenuNavLink>
            </div>
          )}

          <ul className="space-y-0.5 px-2">
            {INFO_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={itemClass}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}

function MenuNavLink({
  href,
  onClick,
  strong,
  children,
}: {
  href: string;
  onClick: () => void;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={strong ? itemStrongClass : itemClass}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}


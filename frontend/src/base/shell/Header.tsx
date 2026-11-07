"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { UserAvatar } from "@/base/ui/UserAvatar";
import { NewPostDialog } from "@/base/shell/NewPostDialog";
import { SiteMenu } from "@/base/shell/SiteMenu";
import { useMockAuth } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";

const iconBtn =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded hover:bg-white/10";

/**
 * コンパクト切替のヒステリシス。
 * ヘッダー高さ変化（h-14→h-11 で約12px）で scrollY が閾値を行き来し、
 * 伸び縮みが振動するのを防ぐ。
 */
const COMPACT_ON_Y = 48;
const COMPACT_OFF_Y = 12;

type Props = {
  homeHref?: string;
  searchHref?: string;
};

/** Next 用ヘッダー */
export function Header({
  homeHref = APP_ROUTES.home,
  searchHref = APP_ROUTES.search,
}: Props) {
  const pathname = usePathname();
  const { isLoggedIn, currentUser } = useMockAuth();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact((prev) => {
        if (!prev && y > COMPACT_ON_Y) return true;
        if (prev && y < COMPACT_OFF_Y) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogoClick = (e: React.MouseEvent) => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (pathname === homeHref) e.preventDefault();
  };

  const logoClass = `font-medium tracking-wide transition-all ${
    compact ? "text-base" : "text-lg"
  }`;

  const mypageHref = currentUser
    ? userProfilePath(currentUser.id)
    : searchHref;

  return (
    <>
      <header className="bg-kr-navy text-white shadow-sm">
        <div
          className={`container-kr container-kr--bar grid grid-cols-[1fr_auto] items-center gap-2 transition-[height] duration-200 md:grid-cols-[1fr_auto_1fr] ${
            compact ? "h-11" : "h-14"
          }`}
        >
          <div className="flex min-w-0 items-center justify-self-start gap-2">
            <button
              type="button"
              className={iconBtn}
              aria-label={menuOpen ? "メニューを閉じる" : "メニュー"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
            <Link
              href={homeHref}
              className={`truncate md:hidden ${logoClass}`}
              aria-label="トップへ"
              onClick={onLogoClick}
            >
              Kimono Recipe
            </Link>
          </div>

          <Link
            href={homeHref}
            className={`hidden justify-self-center md:inline ${logoClass}`}
            aria-label="トップへ"
            onClick={onLogoClick}
          >
            Kimono Recipe
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-0.5 justify-self-end sm:gap-1">
            <IconLink href={searchHref} label="検索" title="検索">
              <SearchIcon />
            </IconLink>

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setPostOpen(true)}
                  className={iconBtn}
                  aria-label="新規投稿"
                  title="新規投稿"
                >
                  <PlusIcon />
                </button>
                <IconLink
                  href={mypageHref}
                  label={`${currentUser?.name ?? "会員"}のマイページ`}
                  title={`${currentUser?.name ?? "会員"}（マイページ）`}
                >
                  {currentUser ? (
                    <UserAvatar
                      name={currentUser.name}
                      seed={currentUser.id}
                      src={currentUser.avatar_url}
                      className="h-7 w-7 text-[11px]"
                    />
                  ) : (
                    <PersonIcon />
                  )}
                </IconLink>
              </>
            ) : (
              <>
                <Link
                  href={APP_ROUTES.login}
                  className="hidden truncate rounded px-2 py-1.5 text-sm hover:bg-white/10 sm:inline"
                >
                  ログイン / 新規登録
                </Link>
                <Link
                  href={APP_ROUTES.login}
                  className={`${iconBtn} sm:hidden`}
                  aria-label="ログイン / 新規登録"
                >
                  <PersonIcon />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <NewPostDialog open={postOpen} onClose={() => setPostOpen(false)} />
    </>
  );
}

function IconLink({
  href,
  label,
  title,
  children,
}: {
  href: string;
  label: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={iconBtn} aria-label={label} title={title}>
      {children}
    </Link>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span
        className={`absolute left-0 block h-0.5 w-5 origin-center bg-white transition-transform duration-200 ease-out ${
          open
            ? "top-1/2 -translate-y-1/2 rotate-45"
            : "top-0 translate-y-0 rotate-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-white transition-opacity duration-150 ease-out ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-5 origin-center bg-white transition-transform duration-200 ease-out ${
          open
            ? "top-1/2 -translate-y-1/2 -rotate-45"
            : "bottom-0 translate-y-0 rotate-0"
        }`}
      />
    </span>
  );
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function SearchIcon() {
  return (
    <SvgIcon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </SvgIcon>
  );
}

function PlusIcon() {
  return (
    <SvgIcon>
      <path d="M12 5v14M5 12h14" />
    </SvgIcon>
  );
}

function PersonIcon() {
  return (
    <SvgIcon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </SvgIcon>
  );
}

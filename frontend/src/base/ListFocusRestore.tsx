"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { BrowseKind } from "@/lib/browse";
import { parseStoredContentKind } from "@/lib/content-kind";
import {
  clearDetailBrowse,
  readDetailBrowse,
  rememberDetailBrowse,
  type DetailBrowseSession,
} from "@/lib/detail-browse";

const RETURN_KEY = "kr-list-return";
const DETAIL_STACK_KEY = "kr-detail-back-stack";

type ListReturn = {
  kind: BrowseKind;
  id: string;
  /** 一覧の path + search（例: `/` `/search?m=c` `/m/[id]`） */
  path: string;
  scrollY: number;
};

/** 詳細サーフィン用。戻る先の詳細 URL と、その時点の前後ナビ文脈 */
type DetailBackEntry = {
  href: string;
  browse: DetailBrowseSession | null;
};

export type BrowseBack = {
  href: string;
  /** 一覧へ →「一覧」、一つ前の詳細へ →「戻る」 */
  label: "一覧" | "戻る";
};

function listPathFromLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function readReturn(): ListReturn | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListReturn;
    const kind = parseStoredContentKind(parsed.kind);
    if (
      kind &&
      parsed.id &&
      typeof parsed.path === "string" &&
      typeof parsed.scrollY === "number"
    ) {
      return { ...parsed, kind };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeReturn(data: ListReturn) {
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function clearReturn() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
}

function readDetailStack(): DetailBackEntry[] {
  try {
    if (typeof sessionStorage === "undefined") return [];
    const raw = sessionStorage.getItem(DETAIL_STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DetailBackEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.href === "string" && e.href.startsWith("/"),
    );
  } catch {
    return [];
  }
}

function writeDetailStack(stack: DetailBackEntry[]) {
  try {
    if (stack.length === 0) {
      sessionStorage.removeItem(DETAIL_STACK_KEY);
      return;
    }
    sessionStorage.setItem(DETAIL_STACK_KEY, JSON.stringify(stack));
  } catch {
    /* ignore */
  }
}

function clearDetailStack() {
  writeDetailStack([]);
}

/** ロゴ等：一覧フォーカス復元を破棄してトップへ戻すとき用 */
export function clearListReturn() {
  clearReturn();
  clearDetailStack();
}

/**
 * BrowseBar 用の戻り先。
 * 詳細サーフィン中は一つ前の詳細、否则は入った一覧（なければ `/`）。
 */
export function readBrowseBack(): BrowseBack {
  const stack = readDetailStack();
  if (stack.length > 0) {
    return { href: stack[stack.length - 1].href, label: "戻る" };
  }
  return { href: readReturn()?.path ?? "/", label: "一覧" };
}

/** @deprecated readBrowseBack を使う */
export function readListReturnPath(): string | null {
  return readBrowseBack().href;
}

/**
 * 一覧タイルクリック時：位置・フォーカス・戻り先パスをまとめて保存。
 * 詳細サーフィン履歴はリセットする。
 * @param path 省略時は現在の一覧 URL。ヘッダー＋など別画面からの作成時は明示する。
 */
export function rememberListFocus(
  kind: BrowseKind,
  id: string,
  path: string = listPathFromLocation(),
) {
  clearDetailStack();
  writeReturn({
    kind,
    id,
    path,
    scrollY: path === listPathFromLocation() ? window.scrollY : 0,
  });
}

/**
 * 詳細内の関連・構成アイテムへ進む直前：
 * いまの詳細を「戻る」スタックに積む（一覧戻りは保持）。
 */
export function pushDetailBack() {
  const stack = readDetailStack();
  const href = listPathFromLocation();
  if (stack.length > 0 && stack[stack.length - 1].href === href) return;
  stack.push({
    href,
    browse: readDetailBrowse(),
  });
  writeDetailStack(stack);
}

/**
 * 「一覧／戻る」クリック時：スタックを消費し、必要なら前後ナビ文脈を復元。
 * 戻り先 href を返す。
 */
export function consumeBrowseBack(): string {
  const stack = readDetailStack();
  if (stack.length > 0) {
    const entry = stack.pop()!;
    writeDetailStack(stack);
    if (entry.browse) {
      rememberDetailBrowse(entry.browse);
    } else {
      clearDetailBrowse();
    }
    return entry.href;
  }
  clearDetailBrowse();
  return readReturn()?.path ?? "/";
}

/**
 * 詳細内の前後移動時：見ていた投稿 ID だけ更新（一覧スクロールは壊さない）。
 */
export function updateListFocus(kind: BrowseKind, id: string) {
  const prev = readReturn();
  if (prev) {
    writeReturn({ ...prev, kind, id });
    return;
  }
  writeReturn({
    kind,
    id,
    path: "/",
    scrollY: 0,
  });
}

/** 前後ナビ共通：フォーカス追跡する場合だけ ID を更新 */
export function markBrowseNeighbor(
  kind: BrowseKind,
  item: { id: string } | null | undefined,
  trackListFocus: boolean,
) {
  if (!item || !trackListFocus) return;
  updateListFocus(kind, item.id);
}

function applyFocus(el: HTMLElement) {
  el.classList.add("tile-focus");
  const link = el.querySelector<HTMLElement>("a");
  link?.focus({ preventScroll: true });
  window.setTimeout(() => el.classList.remove("tile-focus"), 1800);
}

/**
 * 詳細から戻ったとき、見ていたタイルへスクロール＆ハイライト。
 * レイアウト確定前は短くリトライする。
 */
export function ListFocusRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const data = readReturn();
    if (!data) return;

    // 詳細サーフィン中に一覧へ戻っていない
    if (readDetailStack().length > 0) return;
    if (listPathFromLocation() !== data.path) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;
    const timers: number[] = [];

    const tryRestore = () => {
      if (cancelled) return;

      const el = document.getElementById(`tile-${data.kind}-${data.id}`);
      if (el) {
        el.scrollIntoView({
          block: "center",
          behavior: "instant" as ScrollBehavior,
        });
        applyFocus(el);
        clearReturn();
        return;
      }

      if (attempts === 0 && data.scrollY > 0) {
        window.scrollTo({
          top: data.scrollY,
          behavior: "instant" as ScrollBehavior,
        });
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearReturn();
        return;
      }
      timers.push(window.setTimeout(tryRestore, 50));
    };

    const raf = window.requestAnimationFrame(() => tryRestore());
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}

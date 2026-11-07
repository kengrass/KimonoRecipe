"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 下部固定（スクロール外）。確定ボタンなど */
  footer?: ReactNode;
  /**
   * default: 左寄せタイトル＋「閉じる」テキスト（ログイン誘導など）
   * sheet: 中央タイトル＋アイコン閉じる（シェアなど）
   */
  layout?: "default" | "sheet";
  /** md: 誘導系。lg / xl: 紐付けタイルなど広いパネル */
  size?: "md" | "lg" | "xl";
  /**
   * false: 外側・本文とも縦スクロールしない（クロップなど1画面完結向け）。
   * 既定 true。
   */
  scrollBody?: boolean;
  /**
   * false: ヘッダーの閉じる／× を出さない（フッタのキャンセルと重複させない用）。
   * 既定 true。Esc・背景タップは onClose のまま。
   */
  showCloseButton?: boolean;
};

/** 簡易モーダル（ログイン誘導・新規投稿・シェアなど） */
export function ModalDialog({
  open,
  title,
  onClose,
  children,
  footer,
  layout = "default",
  size = "md",
  scrollBody = true,
  showCloseButton = true,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const sheet = layout === "sheet";
  const widthClass =
    size === "xl" ? "max-w-xl" : size === "lg" ? "max-w-lg" : "max-w-md";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const bodyOverflow = scrollBody
    ? "overflow-y-auto overscroll-contain"
    : "overflow-hidden";

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 ${
        scrollBody ? "overflow-y-auto" : "overflow-hidden"
      }`}
    >
      <button
        type="button"
        className={`absolute inset-0 ${sheet ? "bg-black/50" : "bg-black/40"}`}
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={
          sheet
            ? `relative z-[61] my-auto flex max-h-[calc(100dvh-1.5rem)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl bg-white outline-none`
            : `relative z-[61] my-auto flex max-h-[calc(100dvh-1.5rem)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl bg-white shadow-lg outline-none`
        }
      >
        {sheet ? (
          <div className="relative flex shrink-0 items-center justify-center px-6 pb-3 pt-5 sm:px-7 sm:pt-6">
            <h2
              id={titleId}
              className="text-sm font-semibold tracking-tight text-kr-text"
            >
              {title}
            </h2>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-kr-muted hover:bg-neutral-100 hover:text-kr-text sm:right-5"
                aria-label="閉じる"
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
            <h2 id={titleId} className="text-base font-semibold text-kr-text">
              {title}
            </h2>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="-mr-1 -mt-0.5 rounded px-2.5 py-1.5 text-sm text-kr-muted hover:bg-neutral-100 hover:text-kr-text"
              >
                閉じる
              </button>
            ) : null}
          </div>
        )}
        <div
          className={
            sheet
              ? `min-h-0 flex-1 ${bodyOverflow} px-6 pb-4 sm:px-7 sm:pb-5`
              : `min-h-0 flex-1 ${bodyOverflow} px-5 pb-4 sm:px-6 sm:pb-5`
          }
        >
          {children}
        </div>
        {footer ? (
          <div
            className={
              sheet
                ? "shrink-0 border-t border-kr-border px-6 py-3 sm:px-7"
                : "shrink-0 border-t border-kr-border px-5 py-3 sm:px-6"
            }
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

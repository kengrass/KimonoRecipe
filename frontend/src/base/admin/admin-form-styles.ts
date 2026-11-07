/** 管理フォーム／一覧の共通クラス（広告・協賛・ユーザーで揃える） */

/** 入力コントロール本体（ラベル横並びの詳細画面向け） */
export const ADMIN_CONTROL =
  "w-full rounded-md border border-kr-border bg-white px-3 py-2.5 text-[15px] text-kr-text outline-none transition-colors placeholder:text-kr-muted/70 focus:border-kr-navy";

/** ラベル直下の入力（登録フォーム向け） */
export const ADMIN_FIELD = `mt-1.5 ${ADMIN_CONTROL}`;

export const ADMIN_LABEL = "block text-[13px] font-medium text-kr-muted";

/**
 * 入力フォームの箱。
 * シェル（max-w-6xl）いっぱいまで伸ばさず、読みやすい入力幅で中央寄せ。
 * 一覧テーブルは別途フル幅のままにする。
 */
export const ADMIN_FORM_SHELL =
  "mx-auto max-w-xl space-y-5 rounded-md border border-kr-border bg-white px-4 py-5 sm:px-5";

/** 詳細パネルなど、フォーム以外の白箱 */
export const ADMIN_PANEL =
  "rounded-md border border-kr-border bg-white px-4 py-5 sm:px-5";

export const ADMIN_BTN_PRIMARY =
  "rounded-md bg-kr-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-kr-navy/90";

export const ADMIN_BTN_SECONDARY =
  "rounded-md border border-kr-border bg-white px-4 py-2.5 text-sm text-kr-text hover:bg-neutral-50";

export const ADMIN_BTN_DANGER =
  "ml-auto rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm text-red-700 hover:bg-red-50";

export const ADMIN_TABLE_WRAP =
  "overflow-x-auto rounded-md border border-kr-border bg-white";

export const ADMIN_TABLE = "min-w-full text-left text-[15px] text-kr-text";

export const ADMIN_THEAD =
  "border-b border-kr-border bg-[#f7f7f7] text-[13px] text-slate-600";

export const ADMIN_TH = "px-3 py-2.5 font-medium whitespace-nowrap";

export const ADMIN_TR =
  "border-b border-kr-border/80 last:border-0 hover:bg-[#fafafa]";

export const ADMIN_TD = "px-3 py-3 align-middle";

export const ADMIN_LINK_ACTION =
  "text-kr-link underline-offset-2 hover:underline";

export const ADMIN_EMPTY =
  "px-4 py-8 text-center text-sm text-kr-muted";

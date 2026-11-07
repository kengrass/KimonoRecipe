"use client";

import { APP_ROUTES } from "@/lib/laravel-urls";
import { ModalDialog } from "./ModalDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  /** いいね／フォロー等の文脈 */
  reason?: "like" | "follow" | "generic";
};

const REASON_COPY: Record<NonNullable<Props["reason"]>, string> = {
  like: "いいね！するためには会員登録が必要です。",
  follow: "フォローするためには会員登録が必要です。",
  generic: "この操作には会員登録が必要です。",
};

/** 未ログイン時の会員誘導（本番の「会員登録／ログイン」相当） */
export function AuthRequiredDialog({
  open,
  onClose,
  reason = "generic",
}: Props) {
  return (
    <ModalDialog open={open} title="会員登録／ログイン" onClose={onClose}>
      <p className="text-sm leading-relaxed text-kr-text/90">
        {REASON_COPY[reason]}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <a
          href={APP_ROUTES.regist}
          className="inline-flex items-center justify-center rounded bg-kr-navy px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          メンバー登録はこちら
        </a>
        <a
          href={APP_ROUTES.login}
          className="inline-flex items-center justify-center rounded border border-kr-navy px-3 py-2.5 text-sm font-medium text-kr-navy hover:bg-neutral-50"
        >
          ログインはこちら
        </a>
      </div>
    </ModalDialog>
  );
}

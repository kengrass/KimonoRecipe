"use client";

import { ModalDialog } from "@/base/ui/ModalDialog";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 強調（破壊的操作） */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 運営管理用の確認ダイアログ（ブラウザ confirm の代わり） */
export function AdminConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ModalDialog
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-kr-border bg-white px-3 py-2 text-[15px] text-kr-text hover:bg-[#f7f7f7]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-3 py-2 text-[15px] font-medium text-white ${
              danger
                ? "bg-red-700 hover:bg-red-800"
                : "bg-kr-navy hover:bg-kr-navy/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-kr-text whitespace-pre-wrap">
        {body}
      </p>
    </ModalDialog>
  );
}

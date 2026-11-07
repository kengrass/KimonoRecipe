"use client";

import { useState, type ReactNode } from "react";
import { ModalDialog } from "@/base/ui/ModalDialog";

/**
 * 投稿・設定フォーム用の Next UI トーン部品。
 * 詳細／マイページ／NewPost の余白・ボタン感に寄せる。
 *
 * 入力系は form-fields、ボタンは form-buttons に分割。
 * ここはページ枠・アクション・再エクスポートの入口。
 */

export {
  ChoiceChips,
  Field,
  FlagToggle,
  GENDER_OPTIONS,
  LabeledWithBadge,
  RequiredLabel,
  SEASON_OPTIONS,
  SeasonCheckboxes,
  Segmented,
  SelectInput,
  TextInput,
  TextTextarea,
  VisibilityBadge,
} from "@/base/form/form-fields";

export {
  AddRowButton,
  EndPrimaryButton,
  IconDeleteButton,
  PrimaryButton,
  SecondaryButton,
} from "@/base/form/form-buttons";

export { useMockFlash } from "@/base/ui/useMockFlash";

/** ページ見出し＋セクション縦間隔 */
export function FormPage({ children }: { children: ReactNode }) {
  return <div className="space-y-8 md:space-y-10">{children}</div>;
}

/** セクション見出し（SectionHeader と同系）＋本文 */
export function SettingsSection({
  title,
  children,
  action,
  id,
}: {
  title: string;
  children: ReactNode;
  /** 見出し右（タブなど） */
  action?: ReactNode;
  /** ディープリンク用 */
  id?: string;
}) {
  return (
    <section id={id} className="page-section scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-kr-text">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function PageTitle({
  children,
  lead,
}: {
  children: ReactNode;
  /** 見出し上の短い案内（戻るリンクなど） */
  lead?: ReactNode;
}) {
  return (
    <header className="space-y-2.5">
      {lead ? <div>{lead}</div> : null}
      <h1 className="text-xl font-bold tracking-tight text-kr-text md:text-2xl">
        {children}
      </h1>
    </header>
  );
}

/** 画像アップロード制限の注記（コーデ／アイテム／未使用で共通）。数値は仮。 */
export function UploadLimitsNote({
  multiSelectTip = false,
}: {
  multiSelectTip?: boolean;
}) {
  return (
    <>
      <p className="text-[11px] leading-relaxed text-kr-muted">
        仮制限: 1枚20MBまで · 一度に10枚まで
      </p>
      {multiSelectTip ? (
        <p className="text-[11px] leading-relaxed text-kr-muted">
          複数選択でコーデ／アイテム作成・削除ができます
        </p>
      ) : null}
    </>
  );
}

/** キャンセル（弱）＋登録（強）。画面末尾用。削除は離して確認付き */
export function FormActions({
  onCancel,
  onSubmit,
  onDelete,
  submitLabel = "登録",
  cancelLabel = "キャンセル",
  deleteLabel = "削除する",
  deleteConfirmTitle = "削除の確認",
  deleteConfirmBody = "この投稿を削除します。よろしいですか？",
}: {
  onCancel: () => void;
  onSubmit: () => void;
  /** 既存編集時のみ。登録フローでは渡さない。確認後に呼ばれる */
  onDelete?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmBody?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-kr-teal px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
      {onDelete ? (
        <div className="mt-10 border-t border-kr-border pt-6">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-full min-h-11 rounded-lg border border-kr-border bg-white text-sm font-medium text-red-600/90 transition hover:border-red-300 hover:bg-red-50"
          >
            {deleteLabel}
          </button>
        </div>
      ) : null}
      <ModalDialog
        open={confirmOpen}
        title={deleteConfirmTitle}
        onClose={() => setConfirmOpen(false)}
        layout="sheet"
        size="md"
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                onDelete?.();
              }}
              className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              削除する
            </button>
          </div>
        }
      >
        <p className="pb-1 text-sm leading-relaxed text-kr-text">
          {deleteConfirmBody}
        </p>
      </ModalDialog>
    </div>
  );
}

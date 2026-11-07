"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { AdminFilePickButton } from "@/base/admin/AdminFilePickButton";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_FIELD,
  ADMIN_FORM_SHELL,
  ADMIN_LABEL,
} from "@/base/admin/admin-form-styles";

export type LogoDraft = {
  sponsorName: string;
  logoUrl: string;
  href: string;
  packageNote: string;
  enabled: boolean;
  startOn: string;
  endOn: string;
};

export function emptyLogoDraft(): LogoDraft {
  return {
    sponsorName: "",
    logoUrl: "",
    href: "https://",
    packageNote: "",
    enabled: true,
    startOn: "",
    endOn: "",
  };
}

type Props = {
  formId: string;
  editingId: string | null;
  draft: LogoDraft;
  setDraft: Dispatch<SetStateAction<LogoDraft>>;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onRequestDelete: () => void;
  onPickImage: (file: File | undefined) => void;
};

/** 協賛ロゴの登録／編集フォーム */
export function LogoSponsorsForm({
  formId,
  editingId,
  draft,
  setDraft,
  onSubmit,
  onCancel,
  onRequestDelete,
  onPickImage,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className={ADMIN_FORM_SHELL}
      aria-labelledby={`${formId}-title`}
    >
      <h3 id={`${formId}-title`} className="text-base font-bold text-kr-text">
        {editingId ? "協賛を編集" : "協賛を登録"}
      </h3>

      <label className={ADMIN_LABEL}>
        スポンサー名
        <input
          required
          value={draft.sponsorName}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, sponsorName: e.target.value }))
          }
          className={ADMIN_FIELD}
        />
      </label>

      <label className={ADMIN_LABEL}>
        リンク URL
        <input
          required
          type="url"
          value={draft.href}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, href: e.target.value }))
          }
          className={ADMIN_FIELD}
        />
      </label>

      <label className={ADMIN_LABEL}>
        営業メモ（任意・非公開）
        <input
          value={draft.packageNote}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, packageNote: e.target.value }))
          }
          placeholder="例: 加工・ケア枠・年間契約"
          className={ADMIN_FIELD}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={ADMIN_LABEL}>
          掲載開始
          <input
            type="date"
            value={draft.startOn}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, startOn: e.target.value }))
            }
            className={ADMIN_FIELD}
          />
        </label>
        <label className={ADMIN_LABEL}>
          掲載終了
          <input
            type="date"
            value={draft.endOn}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, endOn: e.target.value }))
            }
            className={ADMIN_FIELD}
          />
        </label>
      </div>

      <div>
        <p className={ADMIN_LABEL}>ロゴ画像（任意・無ければ社名テキスト）</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <AdminFilePickButton label="画像を選択" onPick={onPickImage} />
          {draft.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.logoUrl}
              alt=""
              className="h-12 max-w-[11rem] object-contain"
            />
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[15px] text-kr-text">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
          }
          className="h-4 w-4 accent-kr-link"
        />
        サイトに表示する
      </label>

      <div className="flex flex-wrap items-center gap-2 border-t border-kr-border pt-4">
        <button type="submit" className={ADMIN_BTN_PRIMARY}>
          {editingId ? "更新" : "登録"}
        </button>
        <button type="button" onClick={onCancel} className={ADMIN_BTN_SECONDARY}>
          キャンセル
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={onRequestDelete}
            className={ADMIN_BTN_DANGER}
          >
            削除
          </button>
        ) : null}
      </div>
    </form>
  );
}

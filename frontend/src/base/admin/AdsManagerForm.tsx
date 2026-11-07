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
import { ADMIN_AD_PLACEMENT_OPTIONS } from "@/lib/admin/ads-store";
import type { AdminAdPlacement } from "@/lib/admin/types";

export type AdsDraft = {
  name: string;
  advertiser: string;
  placements: AdminAdPlacement[];
  href: string;
  imageUrl: string;
  title: string;
  enabled: boolean;
  startOn: string;
  endOn: string;
};

export function emptyAdsDraft(): AdsDraft {
  return {
    name: "",
    advertiser: "",
    placements: ["home_top"],
    href: "https://",
    imageUrl: "",
    title: "",
    enabled: true,
    startOn: "",
    endOn: "",
  };
}

type Props = {
  formId: string;
  editingId: string | null;
  draft: AdsDraft;
  setDraft: Dispatch<SetStateAction<AdsDraft>>;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onRequestDelete: () => void;
  onPickImage: (file: File | undefined) => void;
  togglePlacement: (id: AdminAdPlacement) => void;
};

/** 純広告の登録／編集フォーム */
export function AdsManagerForm({
  formId,
  editingId,
  draft,
  setDraft,
  onSubmit,
  onCancel,
  onRequestDelete,
  onPickImage,
  togglePlacement,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className={ADMIN_FORM_SHELL}
      aria-labelledby={`${formId}-title`}
    >
      <h3 id={`${formId}-title`} className="text-base font-bold text-kr-text">
        {editingId ? "案件を編集" : "広告を登録"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={ADMIN_LABEL}>
          案件名
          <input
            required
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
            className={ADMIN_FIELD}
          />
        </label>
        <label className={ADMIN_LABEL}>
          広告主
          <input
            required
            value={draft.advertiser}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, advertiser: e.target.value }))
            }
            className={ADMIN_FIELD}
            placeholder="レポート宛名"
          />
        </label>
      </div>

      <fieldset>
        <legend className={ADMIN_LABEL}>配信枠（複数可）</legend>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {ADMIN_AD_PLACEMENT_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <label className="flex items-center gap-2 text-[15px] text-kr-text">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-kr-link"
                  checked={draft.placements.includes(opt.id)}
                  onChange={() => togglePlacement(opt.id)}
                />
                {opt.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

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
        見出し（画像下）
        <input
          value={draft.title}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, title: e.target.value }))
          }
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
        <p className={ADMIN_LABEL}>クリエイティブ画像</p>
        <div className="mt-2 flex flex-wrap items-start gap-4">
          <AdminFilePickButton label="画像を選択" onPick={onPickImage} />
          {draft.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.imageUrl}
              alt=""
              className="h-36 w-36 rounded-md border border-kr-border object-cover"
            />
          ) : (
            <p className="pt-2 text-[13px] text-kr-muted">
              未選択（登録時は必須）
            </p>
          )}
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
        配信する
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

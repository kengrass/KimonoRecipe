"use client";

import { useId, type FormEvent } from "react";
import { AdminConfirmDialog } from "@/base/admin/AdminConfirmDialog";
import {
  emptyLogoDraft,
  LogoSponsorsForm,
  type LogoDraft,
} from "@/base/admin/LogoSponsorsForm";
import { LogoSponsorsList } from "@/base/admin/LogoSponsorsList";
import { ADMIN_BTN_PRIMARY } from "@/base/admin/admin-form-styles";
import { useAdminCrudForm } from "@/base/admin/useAdminCrudForm";
import {
  AdminFlashBanner,
  useAdminFlash,
} from "@/base/admin/useAdminFlash";
import { useAdminRowResource } from "@/base/admin/useAdminRowResource";
import {
  loadLogoSponsorsFromApi,
  saveLogoSponsors,
} from "@/lib/admin/logo-sponsors-store";
import type { AdminLogoSponsor } from "@/lib/admin/types";

function newId() {
  return `logo-${Date.now().toString(36)}`;
}

/**
 * 協賛ロゴ（看板）管理。実績レポートなし。
 * 有効件数が0ならサイトのロゴ列は非表示。
 */
export function LogoSponsorsManager() {
  const formId = useId();
  const { flash, showFlash } = useAdminFlash();
  const form = useAdminCrudForm<LogoDraft>(emptyLogoDraft);

  const { rows, persist, removeById } = useAdminRowResource<AdminLogoSponsor>({
    load: loadLogoSponsorsFromApi,
    save: saveLogoSponsors,
    getUrl: (row) => row.logoUrl,
    withUrl: (row, logoUrl) => ({ ...row, logoUrl }),
    loadErrorMessage: "協賛ロゴの読み込みに失敗しました",
    showFlash,
  });

  const openEdit = (row: AdminLogoSponsor) => {
    form.openEditWith(row.id, {
      sponsorName: row.sponsorName,
      logoUrl: row.logoUrl,
      href: row.href,
      packageNote: row.packageNote,
      enabled: row.enabled,
      startOn: row.startOn,
      endOn: row.endOn,
    });
  };

  const onPickImage = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    form.setDraft((prev) => {
      if (prev.logoUrl.startsWith("blob:")) URL.revokeObjectURL(prev.logoUrl);
      return { ...prev, logoUrl: url };
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sponsorName = form.draft.sponsorName.trim();
    const href = form.draft.href.trim();
    if (!sponsorName || !href) {
      showFlash("スポンサー名とリンクは必須です");
      return;
    }

    const draft = form.draft;
    const editingId = form.editingId;
    void (async () => {
      if (editingId) {
        await persist(
          rows.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  sponsorName,
                  logoUrl: draft.logoUrl.trim(),
                  href,
                  packageNote: draft.packageNote.trim(),
                  enabled: draft.enabled,
                  startOn: draft.startOn,
                  endOn: draft.endOn,
                }
              : r,
          ),
          "協賛ロゴを更新しました",
        );
      } else {
        const nextOrder =
          rows.reduce((max, r) => Math.max(max, r.sortOrder), 0) + 1;
        await persist(
          [
            ...rows,
            {
              id: newId(),
              sponsorName,
              logoUrl: draft.logoUrl.trim(),
              href,
              packageNote: draft.packageNote.trim(),
              enabled: draft.enabled,
              startOn: draft.startOn,
              endOn: draft.endOn,
              sortOrder: nextOrder,
            },
          ],
          "協賛ロゴを登録しました",
        );
      }
      form.resetForm();
    })();
  };

  const move = (id: string, dir: -1 | 1) => {
    const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
    const i = sorted.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    void persist(
      sorted.map((r, index) => ({ ...r, sortOrder: index + 1 })),
      "並びを更新しました",
    );
  };

  const confirmDelete = () => {
    if (!form.editingId) return;
    removeById(form.editingId, "削除しました");
    form.resetForm();
  };

  return (
    <div className="space-y-4">
      <AdminFlashBanner flash={flash} />

      <AdminConfirmDialog
        open={form.deleteConfirmOpen}
        title="協賛を削除しますか？"
        body="一覧から消えます。この操作は取り消せません。"
        confirmLabel="削除する"
        danger
        onConfirm={confirmDelete}
        onCancel={() => form.setDeleteConfirmOpen(false)}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl text-[13px] leading-relaxed text-slate-600">
          <p>
            フッター上にロゴ掲載。CTR報告はなしの商品。公開の説明は{" "}
            <a
              href="/sponsors"
              className="text-kr-link hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              /sponsors
            </a>
            。
          </p>
        </div>
        <button
          type="button"
          onClick={form.openCreate}
          className={ADMIN_BTN_PRIMARY}
        >
          協賛を登録
        </button>
      </div>

      {form.formOpen ? (
        <LogoSponsorsForm
          formId={formId}
          editingId={form.editingId}
          draft={form.draft}
          setDraft={form.setDraft}
          onSubmit={onSubmit}
          onCancel={form.resetForm}
          onRequestDelete={() => form.setDeleteConfirmOpen(true)}
          onPickImage={onPickImage}
        />
      ) : null}

      <LogoSponsorsList rows={rows} onEdit={openEdit} onMove={move} />
    </div>
  );
}

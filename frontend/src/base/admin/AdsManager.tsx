"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { AdminConfirmDialog } from "@/base/admin/AdminConfirmDialog";
import {
  AdsManagerForm,
  emptyAdsDraft,
  type AdsDraft,
} from "@/base/admin/AdsManagerForm";
import {
  AdsManagerList,
  type AdsListFilter,
} from "@/base/admin/AdsManagerList";
import { ADMIN_BTN_PRIMARY } from "@/base/admin/admin-form-styles";
import { useAdminCrudForm } from "@/base/admin/useAdminCrudForm";
import {
  AdminFlashBanner,
  useAdminFlash,
} from "@/base/admin/useAdminFlash";
import { useAdminRowResource } from "@/base/admin/useAdminRowResource";
import {
  copyAdvertiserReport,
  isAdDelivering,
  loadAdminAdsFromApi,
  saveAdminAds,
} from "@/lib/admin/ads-store";
import type { AdminAd, AdminAdPlacement } from "@/lib/admin/types";

function newId() {
  return `ad-${Date.now().toString(36)}`;
}

/**
 * 純広告：案件の登録・配信・実績・広告主向け出力を同じ画面で扱う。
 */
export function AdsManager() {
  const formId = useId();
  const { flash, showFlash } = useAdminFlash();
  const form = useAdminCrudForm<AdsDraft>(emptyAdsDraft);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<AdsListFilter>("live");

  const { rows, persist, removeById } = useAdminRowResource<AdminAd>({
    load: loadAdminAdsFromApi,
    save: saveAdminAds,
    getUrl: (ad) => ad.imageUrl,
    withUrl: (ad, imageUrl) => ({ ...ad, imageUrl }),
    loadErrorMessage: "広告案件の読み込みに失敗しました",
    showFlash,
  });

  const visibleRows = useMemo(() => {
    if (listFilter === "all") return rows;
    return rows.filter(isAdDelivering);
  }, [rows, listFilter]);

  const openEdit = (row: AdminAd) => {
    form.openEditWith(row.id, {
      name: row.name,
      advertiser: row.advertiser,
      placements: [...row.placements],
      href: row.href,
      imageUrl: row.imageUrl,
      title: row.title,
      enabled: row.enabled,
      startOn: row.startOn,
      endOn: row.endOn,
    });
  };

  const togglePlacement = (id: AdminAdPlacement) => {
    form.setDraft((prev) => {
      const has = prev.placements.includes(id);
      const placements = has
        ? prev.placements.filter((p) => p !== id)
        : [...prev.placements, id];
      return { ...prev, placements };
    });
  };

  const onPickImage = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    form.setDraft((prev) => {
      if (prev.imageUrl.startsWith("blob:")) URL.revokeObjectURL(prev.imageUrl);
      return {
        ...prev,
        imageUrl: url,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      };
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = form.draft.name.trim();
    const advertiser = form.draft.advertiser.trim();
    const href = form.draft.href.trim();
    const imageUrl = form.draft.imageUrl.trim();
    const title = form.draft.title.trim() || name;
    if (!name || !advertiser || !href || !imageUrl) {
      showFlash("案件名・広告主・リンク・画像は必須です");
      return;
    }
    if (!form.draft.placements.length) {
      showFlash("配信枠を1つ以上選んでください");
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
                  name,
                  advertiser,
                  placements: draft.placements,
                  href,
                  imageUrl,
                  title,
                  enabled: draft.enabled,
                  startOn: draft.startOn,
                  endOn: draft.endOn,
                }
              : r,
          ),
          "案件を更新しました",
        );
      } else {
        await persist(
          [
            ...rows,
            {
              id: newId(),
              name,
              advertiser,
              placements: draft.placements,
              href,
              imageUrl,
              title,
              enabled: draft.enabled,
              startOn: draft.startOn,
              endOn: draft.endOn,
              impressions: 0,
              clicks: 0,
            },
          ],
          "広告を登録しました",
        );
      }
      form.resetForm();
    })();
  };

  const copyOne = async (ad: AdminAd) => {
    const ok = await copyAdvertiserReport(ad);
    if (!ok) {
      showFlash("クリップボードにコピーできませんでした");
      return;
    }
    setCopiedId(ad.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    if (!form.editingId) return;
    removeById(form.editingId, "案件を削除しました");
    form.resetForm();
  };

  return (
    <div className="space-y-4">
      <AdminFlashBanner flash={flash} />

      <AdminConfirmDialog
        open={form.deleteConfirmOpen}
        title="案件を削除しますか？"
        body="実績も含めて一覧から消えます。この操作は取り消せません。"
        confirmLabel="削除する"
        danger
        onConfirm={confirmDelete}
        onCancel={() => form.setDeleteConfirmOpen(false)}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl text-[13px] leading-relaxed text-slate-600">
          <p>枠は複数指定可能。同枠の複数配信はランダム。</p>
          <p className="mt-1">
            表示＝ビューアブル（広告の半分以上が画面内に連続1秒）。
          </p>
        </div>
        <button
          type="button"
          onClick={form.openCreate}
          className={ADMIN_BTN_PRIMARY}
        >
          広告を登録
        </button>
      </div>

      {form.formOpen ? (
        <AdsManagerForm
          formId={formId}
          editingId={form.editingId}
          draft={form.draft}
          setDraft={form.setDraft}
          onSubmit={onSubmit}
          onCancel={form.resetForm}
          onRequestDelete={() => form.setDeleteConfirmOpen(true)}
          onPickImage={onPickImage}
          togglePlacement={togglePlacement}
        />
      ) : null}

      <AdsManagerList
        rows={rows}
        visibleRows={visibleRows}
        listFilter={listFilter}
        onListFilterChange={setListFilter}
        copiedId={copiedId}
        onCopy={(ad) => void copyOne(ad)}
        onEdit={openEdit}
      />
    </div>
  );
}

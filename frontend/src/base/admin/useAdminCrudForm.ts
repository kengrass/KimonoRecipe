"use client";

import { useState } from "react";

/**
 * 登録／編集フォームの開閉・下書き・削除確認。
 * 広告と協賛で同じ殻。中身の draft 型だけ差し替える。
 */
export function useAdminCrudForm<D>(emptyDraft: () => D) {
  const [draft, setDraft] = useState<D>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  };

  const openEditWith = (id: string, next: D) => {
    setEditingId(id);
    setDraft(next);
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setDeleteConfirmOpen(false);
  };

  return {
    draft,
    setDraft,
    editingId,
    formOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    openCreate,
    openEditWith,
    resetForm,
  };
}

"use client";

import { useState } from "react";
import type { AttachConfirmResult } from "@/base/detail/AttachSearchDialog";
import { buildAttachSummary, type AttachSummary } from "@/base/detail/attach-summary";

/**
 * 詳細の紐付けダイアログ開閉と確定バナー。
 * 確定後のリスト更新は呼び出し側（コーデ／アイテムで分岐）。
 */
export function useDetailAttach() {
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachResult, setAttachResult] = useState<AttachSummary | null>(null);

  const openAttach = () => setAttachOpen(true);
  const closeAttach = () => setAttachOpen(false);

  /** ダイアログ側が onClose する前提。ここではバナー用サマリーだけ残す */
  const markAttachResult = (result: AttachConfirmResult) => {
    setAttachResult(
      buildAttachSummary(result.addedIds.length, result.removedIds.length),
    );
  };

  return {
    attachOpen,
    attachResult,
    openAttach,
    closeAttach,
    markAttachResult,
    clearAttachResult: () => setAttachResult(null),
    setAttachOpen,
  };
}

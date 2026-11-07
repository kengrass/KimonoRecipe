"use client";

import { useEffect, useRef, useState } from "react";
import type { AttachSummary } from "./attach-summary";

const SHOW_MS = 2800;
const IN_MS = 280;

type Props = {
  summary: AttachSummary;
  onDismiss: () => void;
};

function messageFor(summary: AttachSummary): string {
  if (summary.added > 0 && summary.removed > 0) {
    return `${summary.added}件追加、${summary.removed}件解除`;
  }
  if (summary.added > 0) return `${summary.added}件紐付けを追加しました`;
  if (summary.removed > 0) return `${summary.removed}件紐付けを解除しました`;
  return "";
}

/**
 * セクション見出し右のトースト風結果表示。
 * フェードインで出現し、表示後はそのまま外す。
 */
export function AttachResultBanner({ summary, onDismiss }: Props) {
  const onDismissRef = useRef(onDismiss);
  const [shown, setShown] = useState(false);
  const message = messageFor(summary);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) {
      onDismissRef.current();
      return;
    }
    setShown(false);
    const enter = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setShown(true));
    });
    const removeAt = window.setTimeout(() => onDismissRef.current(), SHOW_MS);
    return () => {
      window.cancelAnimationFrame(enter);
      window.clearTimeout(removeAt);
    };
  }, [summary, message]);

  if (!message) return null;

  return (
    <span
      className={`inline-flex h-[1.25rem] max-w-full items-center truncate rounded-full bg-neutral-900/90 px-2 text-[10px] font-medium leading-none text-white shadow-md transition-[opacity,transform] ease-out md:h-[1.375rem] md:text-[11px] ${
        shown
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-0.5 scale-95 opacity-0"
      }`}
      style={{ transitionDuration: `${IN_MS}ms` }}
      role="status"
      aria-live="polite"
    >
      {message}
    </span>
  );
}

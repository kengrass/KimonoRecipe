"use client";

import { useId, useRef } from "react";
import { ADMIN_BTN_SECONDARY } from "@/base/admin/admin-form-styles";

/** ネイティブ file 入力の代わりにボタンで開く */
export function AdminFilePickButton({
  accept = "image/*",
  label = "画像を選択",
  onPick,
}: {
  accept?: string;
  label?: string;
  onPick: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  return (
    <div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={ADMIN_BTN_SECONDARY}
      >
        {label}
      </button>
    </div>
  );
}

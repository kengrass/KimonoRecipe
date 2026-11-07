"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { SecondaryButton } from "@/base/form/form-ui";
import { UserAvatar } from "@/base/ui/UserAvatar";
import { USE_SPIKE_API } from "@/lib/config";
import { revokeBlobUrl } from "@/lib/blob-url";
import { refreshSpikeAuthUser } from "@/lib/spike-auth";
import { spikePatchMe, spikeUploadImage } from "@/lib/spike-write";
import type { PublicUser } from "@/lib/types";

type Props = {
  user: PublicUser;
  flash: (message: string) => void;
  /** モック時の確定フィードバック */
  onMockConfirm?: () => void;
};

/**
 * プロフィール画像：ファイル選択 → プレビュー → 確定で保存。
 * spike 時はアップロード＋ `avatar_url` 更新。
 */
export function ProfileImagePickRow({
  user,
  flash,
  onMockConfirm,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    user.avatar_url ?? null,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      flash("画像ファイルを選んでください");
      return;
    }
    setPendingFile(file);
    setPreviewSrc((prev) => {
      if (prev && prev.startsWith("blob:")) revokeBlobUrl(prev);
      return URL.createObjectURL(file);
    });
  };

  const onConfirm = async () => {
    if (!pendingFile) {
      flash("先にファイルを選択してください");
      return;
    }

    if (!USE_SPIKE_API) {
      onMockConfirm?.();
      setPendingFile(null);
      return;
    }

    setBusy(true);
    try {
      const uploaded = await spikeUploadImage(pendingFile, pendingFile.name);
      await spikePatchMe({ avatar_url: uploaded.square_url || uploaded.url });
      if (previewSrc?.startsWith("blob:")) revokeBlobUrl(previewSrc);
      setPreviewSrc(uploaded.square_url || uploaded.url);
      setPendingFile(null);
      await refreshSpikeAuthUser();
      flash("プロフィール画像を保存しました");
    } catch {
      flash("プロフィール画像の保存に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-neutral-200">
        <UserAvatar
          name={user.name}
          seed={user.id}
          src={previewSrc}
          className="h-full w-full text-2xl"
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SecondaryButton
          tone="owner"
          className="w-auto px-3.5 py-2 text-sm"
          onClick={openPicker}
          disabled={busy}
        >
          ファイル選択
        </SecondaryButton>
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-kr-navy px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "保存中…" : "確定"}
        </button>
      </div>
    </div>
  );
}

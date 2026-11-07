"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AdminConfirmDialog } from "@/base/admin/AdminConfirmDialog";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CONTROL,
  ADMIN_PANEL,
} from "@/base/admin/admin-form-styles";
import {
  AdminFlashBanner,
  useAdminFlash,
} from "@/base/admin/useAdminFlash";
import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import type { AdminUser, AdminUserStatus } from "@/lib/admin/types";
import {
  formatDateTimeWithAgo,
  formatPercent,
  statusLabel,
} from "@/lib/admin/format";
import {
  resetAdminUserPassword,
  saveAdminUser,
} from "@/lib/admin/admin-write";

type Props = {
  user: AdminUser;
};

type ConfirmKind = "save" | "password" | null;

export function UserDetailClient({ user }: Props) {
  const [email, setEmail] = useState(user.email);
  const [mailRejected, setMailRejected] = useState(user.mailRejected);
  const [name, setName] = useState(user.name);
  const [premiumId, setPremiumId] = useState(user.premiumId ?? "");
  const [status, setStatus] = useState<AdminUserStatus>(user.status);
  /** 最後に保存した状態（これと違うときだけ「未保存」） */
  const [savedStatus, setSavedStatus] = useState<AdminUserStatus>(user.status);
  const [adminNote, setAdminNote] = useState(user.adminNote);
  const { flash, showFlash } = useAdminFlash();
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);

  const statusChanged = status !== savedStatus;

  const flashMsg = (msg: string, tone: "ok" | "error" = "ok") => {
    showFlash(msg, 2800, tone);
  };

  const doSave = () => {
    setConfirmKind(null);
    void (async () => {
      try {
        const saved = await saveAdminUser(user.id, {
          email: email.trim(),
          name: name.trim(),
          status,
          adminNote,
          mailRejected,
          premiumId: premiumId.trim() || null,
        });
        setSavedStatus(saved.status);
        setEmail(saved.email);
        setName(saved.name);
        setAdminNote(saved.adminNote);
        setMailRejected(saved.mailRejected);
        setPremiumId(saved.premiumId ?? "");
        setStatus(saved.status);
        flashMsg(
          ADMIN_USES_LIVE_API ? "保存しました" : "保存しました（モック）",
        );
      } catch {
        flashMsg("保存に失敗しました", "error");
      }
    })();
  };

  const onClickSave = () => {
    if (statusChanged) {
      setConfirmKind("save");
      return;
    }
    doSave();
  };

  const confirmDialog =
    confirmKind === "save"
      ? {
          title: "保存の確認",
          body: [
            `${name}（${email}）の内容を保存します。`,
            "",
            `状態: ${statusLabel(savedStatus)} → ${statusLabel(status)}`,
            "",
            "状態の変更はユーザーの利用に影響します。保存してよろしいですか？",
          ].join("\n"),
          confirmLabel: "保存する",
          danger: status === "withdrawn" || status === "suspended",
          onConfirm: doSave,
        }
      : confirmKind === "password"
        ? {
            title: "パスワードリセット",
            body: [
              `${name}（${email}）にパスワードリセット案内を送ります。`,
              "",
              "登録メールアドレス宛に再設定用の案内が届きます。",
              "この操作は「保存」とは別で、すぐに実行されます。",
              "よろしいですか？",
            ].join("\n"),
            confirmLabel: "送信する",
            danger: false,
            onConfirm: () => {
              setConfirmKind(null);
              void (async () => {
                try {
                  const result = await resetAdminUserPassword(user.id);
                  if (result.temporaryPassword) {
                    flashMsg(
                      ADMIN_USES_LIVE_API
                        ? `一時パスワード: ${result.temporaryPassword}`
                        : "パスワードリセットを送信しました（モック）",
                    );
                  } else {
                    flashMsg("パスワードリセット案内を送信しました");
                  }
                } catch {
                  flashMsg("パスワードリセットに失敗しました", "error");
                }
              })();
            },
          }
        : null;

  return (
    <div className="mx-auto max-w-xl space-y-5 text-[15px] text-kr-text">
      <p>
        <Link
          href="/admin/users"
          className="text-[15px] text-slate-600 underline-offset-2 hover:text-kr-navy hover:underline"
        >
          ← ユーザー一覧
        </Link>
      </p>

      <AdminFlashBanner flash={flash} density="comfortable" />

      <dl className={`${ADMIN_PANEL} space-y-4`}>
        <Row label="最終利用日時">
          <ReadOnlyValue>
            <span className="tabular-nums">
              {formatDateTimeWithAgo(user.lastActiveAt)}
            </span>
          </ReadOnlyValue>
        </Row>
        <Row label="ベース uid">
          <ReadOnlyValue>
            <code>{user.id}</code>
          </ReadOnlyValue>
        </Row>
        <Row label="プレミアム uid">
          <input
            type="text"
            value={premiumId}
            onChange={(e) => setPremiumId(e.target.value)}
            placeholder="未設定"
            className={ADMIN_CONTROL}
          />
        </Row>
        <Row label="メールアドレス">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ADMIN_CONTROL}
          />
        </Row>
        <Row label="メール拒否フラグ">
          <label className="flex min-h-[2.625rem] items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={mailRejected}
              onChange={(e) => setMailRejected(e.target.checked)}
              className="h-4 w-4 accent-kr-navy"
            />
            拒否する
          </label>
        </Row>
        <Row label="名前">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ADMIN_CONTROL}
          />
        </Row>
        <Row label="状態" alignTop={statusChanged}>
          <div className="space-y-1.5">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
              className={`${ADMIN_CONTROL} w-auto min-w-[8rem]`}
            >
              <option value="active">有効</option>
              <option value="suspended">停止</option>
              <option value="withdrawn">退会</option>
            </select>
            {statusChanged ? (
              <p className="text-[13px] text-amber-800">
                未保存: {statusLabel(savedStatus)} → {statusLabel(status)}
                （「保存」で反映）
              </p>
            ) : null}
          </div>
        </Row>
        <Row label="管理用メモ" alignTop>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={4}
            className={ADMIN_CONTROL}
          />
        </Row>
      </dl>

      <div className="flex justify-end">
        <button type="button" onClick={onClickSave} className={ADMIN_BTN_PRIMARY}>
          保存
        </button>
      </div>

      <section className={ADMIN_PANEL}>
        <h2 className="mb-2 text-[15px] font-bold text-kr-text">投稿サマリー</h2>
        <ul className="grid grid-cols-2 gap-2 text-slate-700">
          <li>公開コーデ: {user.publicCoordinateCount}</li>
          <li>非公開コーデ: {user.privateCoordinateCount}</li>
          <li>仮コーデ: {user.tempCoordinateCount}</li>
          <li>公開アイテム: {user.publicItemCount}</li>
          <li>非公開アイテム: {user.privateItemCount}</li>
          <li>紐付率: {formatPercent(user.attachmentRate)}</li>
          <li>画像数: {user.imageCount}</li>
        </ul>
      </section>

      {/* 保存フォームの外：即時操作 */}
      <section className="rounded-md border border-dashed border-kr-border bg-[#fafafa] px-4 py-5 sm:px-5">
        <h2 className="text-[15px] font-bold text-kr-text">その他の操作</h2>
        <p className="mt-1 text-[13px] text-slate-600">
          上の「保存」とは別です。実行するとすぐに反映されます。
        </p>
        <button
          type="button"
          onClick={() => setConfirmKind("password")}
          className={`mt-3 ${ADMIN_BTN_SECONDARY}`}
        >
          パスワードリセット
        </button>
      </section>

      <AdminConfirmDialog
        open={confirmDialog != null}
        title={confirmDialog?.title ?? ""}
        body={confirmDialog?.body ?? ""}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  );
}

function ReadOnlyValue({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[2.625rem] items-center text-[15px]">
      {children}
    </div>
  );
}

function Row({
  label,
  children,
  alignTop = false,
}: {
  label: string;
  children: ReactNode;
  /** 複数行（メモなど）は上揃え */
  alignTop?: boolean;
}) {
  return (
    <div
      className={`grid gap-1 sm:grid-cols-[10rem_1fr] ${
        alignTop ? "sm:items-start" : "sm:items-center"
      }`}
    >
      <dt
        className={`text-[13px] font-medium text-kr-muted ${
          alignTop ? "sm:pt-2.5" : ""
        }`}
      >
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

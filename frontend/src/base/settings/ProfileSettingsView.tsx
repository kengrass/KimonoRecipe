"use client";

/**
 * 設定（プロフィール／アカウントタブ）。
 * spike 時は /api/me 系へ保存。モック時はローカル反映＋トーストが多い。
 * ヘルパ: `profile-settings-helpers`。データ口: `lib/spike-write` / `lib/api`。
 * 厚い提供 UI — 見た目分割のためのリファクタはしない。
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AddRowButton,
  EndPrimaryButton,
  Field,
  FormPage,
  IconDeleteButton,
  LabeledWithBadge,
  PageTitle,
  SecondaryButton,
  SettingsSection,
  TextInput,
  TextTextarea,
  useMockFlash,
} from "@/base/form/form-ui";
import { ProfileImagePickRow } from "@/base/settings/ProfileImagePickRow";
import {
  SNS_FIELDS,
  snsHandleFromStored,
  snsUrlFromHandle,
  type SnsKey,
} from "@/base/settings/profile-settings-helpers";
import { ModalDialog } from "@/base/ui/ModalDialog";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import {
  INPUT_LIMITS,
  sanitizePlainLine,
  sanitizePlainMultiline,
} from "@/lib/safe-input";
import { refreshSpikeAuthUser, setSpikeAuthUser } from "@/lib/spike-auth";
import {
  spikeChangePassword,
  spikeConfirmEmailChange,
  spikeGetMe,
  spikePatchMe,
  spikeRequestEmailChange,
  spikeWithdrawMe,
} from "@/lib/spike-write";
import type { PublicUser } from "@/lib/types";

type LinkPair = { title: string; url: string };
type MainTab = "profile" | "account";
type SettingsPanel = "bio";

export type ProfileSettingsEntry = {
  tab?: MainTab | "mypage";
  panel?: SettingsPanel | "category" | "folder";
};

type Props = {
  user: PublicUser;
  entry?: ProfileSettingsEntry;
  initial: {
    displayName: string;
    email: string;
    mailOptIn: boolean;
    bio: string;
    links: LinkPair[];
    sns: Record<SnsKey, string>;
    publicSize?: Array<{ label: string; value: string }>;
  };
};

function resolveEntry(entry?: ProfileSettingsEntry): {
  mainTab: MainTab;
  focusId: string | null;
} {
  if (entry?.panel === "bio") {
    return { mainTab: "profile", focusId: "settings-bio" };
  }
  if (entry?.tab === "account") {
    return { mainTab: "account", focusId: null };
  }
  // 旧 mypage / category / folder はプロフィールへ
  return { mainTab: "profile", focusId: null };
}

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "profile", label: "プロフィール" },
  { id: "account", label: "アカウント" },
];

const MAX_PROFILE_LINKS = 10;

/**
 * 設定。spike 時は /api/me 系に接続。モック時は見た目のみ。
 */
export function ProfileSettingsView({ user, initial, entry }: Props) {
  // 保存ボタンは画面下寄りなので、トーストは常に画面中央で見せる
  const { flash, mockSave, Toast } = useMockFlash({ placement: "fixed" });
  const { logout, setAuthMode } = useMockAuth();
  const router = useRouter();
  const pathname = usePathname() || "/settings/profile";
  const resolved = resolveEntry(entry);
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  const [mainTab, setMainTab] = useState<MainTab>(resolved.mainTab);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [devEmailCode, setDevEmailCode] = useState<string | null>(null);

  const showDisplayNameError = (message: string) => {
    setDisplayNameError(message);
    flash(message);
    window.requestAnimationFrame(() => {
      document.getElementById("settings-display-name")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      displayNameInputRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!resolved.focusId) return;
    const id = resolved.focusId;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [resolved.focusId]);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [email, setEmail] = useState(initial.email);
  const [mailOptIn, setMailOptIn] = useState(initial.mailOptIn);
  const [bio, setBio] = useState(initial.bio);
  const [heightCm, setHeightCm] = useState(
    () =>
      initial.publicSize?.find((x) => x.label === "身長")?.value.replace(/cm$/i, "") ??
      "",
  );
  const [mitakeCm, setMitakeCm] = useState(
    () =>
      initial.publicSize?.find((x) => x.label === "身丈")?.value.replace(/cm$/i, "") ??
      "",
  );

  // 保存後の refresh でサーバ値をフォームへ戻す
  useEffect(() => {
    setDisplayName(initial.displayName);
    setBio(initial.bio);
  }, [initial.displayName, initial.bio]);
  const [profileLinks, setProfileLinks] = useState<LinkPair[]>(() => {
    const seeded = initial.links.filter((l) => l.title.trim() || l.url.trim());
    return seeded.length > 0 ? seeded : [{ title: "", url: "" }];
  });
  const [snsHandles, setSnsHandles] = useState(() => {
    const next = {} as Record<SnsKey, string>;
    for (const field of SNS_FIELDS) {
      next[field.key] = snsHandleFromStored(
        initial.sns[field.key] ?? "",
        field.prefix,
      );
    }
    return next;
  });
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [savedEmail, setSavedEmail] = useState(initial.email);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  useEffect(() => {
    if (!USE_SPIKE_API) return;
    void (async () => {
      const me = await spikeGetMe();
      if (!me) return;
      setDisplayName(me.name);
      setBio(me.bio ?? "");
      setEmail(me.email);
      setSavedEmail(me.email);
      setMailOptIn(me.mail_opt_in ?? true);
      if (me.links?.length) {
        setProfileLinks(me.links.map((l) => ({ title: l.title, url: l.url })));
      }
      if (me.sns) {
        setSnsHandles(() => {
          const next = {} as Record<SnsKey, string>;
          for (const field of SNS_FIELDS) {
            next[field.key] = snsHandleFromStored(
              me.sns?.[field.key] ?? "",
              field.prefix,
            );
          }
          return next;
        });
      }
      if (me.public_size) {
        setHeightCm(
          me.public_size
            .find((x) => x.label === "身長")
            ?.value.replace(/cm$/i, "") ?? "",
        );
        setMitakeCm(
          me.public_size
            .find((x) => x.label === "身丈")
            ?.value.replace(/cm$/i, "") ?? "",
        );
      }
    })();
  }, []);

  const syncSettingsUrl = (tab: MainTab) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectMainTab = (tab: MainTab) => {
    setMainTab(tab);
    syncSettingsUrl(tab);
  };

  const updateProfileLink = (index: number, patch: Partial<LinkPair>) => {
    setProfileLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  return (
    <FormPage>
      <PageTitle>設定</PageTitle>
      {Toast}

      <div
        role="tablist"
        aria-label="設定"
        className="flex gap-1 border-b border-kr-border"
      >
        {MAIN_TABS.map((tab) => {
          const active = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectMainTab(tab.id)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition ${
                active
                  ? "border-kr-navy font-semibold text-kr-navy"
                  : "border-transparent text-kr-muted hover:text-kr-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mainTab === "profile" ? (
        <>
          <SettingsSection title="プロフィール画像">
            <ProfileImagePickRow
              user={user}
              flash={flash}
              onMockConfirm={() => mockSave("プロフィール画像を確定")}
            />
          </SettingsSection>

          <SettingsSection id="settings-bio" title="プロフィール">
            <Field
              id="settings-display-name"
              label="表示名"
              hint={displayNameError ?? undefined}
              hintTone={displayNameError ? "warn" : "muted"}
            >
              <TextInput
                ref={displayNameInputRef}
                value={displayName}
                maxLength={INPUT_LIMITS.name}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (displayNameError) setDisplayNameError(null);
                }}
                aria-invalid={Boolean(displayNameError)}
                className={
                  displayNameError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : undefined
                }
              />
            </Field>

            <Field label="自己紹介">
              <TextTextarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={INPUT_LIMITS.bio}
                className="min-h-[5.5rem]"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="公開サイズ・身長（cm）">
                <TextInput
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  inputMode="decimal"
                  placeholder="例: 158"
                />
              </Field>
              <Field label="公開サイズ・身丈（cm）">
                <TextInput
                  value={mitakeCm}
                  onChange={(e) => setMitakeCm(e.target.value)}
                  inputMode="decimal"
                  placeholder="例: 160"
                />
              </Field>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-kr-text">リンク</p>
                <p className="mt-1 text-xs text-kr-muted">
                  最大{MAX_PROFILE_LINKS}件まで（
                  {profileLinks.length}/{MAX_PROFILE_LINKS}）
                </p>
              </div>
              {profileLinks.map((link, index) => (
                <div key={index} className="flex items-start gap-2">
                  {profileLinks.length > 1 ? (
                    <IconDeleteButton
                      label="リンクを削除"
                      className="mt-0.5"
                      onClick={() =>
                        setProfileLinks((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    />
                  ) : (
                    <span className="mt-0.5 inline-block h-9 w-9 shrink-0" />
                  )}
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <TextInput
                      value={link.title}
                      maxLength={INPUT_LIMITS.linkTitle}
                      onChange={(e) =>
                        updateProfileLink(index, { title: e.target.value })
                      }
                      placeholder="タイトル"
                    />
                    <TextInput
                      type="url"
                      value={link.url}
                      maxLength={INPUT_LIMITS.linkUrl}
                      onChange={(e) =>
                        updateProfileLink(index, { url: e.target.value })
                      }
                      placeholder="https://"
                    />
                  </div>
                </div>
              ))}
              {profileLinks.length < MAX_PROFILE_LINKS ? (
                <AddRowButton
                  label="リンクを追加"
                  onClick={() =>
                    setProfileLinks((prev) => [...prev, { title: "", url: "" }])
                  }
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-kr-text">SNS</p>
                <p className="mt-1 text-xs leading-relaxed text-kr-muted">
                  ユーザー名だけでOKです。URLを貼っても自動で取り込みます。
                </p>
              </div>
              <div className="space-y-3">
                {SNS_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label}>
                    <div className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-kr-border bg-white focus-within:border-kr-navy/50 focus-within:ring-2 focus-within:ring-kr-navy/10">
                      <span className="flex shrink-0 items-center bg-neutral-50 px-2.5 text-xs text-kr-muted sm:px-3 sm:text-sm">
                        {field.prefix}
                      </span>
                      <input
                        value={snsHandles[field.key]}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const handle = snsHandleFromStored(raw, field.prefix);
                          setSnsHandles((prev) => ({
                            ...prev,
                            [field.key]:
                              /https?:\/\//i.test(raw) || raw.includes("/")
                                ? handle
                                : raw.replace(/^@/, ""),
                          }));
                        }}
                        onBlur={() => {
                          const handle = snsHandles[field.key].trim();
                          if (!handle) return;
                          // 保存時にフルURL化する前提の正規化（モック）
                          void snsUrlFromHandle(handle, field.prefix);
                        }}
                        placeholder={field.placeholder}
                        className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2.5 text-sm text-kr-text outline-none placeholder:text-kr-muted/70"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>
                  </Field>
                ))}
              </div>
            </div>

            <EndPrimaryButton
              onClick={() => {
                setDisplayNameError(null);
                const trimmed = sanitizePlainLine(
                  displayName,
                  INPUT_LIMITS.name,
                );
                if (trimmed == null) {
                  showDisplayNameError(
                    "表示名に使用できない文字が含まれています",
                  );
                  return;
                }
                if (!trimmed) {
                  showDisplayNameError("表示名を入力してください");
                  return;
                }
                const nextBio = sanitizePlainMultiline(bio, INPUT_LIMITS.bio);
                if (nextBio == null) {
                  flash("自己紹介に使用できない文字が含まれています");
                  return;
                }
                if (!USE_SPIKE_API) {
                  mockSave("プロフィールを保存");
                  return;
                }
                const links = profileLinks
                  .map((l) => ({
                    title: sanitizePlainLine(l.title, INPUT_LIMITS.linkTitle) ?? "",
                    url: l.url.trim(),
                  }))
                  .filter((l) => l.title || l.url);
                const sns: Record<string, string> = {};
                for (const field of SNS_FIELDS) {
                  const url = snsUrlFromHandle(
                    snsHandles[field.key],
                    field.prefix,
                  );
                  if (url) sns[field.key] = url;
                }
                const public_size: Array<{ label: string; value: string }> = [];
                const h = heightCm.trim();
                const m = mitakeCm.trim();
                if (h) public_size.push({ label: "身長", value: `${h}cm` });
                if (m) public_size.push({ label: "身丈", value: `${m}cm` });
                void (async () => {
                  try {
                    await spikePatchMe({
                      name: trimmed,
                      bio: nextBio,
                      links,
                      sns,
                      public_size,
                    });
                    setDisplayName(trimmed);
                    setBio(nextBio);
                    await refreshSpikeAuthUser();
                    flash("プロフィールを保存しました");
                    router.refresh();
                  } catch (e) {
                    const code = e instanceof Error ? e.message : "";
                    if (code === "name_taken") {
                      showDisplayNameError("この名前は既に使われています");
                      return;
                    }
                    if (code === "name_recently_used") {
                      showDisplayNameError(
                        "直近180日以内に使った名前には戻せません",
                      );
                      return;
                    }
                    if (code === "name_required") {
                      showDisplayNameError("表示名を入力してください");
                      return;
                    }
                    if (code === "invalid_body") {
                      flash(
                        "入力内容を確認してください（HTMLやスクリプトは使えません）",
                      );
                      return;
                    }
                    flash("保存に失敗しました（ログイン済みか確認）");
                  }
                })();
              }}
            >
              保存
            </EndPrimaryButton>
          </SettingsSection>
        </>
      ) : null}

      {mainTab === "account" ? (
        <>
          <SettingsSection title="メール">
            <Field
              label={
                <LabeledWithBadge badge="private">
                  現在のメールアドレス
                </LabeledWithBadge>
              }
            >
              <p className="rounded-lg border border-kr-border bg-neutral-50 px-3.5 py-2.5 text-sm text-kr-text">
                {savedEmail}
              </p>
            </Field>
            <Field
              label="新しいメールアドレス"
              hint="変更には新アドレス宛の確認コードが必要です。ログイン用メールも同時に変わります"
              hintTone="warn"
            >
              <TextInput
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailCodeSent(false);
                  setEmailCode("");
                }}
                placeholder="新しいメールアドレス"
                autoComplete="email"
              />
            </Field>
            {email.trim() &&
            email.trim().toLowerCase() !== savedEmail.trim().toLowerCase() ? (
              <div className="space-y-4 rounded-lg border border-kr-border bg-white p-3.5">
                <p className="text-xs leading-relaxed text-kr-muted">
                  新しいアドレスに確認コードを送り、届いたコードを入力すると変更が確定します。
                  {USE_SPIKE_API
                    ? "（spike は実メール送信せず、コードを画面に表示）"
                    : "（モック）"}
                </p>
                {!emailCodeSent ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!USE_SPIKE_API) {
                          setEmailCodeSent(true);
                          flash("確認コードを送信しました（モック）");
                          return;
                        }
                        void (async () => {
                          try {
                            const res = await spikeRequestEmailChange(
                              email.trim(),
                            );
                            setEmailCodeSent(true);
                            setDevEmailCode(res.dev_code ?? null);
                            flash(
                              res.dev_code
                                ? `確認コード: ${res.dev_code}`
                                : "確認コードを送信しました",
                            );
                          } catch (e) {
                            const code = e instanceof Error ? e.message : "";
                            flash(
                              code === "email_taken"
                                ? "このメールアドレスは既に使われています"
                                : "送信に失敗しました",
                            );
                          }
                        })();
                      }}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-kr-teal px-4 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      確認メールを送る
                    </button>
                  </div>
                ) : (
                  <>
                    {devEmailCode ? (
                      <p className="text-xs text-amber-800">
                        spike 確認コード: {devEmailCode}
                      </p>
                    ) : null}
                    <Field label="確認コード">
                      <TextInput
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="6桁のコード"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </Field>
                    <div className="flex flex-wrap justify-end gap-2">
                      <SecondaryButton
                        tone="soft"
                        onClick={() => {
                          if (!USE_SPIKE_API) {
                            flash("確認コードを再送しました（モック）");
                            return;
                          }
                          void (async () => {
                            try {
                              const res = await spikeRequestEmailChange(
                                email.trim(),
                              );
                              setDevEmailCode(res.dev_code ?? null);
                              flash(
                                res.dev_code
                                  ? `確認コード: ${res.dev_code}`
                                  : "確認コードを再送しました",
                              );
                            } catch {
                              flash("再送に失敗しました");
                            }
                          })();
                        }}
                      >
                        再送
                      </SecondaryButton>
                      <button
                        type="button"
                        onClick={() => {
                          if (!emailCode.trim()) {
                            flash("確認コードを入力してください");
                            return;
                          }
                          if (!USE_SPIKE_API) {
                            setSavedEmail(email.trim());
                            setEmail(email.trim());
                            setEmailCode("");
                            setEmailCodeSent(false);
                            mockSave("メールアドレスを変更");
                            return;
                          }
                          void (async () => {
                            try {
                              await spikeConfirmEmailChange(
                                email.trim(),
                                emailCode.trim(),
                              );
                              setSavedEmail(email.trim());
                              setEmailCode("");
                              setEmailCodeSent(false);
                              setDevEmailCode(null);
                              await refreshSpikeAuthUser();
                              flash("メールアドレスを変更しました");
                            } catch (e) {
                              const code = e instanceof Error ? e.message : "";
                              flash(
                                code === "invalid_code" || code === "code_expired"
                                  ? "確認コードが正しくないか期限切れです"
                                  : "変更に失敗しました",
                              );
                            }
                          })();
                        }}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-kr-teal px-4 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        確認して変更
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-kr-text">
              <input
                type="checkbox"
                checked={mailOptIn}
                onChange={(e) => setMailOptIn(e.target.checked)}
                className="h-4 w-4 accent-kr-link"
              />
              きものレシピからのメールを受け取る
            </label>
            <EndPrimaryButton
              onClick={() => {
                if (!USE_SPIKE_API) {
                  mockSave("メール設定を保存");
                  return;
                }
                void (async () => {
                  try {
                    await spikePatchMe({ mail_opt_in: mailOptIn });
                    flash("メール設定を保存しました");
                  } catch {
                    flash("保存に失敗しました");
                  }
                })();
              }}
            >
              保存
            </EndPrimaryButton>
          </SettingsSection>

          <SettingsSection title="パスワード">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="新しいパスワード">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="確認">
                <TextInput
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="パスワード（確認）"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <EndPrimaryButton
              onClick={() => {
                if (!password || password.length < 6) {
                  flash("パスワードは6文字以上にしてください");
                  return;
                }
                if (password !== passwordConfirm) {
                  flash("確認用パスワードが一致しません");
                  return;
                }
                if (!USE_SPIKE_API) {
                  mockSave("パスワードを変更");
                  return;
                }
                void (async () => {
                  try {
                    await spikeChangePassword(password);
                    setPassword("");
                    setPasswordConfirm("");
                    flash("パスワードを変更しました");
                  } catch {
                    flash("変更に失敗しました");
                  }
                })();
              }}
            >
              保存
            </EndPrimaryButton>
          </SettingsSection>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-kr-border pt-4">
            <SecondaryButton tone="danger" onClick={() => setWithdrawOpen(true)}>
              退会する
            </SecondaryButton>
            <SecondaryButton tone="soft" onClick={() => setLogoutOpen(true)}>
              ログアウト
            </SecondaryButton>
          </div>

          <ModalDialog
            open={logoutOpen}
            title="ログアウトの確認"
            onClose={() => setLogoutOpen(false)}
            layout="sheet"
            size="md"
            footer={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLogoutOpen(false)}
                  className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoutOpen(false);
                    logout();
                    if (!USE_SPIKE_API) setAuthMode("guest");
                    flash("ログアウトしました");
                    router.replace(APP_ROUTES.home);
                    router.refresh();
                  }}
                  className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-kr-navy px-5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  ログアウトする
                </button>
              </div>
            }
          >
            <p className="pb-1 text-sm leading-relaxed text-kr-text">
              ログアウトします。よろしいですか？
            </p>
          </ModalDialog>

          <ModalDialog
            open={withdrawOpen}
            title="退会の確認"
            onClose={() => {
              if (!withdrawBusy) setWithdrawOpen(false);
            }}
            layout="sheet"
            size="md"
            footer={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={withdrawBusy}
                  onClick={() => setWithdrawOpen(false)}
                  className="min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-kr-muted transition hover:bg-neutral-50 hover:text-kr-text disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={withdrawBusy}
                  onClick={() => {
                    void (async () => {
                      setWithdrawBusy(true);
                      try {
                        if (USE_SPIKE_API) {
                          await spikeWithdrawMe();
                          setSpikeAuthUser(null);
                        } else {
                          setAuthMode("guest");
                        }
                        setWithdrawOpen(false);
                        flash("退会しました");
                        router.replace(APP_ROUTES.home);
                        router.refresh();
                      } catch {
                        flash("退会に失敗しました。しばらくしてから再度お試しください。");
                      } finally {
                        setWithdrawBusy(false);
                      }
                    })();
                  }}
                  className="inline-flex min-h-11 flex-[1.4] items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {withdrawBusy ? "処理中…" : "退会する"}
                </button>
              </div>
            }
          >
            <p className="pb-1 text-sm leading-relaxed text-kr-text">
              退会すると、投稿・いいね・フォローなどのデータは削除され、元に戻せません。本当に退会しますか？
            </p>
          </ModalDialog>
        </>
      ) : null}
    </FormPage>
  );
}

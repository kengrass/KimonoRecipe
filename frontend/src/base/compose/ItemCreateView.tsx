"use client";

/**
 * アイテム投稿／編集フォーム。共通部品は compose-shared-fields・ComposeFormShell。
 * spike 時の保存は `lib/spike-write`。
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComposeFormShell } from "@/base/compose/ComposeFormShell";
import { ComposeMediaControls } from "@/base/compose/ComposeMediaControls";
import {
  AudienceFields,
  FavoriteRankStars,
  MemoPairFields,
  SeasonField,
  TagField,
} from "@/base/compose/compose-shared-fields";
import {
  ITEM_CATEGORIES,
  WESTERN_CATEGORIES,
  toChipOptions,
} from "@/base/compose/item-options";
import {
  ChoiceChips,
  Field,
  FlagToggle,
  FormActions,
  LabeledWithBadge,
  RequiredLabel,
  TextInput,
  useMockFlash,
} from "@/base/form/form-ui";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import type { ComposePresetImage } from "@/lib/compose-preset";
import { loadItemEditSeed } from "@/lib/compose-edit-load";
import {
  readComposeLastPrefs,
  writeComposeLastPrefs,
} from "@/lib/compose-last-prefs";
import { APP_ROUTES } from "@/lib/laravel-urls";
import {
  spikeCreateItem,
  spikeDeleteItem,
  spikeEnsureUploadedUrls,
  spikeUpdateItem,
} from "@/lib/spike-write";

/** アイテム新規追加／編集（見た目モック） */
export function ItemCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = Boolean(editId);
  const { currentUser } = useMockAuth();
  const { flash, mockSave, Toast } = useMockFlash({ placement: "fixed" });
  const composeImagesRef = useRef<ComposePresetImage[]>([]);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [seedImages, setSeedImages] = useState<ComposePresetImage[] | undefined>();
  const [gender, setGender] = useState(() =>
    isEdit ? "women" : readComposeLastPrefs("item").gender,
  );
  const [visibility, setVisibility] = useState(() =>
    isEdit ? "public" : readComposeLastPrefs("item").visibility,
  );
  const [category, setCategory] = useState<string | null>(null);
  const [westernOpen, setWesternOpen] = useState(false);
  const [name, setName] = useState("");
  const [seasons, setSeasons] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [memo1, setMemo1] = useState("");
  const [memo2, setMemo2] = useState("");
  const [favorite, setFavorite] = useState("");
  const [declutter, setDeclutter] = useState(false);

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadItemEditSeed(editId, currentUser?.id).then((seed) => {
      if (cancelled) return;
      if (seed) {
        setSeedImages(seed.images);
        setGender(seed.gender);
        setVisibility(seed.visibility);
        setCategory(seed.category);
        setWesternOpen(
          Boolean(
            seed.category &&
              (WESTERN_CATEGORIES as readonly string[]).includes(seed.category),
          ),
        );
        setName(seed.name);
        setSeasons(seed.seasons);
        setTags(seed.tags);
        setMemo1(seed.memo1);
        setMemo2(seed.memo2);
        setFavorite(seed.favorite);
        setDeclutter(seed.declutter);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [editId, currentUser?.id]);

  const backHref = isEdit && editId ? APP_ROUTES.item(editId) : APP_ROUTES.home;
  const backLabel = isEdit ? "← 詳細へ" : "← トップ";

  return (
    <ComposeFormShell
      title={isEdit ? "アイテムを編集" : "アイテムを追加"}
      backHref={backHref}
      backLabel={backLabel}
      toast={Toast}
      loading={loading}
      leadNote={
        <p className="text-xs leading-relaxed text-kr-muted">
          商品が1点だけ写った写真を登録してください。2点以上はコーディネートへ。
        </p>
      }
    >
          <ComposeMediaControls
            flash={flash}
            seedImages={seedImages}
            onImagesChange={(images) => {
              composeImagesRef.current = images;
            }}
          />

          <section className="page-section space-y-5">
            <Field label="アイテム名">
              <TextInput
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                placeholder="アイテム名"
              />
            </Field>

            <Field label={<RequiredLabel>カテゴリ</RequiredLabel>}>
              <ChoiceChips
                ariaLabel="カテゴリ"
                value={category}
                options={toChipOptions(ITEM_CATEGORIES)}
                onChange={setCategory}
              />
            </Field>

            <div>
              <button
                type="button"
                className="mb-2 inline-flex h-8 items-center gap-1.5 text-sm font-semibold leading-none text-kr-text"
                onClick={() => setWesternOpen((v) => !v)}
                aria-expanded={westernOpen}
              >
                <span
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-kr-border text-kr-text"
                  aria-hidden
                >
                  {/* +/- とも同一サイズの SVG（要素差によるタイトルの上下ズレ防止） */}
                  <svg
                    viewBox="0 0 12 12"
                    className="block h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  >
                    {westernOpen ? (
                      <path d="M2.5 6h7" />
                    ) : (
                      <path d="M6 2.5v7M2.5 6h7" />
                    )}
                  </svg>
                </span>
                洋装アイテム
              </button>
              {westernOpen ? (
                <ChoiceChips
                  ariaLabel="洋装カテゴリ"
                  value={category}
                  options={toChipOptions(WESTERN_CATEGORIES)}
                  onChange={setCategory}
                />
              ) : null}
            </div>

            <MemoPairFields
              memo1={memo1}
              memo2={memo2}
              onMemo1Change={setMemo1}
              onMemo2Change={setMemo2}
            />

            <TagField value={tags} onChange={setTags} />

            <SeasonField value={seasons} onChange={setSeasons} />

            <Field
              label={
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <LabeledWithBadge badge="private">お気に入り</LabeledWithBadge>
                  <span className="text-[11px] font-normal tabular-nums text-kr-muted">
                    {favorite ? `${favorite} / 5` : "未設定"}
                  </span>
                </span>
              }
            >
              <FavoriteRankStars value={favorite} onChange={setFavorite} />
            </Field>

            <Field
              label={
                <LabeledWithBadge badge="private">断捨離候補</LabeledWithBadge>
              }
            >
              <FlagToggle
                checked={declutter}
                onChange={setDeclutter}
                label={declutter ? "断捨離候補（ON）" : "断捨離候補にする"}
              />
            </Field>

            <AudienceFields
              gender={gender}
              visibility={visibility}
              onGenderChange={setGender}
              onVisibilityChange={setVisibility}
            />

            <FormActions
              submitLabel={isEdit ? "保存" : "登録"}
              onCancel={() => {
                flash("キャンセルしました");
                if (isEdit) window.setTimeout(() => router.back(), 200);
              }}
              onSubmit={() => {
                writeComposeLastPrefs("item", { gender, visibility });
                if (!USE_SPIKE_API) {
                  mockSave(isEdit ? "保存" : "登録");
                  return;
                }
                if (!category) {
                  flash("カテゴリを選んでください");
                  return;
                }
                const rawUrls = composeImagesRef.current
                  .map((img) => img.src)
                  .filter(Boolean);
                if (!rawUrls.length) {
                  flash("画像を1枚以上追加してください");
                  return;
                }
                if (saving) return;
                setSaving(true);
                void (async () => {
                  try {
                    const image_urls = await spikeEnsureUploadedUrls(rawUrls);
                    const body = {
                      title: name,
                      description: memo1,
                      category,
                      gender: gender as "women" | "men" | "kids",
                      visibility: visibility as "public" | "private",
                      color_tone: null,
                      tags: [...seasons, ...tags],
                      image_urls,
                      private_note: memo2,
                      favorite_rank: (() => {
                        const n = Number(favorite);
                        return Number.isFinite(n) && n >= 1 && n <= 5
                          ? n
                          : null;
                      })(),
                      declutter_candidate: declutter,
                    };
                    const saved = isEdit && editId
                      ? await spikeUpdateItem(editId, body)
                      : await spikeCreateItem(body);
                    flash(isEdit ? "保存しました" : "登録しました");
                    window.setTimeout(
                      () => router.push(APP_ROUTES.item(saved.id)),
                      400,
                    );
                  } catch {
                    flash("保存に失敗しました（ログイン済みか確認）");
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
              onDelete={
                isEdit && editId
                  ? () => {
                      if (!USE_SPIKE_API) {
                        flash("削除しました（モック）");
                        window.setTimeout(() => router.back(), 400);
                        return;
                      }
                      if (saving) return;
                      setSaving(true);
                      void (async () => {
                        try {
                          await spikeDeleteItem(editId);
                          flash("削除しました");
                          window.setTimeout(() => router.push(APP_ROUTES.home), 400);
                        } catch {
                          flash("削除に失敗しました");
                        } finally {
                          setSaving(false);
                        }
                      })();
                    }
                  : undefined
              }
            />
          </section>
    </ComposeFormShell>
  );
}

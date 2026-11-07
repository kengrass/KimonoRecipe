"use client";

/**
 * コーデ投稿／編集フォーム。共通部品は compose-shared-fields・ComposeFormShell。
 * spike 時の保存は `lib/spike-write`。画像・クロップは同ディレクトリ。
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComposeFormShell } from "@/base/compose/ComposeFormShell";
import { ComposeMediaControls } from "@/base/compose/ComposeMediaControls";
import {
  AudienceFields,
  CompactControl,
  MemoPairFields,
  SeasonField,
  TagField,
} from "@/base/compose/compose-shared-fields";
import { useCollageSeedImages } from "@/base/compose/useCollageSeedImages";
import {
  Field,
  FlagToggle,
  FormActions,
  SelectInput,
  TextInput,
  useMockFlash,
} from "@/base/form/form-ui";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import type { ComposePresetImage } from "@/lib/compose-preset";
import { loadCoordinateEditSeed } from "@/lib/compose-edit-load";
import {
  readComposeLastPrefs,
  writeComposeLastPrefs,
} from "@/lib/compose-last-prefs";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";
import {
  buildMypageHref,
  defaultMypageUrlState,
} from "@/lib/mypage-state";
import {
  enableMockTempLiveSynth,
  isMockTempCoordinateId,
  mockTempCollageSourceUrls,
  releaseMockTempCoordinate,
  removeMockTempCoordinate,
  updateMockTempCoordinatePhotos,
} from "@/lib/mock-temp-coordinate";
import { SEARCH_OBI_KNOTS } from "@/lib/search-filters";
import {
  spikeCreateCoordinate,
  spikeDeleteCoordinate,
  spikeEnsureUploadedUrls,
  spikeUpdateCoordinate,
} from "@/lib/spike-write";

const OBI_OPTIONS = ["指定なし", ...SEARCH_OBI_KNOTS] as const;

/** コーディネート新規追加／編集（見た目モック） */
export function CoordinateCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = Boolean(editId);
  const tempHint = searchParams.get("temp") === "1";
  const { currentUser } = useMockAuth();
  const { flash, mockSave, Toast } = useMockFlash({ placement: "fixed" });
  const {
    seedImages,
    seedRevision,
    applyCollageAsSingleImage,
    setPlainSeedImages,
  } = useCollageSeedImages();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const composeImagesRef = useRef<ComposePresetImage[]>([]);
  const [gender, setGender] = useState(() =>
    isEdit ? "women" : readComposeLastPrefs("coordinate").gender,
  );
  const [visibility, setVisibility] = useState(() =>
    isEdit ? "public" : readComposeLastPrefs("coordinate").visibility,
  );
  const [obi, setObi] = useState<string>("指定なし");
  const [title, setTitle] = useState("");
  const [seasons, setSeasons] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [memo1, setMemo1] = useState("");
  const [memo2, setMemo2] = useState("");
  const [wornAt, setWornAt] = useState("");
  /** 仮ON = 紐付け変更で再合成。OFF = 画像固定 */
  const [isTemp, setIsTemp] = useState(tempHint);

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadCoordinateEditSeed(editId, currentUser?.id, {
      tempHint,
    }).then(async (seed) => {
      if (cancelled || !seed) {
        if (!cancelled) setLoading(false);
        return;
      }
      setGender(seed.gender);
      setVisibility(seed.visibility);
      setObi(seed.obi);
      setTitle(seed.title);
      setSeasons(seed.seasons);
      setTags(seed.tags);
      setMemo1(seed.memo1);
      setMemo2(seed.memo2);
      setWornAt(seed.wornAt);
      setIsTemp(seed.isTemp);

      const alt = seed.title.trim() || "コーディネート";
      if (seed.isTemp && seed.images.length === 0 && seed.collageSourceUrls.length) {
        await applyCollageAsSingleImage(seed.collageSourceUrls, alt);
      } else {
        setPlainSeedImages(seed.images);
      }
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [editId, currentUser?.id, tempHint, applyCollageAsSingleImage, setPlainSeedImages]);

  const obiOptions = OBI_OPTIONS.includes(obi as (typeof OBI_OPTIONS)[number])
    ? OBI_OPTIONS
    : ([obi, ...OBI_OPTIONS] as const);

  const tempListHref = currentUser
    ? buildMypageHref(
        userProfilePath(currentUser.id),
        defaultMypageUrlState({ coordinateView: "temp" }),
      )
    : APP_ROUTES.home;
  const backHref =
    isEdit && editId
      ? APP_ROUTES.coordinate(editId)
      : isTemp
        ? tempListHref
        : APP_ROUTES.home;
  const backLabel = isEdit ? "← 詳細へ" : isTemp ? "← 仮コーデ一覧" : "← トップ";
  const imageAlt = title.trim() || "コーディネート";

  const handleTempToggle = (next: boolean) => {
    if (next === isTemp) return;
    // spike: 保存時に is_temp を送る。トグルはローカル状態のみ。
    if (USE_SPIKE_API || !editId || !isMockTempCoordinateId(editId)) {
      setIsTemp(next);
      return;
    }

    if (next) {
      const record = enableMockTempLiveSynth(editId);
      setIsTemp(true);
      void applyCollageAsSingleImage(
        record ? mockTempCollageSourceUrls(record) : [],
        imageAlt,
      ).then(() => {
        flash("仮コーデをONにしました。紐付け変更で合成し直します（モック）");
      });
      return;
    }

    const urls = composeImagesRef.current.map((img) => img.src).filter(Boolean);
    releaseMockTempCoordinate(editId, urls);
    setIsTemp(false);
    flash("仮コーデをOFFにしました。いまの画像を固定します（モック）");
  };

  return (
    <ComposeFormShell
      title={isEdit ? "コーデを編集" : "コーデを追加"}
      backHref={backHref}
      backLabel={backLabel}
      toast={Toast}
      loading={loading}
    >
          <ComposeMediaControls
            flash={flash}
            seedImages={seedImages}
            seedRevision={seedRevision}
            onImagesChange={(images) => {
              composeImagesRef.current = images;
            }}
          />

          <section className="page-section space-y-5">
            <Field label="タイトル">
              <TextInput
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="任意"
              />
            </Field>

            <MemoPairFields
              memo1={memo1}
              memo2={memo2}
              onMemo1Change={setMemo1}
              onMemo2Change={setMemo2}
            />

            <TagField value={tags} onChange={setTags} />

            <SeasonField value={seasons} onChange={setSeasons} />

            <Field label="帯結び">
              <CompactControl>
                <SelectInput
                  value={obi}
                  onChange={(e) => setObi(e.target.value)}
                  aria-label="帯結び"
                >
                  {obiOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </SelectInput>
              </CompactControl>
            </Field>

            <Field label="着用日">
              <CompactControl>
                <TextInput
                  type="date"
                  value={wornAt}
                  onChange={(e) => setWornAt(e.target.value)}
                />
              </CompactControl>
            </Field>

            <AudienceFields
              gender={gender}
              visibility={visibility}
              onGenderChange={setGender}
              onVisibilityChange={setVisibility}
            />

            <Field
              label="仮コーデ"
              hint="ONのあいだは紐付けアイテムが変更される毎に、画像が再合成されます。"
            >
              <FlagToggle
                checked={isTemp}
                onChange={handleTempToggle}
                label={isTemp ? "仮コーデ（ON）" : "仮コーデにする"}
              />
            </Field>

            <FormActions
              submitLabel={isEdit ? "保存" : "登録"}
              onCancel={() => {
                flash("キャンセルしました");
                if (isEdit) window.setTimeout(() => router.back(), 200);
              }}
              onSubmit={() => {
                const urls = composeImagesRef.current
                  .map((img) => img.src)
                  .filter(Boolean);
                if (!isTemp && urls.length === 0) {
                  flash("画像を1枚以上追加してください");
                  return;
                }
                writeComposeLastPrefs("coordinate", { gender, visibility });
                if (!USE_SPIKE_API) {
                  if (
                    editId &&
                    isMockTempCoordinateId(editId) &&
                    !isTemp
                  ) {
                    updateMockTempCoordinatePhotos(editId, urls);
                  }
                  mockSave(isEdit ? "保存" : "登録");
                  return;
                }
                if (saving) return;
                setSaving(true);
                void (async () => {
                  try {
                    const image_urls =
                      urls.length > 0
                        ? await spikeEnsureUploadedUrls(urls)
                        : [];
                    const body = {
                      title,
                      description: memo1,
                      gender: gender as "women" | "men" | "kids",
                      visibility: visibility as "public" | "private",
                      obi_knot: obi === "指定なし" ? "" : obi,
                      tags: [...seasons, ...tags],
                      image_urls,
                      private_note: memo2,
                      is_temp: isTemp,
                      worn_on: wornAt || null,
                    };
                    const saved =
                      isEdit && editId && !isMockTempCoordinateId(editId)
                        ? await spikeUpdateCoordinate(editId, body)
                        : await spikeCreateCoordinate(body);
                    flash(isEdit ? "保存しました" : "登録しました");
                    window.setTimeout(
                      () => router.push(APP_ROUTES.coordinate(saved.id)),
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
                        if (isMockTempCoordinateId(editId)) {
                          removeMockTempCoordinate(editId);
                        }
                        flash("削除しました（モック）");
                        window.setTimeout(() => router.back(), 400);
                        return;
                      }
                      if (isMockTempCoordinateId(editId)) {
                        flash("モック仮コーデは spike 削除対象外です");
                        return;
                      }
                      if (saving) return;
                      setSaving(true);
                      void (async () => {
                        try {
                          await spikeDeleteCoordinate(editId);
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

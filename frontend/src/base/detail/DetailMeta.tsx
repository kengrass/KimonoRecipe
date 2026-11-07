"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatDateOnly, formatPostedAt } from "@/lib/format";
import { detailShareLabel, displayTitle } from "@/lib/display-title";
import { userProfilePath } from "@/lib/mypage-data";
import type { ContentVisibility, PublicUser } from "@/lib/types";
import { FollowButton } from "@/base/ui/FollowButton";
import { LikeButton } from "@/base/ui/LikeButton";
import { OwnerVisibilityStats } from "@/base/ui/OwnerVisibilityStats";
import { ShareButton } from "@/base/ui/ShareButton";
import { UserAvatar } from "@/base/ui/UserAvatar";
import { VisibilityIcon } from "@/base/ui/VisibilityIcon";
import { ObiKnotChip } from "./ObiKnotChip";

type MetaLeadProps = {
  user: PublicUser;
  title: string;
  description?: string;
  likeCount: number;
  sharePath: string;
  shareFallback: string;
  interactionKey: string;
  eyebrow?: string;
  /** 設定時は eyebrow をリンクに（アイテムカテゴリなど） */
  eyebrowHref?: string;
  /** 所有者のみ：非公開メモ（公開メモの直下） */
  privateNote?: string | null;
  /** 所有者のみ：お気に入り度 1〜5（非公開メモの下） */
  favoriteRank?: 1 | 2 | 3 | 4 | 5 | null;
  /**
   * 所有者として見ているとき true。
   * 未設定でも☆欄を出す（他人には出さない）。
   */
  showOwnerFavorite?: boolean;
  /** false でいいね不可（非公開・仮など）。省略時は可 */
  likeEnabled?: boolean;
};

/** これより長い本文は折りたたみ（短文はそのまま） */
const MEMO_COLLAPSE_CHARS = 80;

/**
 * 画像直下の短いメタ。
 * 1行目: アイコン・名前・フォロー（左）＋ いいね／シェア（右）
 */
export function DetailMeta({
  user,
  title,
  description,
  likeCount,
  sharePath,
  shareFallback,
  interactionKey,
  eyebrow,
  eyebrowHref,
  privateNote,
  favoriteRank = null,
  showOwnerFavorite = false,
  likeEnabled = true,
}: MetaLeadProps) {
  const shownTitle = displayTitle(title);
  const memo = description?.trim();
  const note = privateNote?.trim();
  const rank =
    favoriteRank != null && favoriteRank >= 1 && favoriteRank <= 5
      ? favoriteRank
      : null;
  const showFavorite = showOwnerFavorite || rank != null;
  const filled = rank ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={userProfilePath(user.id)}
            className="flex min-w-0 items-center gap-2 hover:opacity-90"
          >
            <UserAvatar
              name={user.name}
              seed={user.id}
              src={user.avatar_url}
              className="h-7 w-7 shrink-0 text-[10px]"
            />
            <span className="min-w-0 truncate text-sm font-medium text-kr-text">
              {user.name}
            </span>
          </Link>
          <FollowButton userId={user.id} variant="compact" className="shrink-0" />
        </div>
        <div className="flex shrink-0 items-center gap-x-3">
          <LikeButton
            initialCount={likeCount}
            storageKey={interactionKey}
            enabled={likeEnabled}
          />
          <ShareButton
            title={detailShareLabel(title, shareFallback)}
            path={sharePath}
            description={description}
          />
        </div>
      </div>

      {shownTitle || eyebrow ? (
        <header className="space-y-1">
          {eyebrow ? (
            eyebrowHref ? (
              <p>
                <Link
                  href={eyebrowHref}
                  className="text-xs font-medium tracking-wide text-kr-link hover:underline"
                >
                  {eyebrow}
                </Link>
              </p>
            ) : (
              <p className="text-xs font-medium tracking-wide text-kr-muted">
                {eyebrow}
              </p>
            )
          ) : null}
          {shownTitle ? (
            <h1 className="text-xl font-semibold leading-snug tracking-tight text-kr-text md:text-2xl [text-wrap:balance]">
              {shownTitle}
            </h1>
          ) : null}
        </header>
      ) : null}

      {memo ? <CollapsibleMemo text={memo} /> : null}

      {note || showFavorite ? (
        <div className="-ml-2.5 space-y-2 border-l-2 border-kr-border/80 pl-2.5">
          {note ? (
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-kr-muted">
                <VisibilityIcon visibility="private" className="h-3 w-3" />
                非公開メモ
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-kr-text/85">
                {note}
              </p>
            </div>
          ) : null}
          {showFavorite ? (
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-kr-muted">
                <VisibilityIcon visibility="private" className="h-3 w-3" />
                お気に入り
              </p>
              <p
                className="mt-0.5 text-sm tracking-tight text-kr-owner"
                title={rank != null ? `${rank} / 5` : "未設定"}
                aria-label={
                  rank != null
                    ? `お気に入り ${rank}（5段階・非公開）`
                    : "お気に入り未設定（非公開）"
                }
              >
                {"★".repeat(filled)}
                <span className="text-kr-border">
                  {"★".repeat(5 - filled)}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CollapsibleMemo({ text }: { text: string }) {
  const needsCollapse = text.length > MEMO_COLLAPSE_CHARS;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p
        className={`text-sm leading-relaxed text-kr-text/90 whitespace-pre-wrap ${
          needsCollapse && !open ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-sm text-kr-link hover:underline"
        >
          {open ? "閉じる" : "続きを読む"}
        </button>
      ) : null}
    </div>
  );
}

type StructuredFieldsProps = {
  obiKnot?: string | null;
};

/** 登録メタ：帯結び（Myフォルダ・Myカテゴリは詳細に出さない） */
export function DetailStructuredFields({
  obiKnot = null,
}: StructuredFieldsProps) {
  const knot = obiKnot?.trim() || "";

  if (!knot) {
    return null;
  }

  return (
    <div className="detail-inset mt-6 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
      <MetaLabel label="帯結び">
        <ObiKnotChip name={knot} />
      </MetaLabel>
    </div>
  );
}

function MetaLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 whitespace-nowrap text-xs text-kr-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

type AttributionProps = {
  postedAt: string;
  visibility?: ContentVisibility | null;
  viewCount?: number | null;
  editUrl?: string | null;
  wornOn?: string | null;
  /** 所有者のみ：断捨離候補 */
  declutterCandidate?: boolean;
};

/** 日時・公開／閲覧・編集。着用日・断捨離は所有者のみ。 */
export function DetailAttribution({
  postedAt,
  visibility = null,
  viewCount = null,
  editUrl = null,
  wornOn = null,
  declutterCandidate = false,
}: AttributionProps) {
  const showOwnerStats = visibility != null && viewCount != null;
  const worn = wornOn?.trim() || "";

  return (
    <div className="detail-inset mt-6 space-y-2">
      {worn ? (
        <MetaLabel label="着用日">
          <time dateTime={worn} className="text-xs text-kr-text">
            {formatDateOnly(worn)}
          </time>
        </MetaLabel>
      ) : null}
      {declutterCandidate ? (
        <MetaLabel label="断捨離">
          <span className="text-xs font-medium text-kr-text">候補</span>
        </MetaLabel>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-kr-muted">
          <time dateTime={postedAt}>{formatPostedAt(postedAt)}</time>
          {showOwnerStats ? (
            <>
              <span className="text-kr-muted/40" aria-hidden>
                ·
              </span>
              <OwnerVisibilityStats
                visibility={visibility}
                viewCount={viewCount}
                className="gap-x-2 text-xs"
              />
            </>
          ) : null}
        </div>
        {editUrl ? (
          <a
            href={editUrl}
            className="ml-auto shrink-0 rounded border border-kr-border bg-white px-2.5 py-1 text-xs font-medium text-kr-text hover:bg-neutral-50"
          >
            編集
          </a>
        ) : null}
      </div>
    </div>
  );
}

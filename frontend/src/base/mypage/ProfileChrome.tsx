"use client";

import Link from "next/link";
import type { ProfileSns } from "@/lib/mypage-types";
import { FollowButton } from "@/base/ui/FollowButton";
import { UserAvatar } from "@/base/ui/UserAvatar";
import { safeExternalHref } from "@/lib/safe-input";
import type { MypageProfile } from "./load-mypage";

type Props = {
  profile: MypageProfile;
};

/** 他人プロフィールの紹介（本人は出さない） */
export function ProfileAside({ profile }: Props) {
  if (profile.isOwnerView) return null;

  const { user, bio, profileLinks, sns, hasBio } = profile;

  return (
    <div className="space-y-4 lg:space-y-5">
      <section>
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.name}
            seed={user.id}
            className="h-11 w-11 shrink-0 text-sm lg:h-12 lg:w-12"
          />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="min-w-0 truncate text-base font-semibold leading-snug text-kr-text">
              {user.name}
            </h1>
            <FollowButton userId={user.id} variant="compact" className="shrink-0" />
          </div>
        </div>

        {hasBio ? (
          <p className="mt-3 text-xs leading-relaxed text-kr-text">{bio}</p>
        ) : null}

        {profile.hasPublicSize ? (
          <ul
            className={`space-y-0.5 text-[11px] text-kr-muted ${hasBio ? "mt-2" : "mt-3"}`}
          >
            {profile.publicSize.map((row) => (
              <li key={row.label}>
                {row.label}: {row.value}
              </li>
            ))}
          </ul>
        ) : null}

        {profileLinks.length > 0 ? (
          <ul
            className={`space-y-1 ${hasBio || profile.hasPublicSize ? "mt-2" : "mt-3"}`}
          >
            {profileLinks.map((link) => {
              const href = safeExternalHref(link.href);
              if (!href) return null;
              return (
                <li key={href}>
                  <a
                    href={href}
                    className="text-[11px] text-kr-link hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {sns.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {sns.map((s) => {
              const href = safeExternalHref(s.href);
              if (!href) return null;
              return (
                <li key={s.kind}>
                  <a
                    href={href}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-kr-border text-kr-muted hover:border-kr-navy/40 hover:text-kr-navy"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <SnsGlyph kind={s.kind} />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function SnsGlyph({ kind }: { kind: ProfileSns["kind"] }) {
  const iconClass =
    kind === "x" ? "h-3.5 w-3.5 fill-current" : "h-4 w-4 fill-current";

  if (kind === "x") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.1 22H1.84l8.03-9.17L1.5 2h6.75l4.66 6.2L18.244 2Zm-1.15 18h1.82L7.03 3.94H5.08L17.094 20Z" />
      </svg>
    );
  }
  if (kind === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
        <path d="M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.55.45-1 1-1Z" />
      </svg>
    );
  }
  if (kind === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 2.8A4.2 4.2 0 1 1 7.8 12 4.2 4.2 0 0 1 12 7.8Zm0 2A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8ZM17.35 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
      </svg>
    );
  }
  if (kind === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
        <path d="M14.5 3c.4 2.2 1.8 3.9 4 4.4v2.3c-1.4-.1-2.7-.6-3.8-1.4v6.5a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v2.5a2.8 2.8 0 1 0 2 2.7V3h2.2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M10 15.5v-7L16 12l-6 3.5ZM21.6 7.2a2.6 2.6 0 0 0-1.8-1.85C18.1 5 12 5 12 5s-6.1 0-7.8.35A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.85C5.9 19 12 19 12 19s6.1 0 7.8-.35a2.6 2.6 0 0 0 1.8-1.85A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8Z" />
    </svg>
  );
}

type NudgeProps = {
  profile: MypageProfile;
  profileEditHref: string;
};

/** 本人向け：自己紹介不足の誘導 */
export function OwnerSetupNudge({
  profile,
  profileEditHref,
}: NudgeProps) {
  if (!profile.isOwnerView || profile.hasBio) {
    return null;
  }

  return (
    <div className="mb-3 rounded border border-kr-border bg-neutral-50 px-3 py-2.5 text-sm text-kr-text">
      <p className="font-medium">まずは自己紹介から</p>
      <p className="mt-1 text-xs leading-relaxed text-kr-muted">
        公開プロフィールに短い紹介があると、フォローされやすくなります。
      </p>
      <div className="mt-2 text-xs">
        <a
          href={profileEditHref}
          className="font-medium text-kr-link hover:underline"
        >
          自己紹介を書く
        </a>
      </div>
    </div>
  );
}

type TabProps = {
  pathname: string;
  coordinateCount: number;
  itemCount: number;
  active: "coordinates" | "items";
  hrefFor: (tab: "coordinates" | "items") => string;
};

export function ListTabs({
  coordinateCount,
  itemCount,
  active,
  hrefFor,
}: TabProps) {
  const tabs = [
    {
      id: "coordinates" as const,
      label: "コーディネート",
      count: coordinateCount,
    },
    { id: "items" as const, label: "アイテム", count: itemCount },
  ];

  return (
    <div role="tablist" aria-label="一覧の種類" className="flex gap-2">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            role="tab"
            aria-selected={selected}
            className={`flex-1 rounded py-2.5 text-center text-sm font-medium transition ${
              selected
                ? "bg-kr-navy text-white"
                : "border border-kr-border text-kr-text hover:bg-neutral-50"
            }`}
            scroll={false}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs tabular-nums ${
                selected ? "text-white/80" : "text-kr-muted"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** @deprecated `@/base/ui/FilterChips` を使う */
export { FilterChips, ModeSwitch } from "@/base/ui/FilterChips";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormPageShell } from "@/base/form/FormPageShell";
import {
  ProfileSettingsView,
  type ProfileSettingsEntry,
} from "@/base/settings/ProfileSettingsView";
import { getPublicUser } from "@/lib/api";
import { USE_MOCK_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { getMypageSummary } from "@/lib/mypage-data";
import { MOCK_OWNER_USER } from "@/lib/mock-data";
import { getServerViewerUserId } from "@/lib/server-viewer";
import type { PublicUser } from "@/lib/types";

export const metadata: Metadata = {
  title: "設定",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ tab?: string; panel?: string }>;
};

function parseEntry(raw: {
  tab?: string;
  panel?: string;
}): ProfileSettingsEntry {
  const tab =
    raw.tab === "profile" || raw.tab === "account" || raw.tab === "mypage"
      ? raw.tab
      : undefined;
  const panel =
    raw.panel === "bio" ||
    raw.panel === "category" ||
    raw.panel === "folder"
      ? raw.panel
      : undefined;
  return { tab, panel };
}

/**
 * 設定。spike／本番はログイン必須。モック時のみデモ所有者で見た目確認可。
 * 人物の種は公開プロフィール GET。アカウント詳細はクライアントが GET /api/me。
 */
export default async function ProfileSettingsPage({ searchParams }: PageProps) {
  const entry = parseEntry(await searchParams);
  const viewerId = await getServerViewerUserId();

  if (!viewerId && !USE_MOCK_API) {
    redirect(`${APP_ROUTES.login}?next=${encodeURIComponent("/settings/profile")}`);
  }

  const profile = viewerId ? await getPublicUser(viewerId) : null;
  const user: PublicUser = profile
    ? {
        id: profile.id,
        name: profile.name,
        profile_url: profile.profile_url,
        avatar_url: profile.avatar_url ?? null,
      }
    : MOCK_OWNER_USER;
  const summary = getMypageSummary(user, { viewerUserId: user.id });

  const snsHref = (kind: (typeof summary.sns)[number]["kind"]) =>
    summary.sns.find((s) => s.kind === kind)?.href ?? "";

  const links = [0, 1, 2].map((i) => ({
    title: summary.profileLinks[i]?.label ?? "",
    url: summary.profileLinks[i]?.href ?? "",
  }));

  // 本番／spike: SSR ではメール等を推測しない（クライアント spikeGetMe が正）
  const initialEmail = USE_MOCK_API
    ? `${user.id.toLowerCase()}@example.com`
    : "";

  return (
    <FormPageShell
      backHref={APP_ROUTES.profile(user.id)}
      backLabel="マイページへ"
      showPreviewBanner={false}
    >
      <ProfileSettingsView
        user={user}
        entry={entry}
        initial={{
          displayName: user.name,
          email: initialEmail,
          mailOptIn: true,
          bio: profile?.bio ?? summary.bio,
          links: USE_MOCK_API
            ? links
            : [
                { title: "", url: "" },
                { title: "", url: "" },
                { title: "", url: "" },
              ],
          sns: USE_MOCK_API
            ? {
                twitter: snsHref("x"),
                facebook: snsHref("facebook"),
                instagram: snsHref("instagram"),
                youtube: snsHref("youtube"),
                tiktok: "",
              }
            : {
                twitter: "",
                facebook: "",
                instagram: "",
                youtube: "",
                tiktok: "",
              },
          publicSize: profile?.public_size ?? [],
        }}
      />
    </FormPageShell>
  );
}

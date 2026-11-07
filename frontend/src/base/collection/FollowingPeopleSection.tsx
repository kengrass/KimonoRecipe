"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { FollowButton } from "@/base/ui/FollowButton";
import { UserAvatar } from "@/base/ui/UserAvatar";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import { PICKUP_USERS, type PopularUser } from "@/lib/discovery-data";
import {
  listManagedFollowing,
  subscribeFollowChange,
} from "@/lib/follow-state";
import { userProfilePath } from "@/lib/mypage-data";
import {
  contentCountsForUser,
  listDemoFollowing,
} from "@/lib/social-collections";
import type { PublicUser } from "@/lib/types";

type PeopleTab = "following" | "pickup";

function toRowUser(user: PublicUser | PopularUser): PopularUser {
  const counts = contentCountsForUser(user.id);
  return {
    id: user.id,
    name: user.name,
    profile_url: user.profile_url,
    coordinateCount:
      "coordinateCount" in user && user.coordinateCount != null
        ? user.coordinateCount
        : counts.coordinateCount,
    itemCount:
      "itemCount" in user && user.itemCount != null
        ? user.itemCount
        : counts.itemCount,
  };
}

function UserRow({ user }: { user: PopularUser }) {
  const counts = contentCountsForUser(user.id);
  const coords = user.coordinateCount ?? counts.coordinateCount;
  const items = user.itemCount ?? counts.itemCount;

  return (
    <li className="flex items-center gap-2.5 py-2.5">
      <Link
        href={userProfilePath(user.id)}
        className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-90"
      >
        <UserAvatar
          name={user.name}
          seed={user.id}
          className="h-9 w-9 shrink-0 text-sm"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm text-kr-link">
            {user.name}
          </span>
          <span className="block text-[11px] text-kr-muted">
            {coords}コーデ／{items}アイテム
          </span>
        </span>
      </Link>
      <FollowButton userId={user.id} variant="compact" />
    </li>
  );
}

function PeopleList({ users }: { users: PopularUser[] }) {
  if (users.length === 0) {
    return (
      <p className="mt-2 text-xs text-kr-muted">表示できる人がいません。</p>
    );
  }
  return (
    <ul className="mt-1 divide-y divide-kr-border border-y border-kr-border">
      {users.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
    </ul>
  );
}

function tabFromHash(): PeopleTab {
  if (typeof window === "undefined") return "following";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "pickup") return "pickup";
  return "following";
}

type Props = {
  initialFollowing?: PublicUser[];
  initialPickup?: PopularUser[];
  viewerId?: string | null;
};

/**
 * フォロー画面の人ブロック。
 * フォロー中／おすすめは上下並びではなくタブ切替（長いリストの二重スクロールを避ける）。
 */
export function FollowingPeopleSection({
  initialFollowing,
  initialPickup,
  viewerId: viewerIdProp,
}: Props = {}) {
  const pathname = usePathname();
  const { currentUser, isLoggedIn } = useMockAuth();
  const viewerId = viewerIdProp ?? currentUser?.id ?? null;
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<PeopleTab>("following");
  const [following, setFollowing] = useState<PublicUser[]>(
    () => initialFollowing ?? [],
  );

  useEffect(() => {
    setMounted(true);
    setTab(tabFromHash());
  }, []);

  useEffect(() => {
    setTab(tabFromHash());
  }, [pathname]);

  useEffect(() => {
    if (!viewerId || !isLoggedIn) {
      setFollowing(initialFollowing ?? []);
      return;
    }
    // spike 時はサーバ渡した一覧を正にする（モック ID で上書きしない）
    if (USE_SPIKE_API) {
      setFollowing(initialFollowing ?? []);
      return;
    }
    const sync = () => setFollowing(listManagedFollowing(viewerId));
    if (!initialFollowing) {
      setFollowing(listDemoFollowing(viewerId));
    }
    sync();
    return subscribeFollowChange(sync);
  }, [viewerId, isLoggedIn, initialFollowing]);

  const hidePickup = useMemo(() => {
    const ids = new Set(following.map((u) => u.id));
    if (viewerId) ids.add(viewerId);
    return ids;
  }, [following, viewerId]);

  const pickup = useMemo(() => {
    if (initialPickup) {
      return initialPickup.filter((u) => !hidePickup.has(u.id));
    }
    return PICKUP_USERS.filter((u) => !hidePickup.has(u.id));
  }, [initialPickup, hidePickup]);

  const showFollowing = mounted && isLoggedIn && viewerId;
  const activeTab: PeopleTab = showFollowing ? tab : "pickup";

  const selectTab = (next: PeopleTab) => {
    setTab(next);
    const hash = next === "pickup" ? "pickup" : "follow-list";
    history.replaceState(null, "", `#${hash}`);
  };

  return (
    <div
      id="follow-list"
      className="scroll-mt-[var(--kr-aside-sticky-top,6.75rem)]"
    >
      {/* ディープリンク用（#pickup） */}
      <span id="pickup" className="sr-only" aria-hidden />

      {showFollowing ? (
        <div
          className="mb-3 flex rounded border border-kr-border p-0.5 text-[11px]"
          role="tablist"
          aria-label="フォロー中とおすすめ"
        >
          {(
            [
              {
                id: "following" as const,
                label: "フォロー中",
                count: following.length,
              },
              { id: "pickup" as const, label: "おすすめ" },
            ] as const
          ).map((opt) => {
            const active = activeTab === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(opt.id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 ${
                  active
                    ? "bg-kr-navy font-medium text-white"
                    : "text-kr-muted hover:text-kr-text"
                }`}
              >
                <span>{opt.label}</span>
                {"count" in opt ? (
                  <span
                    className={`tabular-nums ${
                      active ? "text-white/75" : "text-kr-muted"
                    }`}
                  >
                    {opt.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <h2 className="text-sm font-semibold text-kr-text">おすすめ</h2>
      )}

      {activeTab === "following" && showFollowing ? (
        following.length === 0 ? (
          <p className="mt-2 text-xs text-kr-muted">
            まだいません。「おすすめ」から選べます。
          </p>
        ) : (
          <PeopleList users={following.map(toRowUser)} />
        )
      ) : (
        <PeopleList users={pickup} />
      )}
    </div>
  );
}

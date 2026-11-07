/**
 * Next コレクション（いいね／フォロー）の一覧組み立て。
 * 会員専用 API（公開一覧とは別口）。
 */
import {
  getMeFavoritesPage,
  getMeFollowingPostsPage,
  getMeFollowingUsers,
  getPickupUsers,
} from "@/lib/api";
import { USE_SPIKE_API } from "@/lib/config";
import type { PopularUser } from "@/lib/discovery-data";
import type { PaginatedResult } from "@/lib/pagination";
import type { ContentKind } from "@/lib/content-kind";
import { listDemoFollowing } from "@/lib/social-collections";
import type { PublicListItem, PublicUser } from "@/lib/types";

export type CollectionCounts = {
  coordinates: number;
  items: number;
};

export type LikesPagePayload =
  | { kind: "guest" }
  | {
      kind: "member";
      mode: ContentKind;
      list: PaginatedResult<PublicListItem>;
      counts: CollectionCounts;
    };

export type FollowingPagePayload =
  | {
      kind: "guest";
      pickup: PopularUser[];
    }
  | {
      kind: "member";
      mode: ContentKind;
      list: PaginatedResult<PublicListItem>;
      following: PublicUser[];
      pickup: PopularUser[];
    };

async function totalFavorites(mode: ContentKind): Promise<number> {
  const page = await getMeFavoritesPage(mode, { page: 1, perPage: 1 });
  return page.total;
}

/**
 * お気に入り一覧。未ログインは API を叩かない。
 */
export async function buildLikesPage(args: {
  mode: ContentKind;
  page: number;
  viewerUserId: string | null;
}): Promise<LikesPagePayload> {
  if (!args.viewerUserId) return { kind: "guest" };

  const otherMode: ContentKind =
    args.mode === "coordinates" ? "items" : "coordinates";

  const [list, otherTotal] = await Promise.all([
    getMeFavoritesPage(args.mode, { page: args.page }),
    totalFavorites(otherMode),
  ]);

  return {
    kind: "member",
    mode: args.mode,
    list,
    counts: {
      coordinates:
        args.mode === "coordinates" ? list.total : otherTotal,
      items: args.mode === "items" ? list.total : otherTotal,
    },
  };
}

/**
 * フォロー一覧。未ログインは Pick up のみ。
 */
export async function buildFollowingPage(args: {
  mode: ContentKind;
  page: number;
  viewerUserId: string | null;
}): Promise<FollowingPagePayload> {
  if (!args.viewerUserId) {
    return {
      kind: "guest",
      pickup: await getPickupUsers(12),
    };
  }

  const [list, spikeFollowing] = await Promise.all([
    getMeFollowingPostsPage(args.mode, {
      page: args.page,
    }),
    USE_SPIKE_API ? getMeFollowingUsers() : Promise.resolve(null),
  ]);

  const pickupAll = await getPickupUsers(12);

  if (USE_SPIKE_API) {
    const followedIds = new Set(
      (spikeFollowing ?? []).map((u) => u.id),
    );
    followedIds.add(args.viewerUserId);
    return {
      kind: "member",
      mode: args.mode,
      list,
      following: spikeFollowing ?? [],
      pickup: pickupAll.filter((u) => !followedIds.has(u.id)),
    };
  }

  const following = listDemoFollowing(args.viewerUserId);
  const followedIds = new Set(following.map((u) => u.id));
  followedIds.add(args.viewerUserId);

  return {
    kind: "member",
    mode: args.mode,
    list,
    following,
    pickup: pickupAll.filter((u) => !followedIds.has(u.id)),
  };
}

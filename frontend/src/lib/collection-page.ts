import { APP_ROUTES } from "./laravel-urls";
import {
  contentKindFromShort,
  contentKindToShort,
  type ContentKind,
} from "./content-kind";

export type CollectionPageParams = {
  mode: ContentKind;
  page?: number;
};

export function parseCollectionPageParams(raw: {
  m?: string;
  page?: string;
}): { mode: ContentKind; page: number } {
  const parsed = parseInt(raw.page ?? "1", 10);
  return {
    mode: contentKindFromShort(raw.m),
    page: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
  };
}

function buildCollectionHref(
  base: string,
  { mode, page = 1 }: CollectionPageParams,
): string {
  const params = new URLSearchParams();
  if (mode === "items") params.set("m", contentKindToShort(mode));
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function buildLikesHref(params: CollectionPageParams): string {
  return buildCollectionHref(APP_ROUTES.likes, params);
}

export function buildFollowingHref(params: CollectionPageParams): string {
  return buildCollectionHref(APP_ROUTES.following, params);
}

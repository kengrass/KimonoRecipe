"use client";

import Link from "next/link";
import { buildSearchHref, type SearchMode } from "@/lib/search-catalog";
import { APP_ROUTES } from "@/lib/laravel-urls";

export type TagItem = string | { name: string; count?: number };

type Props = {
  tags: TagItem[];
  /** タップ時の検索モード（コーデ／アイテム） */
  mode?: SearchMode;
  /** 件数（name → count）。プロフィールのよく使うタグ向け */
  counts?: Record<string, number>;
};

function tagName(item: TagItem): string {
  return typeof item === "string" ? item : item.name;
}

function tagCount(item: TagItem, counts?: Record<string, number>): number | undefined {
  if (typeof item === "object" && item.count != null) return item.count;
  const name = tagName(item);
  return counts?.[name];
}

/**
 * 詳細・プロフィール共通のタグリンク。
 * 写真主役向けに #タグ テキスト（チップ枠は使わない）。
 */
export function TagList({ tags, mode = "coordinates", counts }: Props) {
  if (!tags.length) return null;

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
      {tags.map((item) => {
        const name = tagName(item);
        const count = tagCount(item, counts);
        return (
          <li key={name}>
            <Link
              href={buildSearchHref({ mode, tag: name }, APP_ROUTES.search)}
              className="text-sm text-kr-link hover:underline"
            >
              #{name}
              {count != null ? (
                <span className="ml-1 text-xs text-kr-muted">{count}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

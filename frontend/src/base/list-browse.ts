import { rememberListFocus } from "@/base/ListFocusRestore";
import type { BrowseKind } from "@/lib/browse";
import { rememberDetailBrowse } from "@/lib/detail-browse";
import type { PublicListItem } from "@/lib/types";

type Args = {
  kind: BrowseKind;
  /** 前後ナビに載せる一覧（通常は今のページ分） */
  list: PublicListItem[];
  label: string;
  item: PublicListItem;
  trackListFocus?: boolean;
};

/**
 * 一覧タイル → 詳細の Browse／フォーカス記憶（検索・マイページ共通）。
 * items も載せる：マイページの非公開は public neighbors に無いため、
 * ID だけだと詳細の ＜＞ が無効化される。
 */
export function listTileBrowseProps({
  kind,
  list,
  label,
  item,
  trackListFocus = true,
}: Args) {
  return {
    onClick: () => {
      rememberDetailBrowse({
        kind,
        ids: list.map((entry) => entry.id),
        items: list,
        label,
        trackListFocus,
      });
      rememberListFocus(kind, item.id);
    },
  };
}

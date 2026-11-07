"use client";

import { PublicTileGrid } from "@/base/PublicTileGrid";
import { listTileBrowseProps } from "@/base/list-browse";
import type { BrowseKind } from "@/lib/browse";
import type { PublicListItem } from "@/lib/types";

type Props = {
  kind: BrowseKind;
  items: PublicListItem[];
  label: string;
};

/** トップ一覧：詳細の <> がこの一覧文脈になるようセッションを載せる */
export function HomeListGrid({ kind, items, label }: Props) {
  return (
    <PublicTileGrid
      items={items}
      linkProps={(item) =>
        listTileBrowseProps({
          kind,
          list: items,
          label,
          item,
        })
      }
    />
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PaginationBar } from "@/base/PaginationBar";
import { TileImage } from "@/base/TileImage";
import {
  AttachResultTile,
  attachTileCaption,
} from "@/base/detail/AttachResultTile";
import { FilterSelect } from "@/base/ui/FilterSelect";
import { ModalDialog } from "@/base/ui/ModalDialog";
import { getOwnerListPage } from "@/lib/api";
import type { ContentKind } from "@/lib/content-kind";
import type { MypageSeason } from "@/lib/mypage-types";
import {
  type OwnerListFacets,
  type OwnerListQuery,
} from "@/lib/owner-list-query";
import { paginateList } from "@/lib/pagination";
import type { PublicListItem } from "@/lib/types";

const PAGE_SIZE = 9;

const MYPAGE_SEASON_OPTIONS: { id: MypageSeason; label: string }[] = [
  { id: "春", label: "春" },
  { id: "夏", label: "夏" },
  { id: "秋", label: "秋" },
  { id: "冬", label: "冬" },
];

export type AttachConfirmResult = {
  selectedIds: string[];
  addedIds: string[];
  removedIds: string[];
  /** owner 一覧から得た選択行（確定時の表示用。保存は親が spike PUT 等） */
  selectedRows: PublicListItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  /**
   * 追加したい側の種別。
   * - items: コーデ詳細からアイテムを追加
   * - coordinates: アイテム詳細からコーデを追加
   */
  kind: ContentKind;
  ownerUserId: string;
  /** 紐付け元の写真（確認用） */
  preview: { src: string; alt: string };
  /** すでに紐付いている id */
  linkedIds?: string[];
  /**
   * すでに紐付いている行（「紐付け済みのみ」表示用）。
   * 一覧 API を別口にせず、詳細に載っている分を渡す。
   */
  linkedRows?: PublicListItem[];
  onConfirm?: (result: AttachConfirmResult) => void;
};

/**
 * 所有者向け：構成アイテム／利用コーデ追加モーダル。
 * 一覧は `GET /api/owner/coordinates|items`（モック時も同経路）。
 * 確定後の永続化は親（CoordinateDetailView / ItemDetailView）が行う。
 */
export function AttachSearchDialog({
  open,
  onClose,
  kind,
  ownerUserId,
  preview,
  linkedIds = [],
  linkedRows = [],
  onConfirm,
}: Props) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [systemCategory, setSystemCategory] = useState<string | undefined>();
  const [season, setSeason] = useState<MypageSeason | "">("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PublicListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<OwnerListFacets | undefined>();
  const [loading, setLoading] = useState(false);
  const rowCache = useRef<Map<string, PublicListItem>>(new Map());

  const linked = useMemo(() => new Set(linkedIds), [linkedIds]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(linkedIds));
    setQ("");
    setLinkedOnly(false);
    setSystemCategory(undefined);
    setSeason("");
    setPage(1);
    for (const row of linkedRows) {
      rowCache.current.set(row.id, row);
    }
  }, [open, linkedIds, linkedRows]);

  useEffect(() => {
    if (!open) return;

    if (linkedOnly) {
      const filtered = linkedRows.filter((row) => {
        if (!q.trim()) return true;
        const hay = [row.title, ...row.tags, row.category ?? ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      });
      const paged = paginateList(filtered, page, PAGE_SIZE);
      setRows(paged.items);
      setTotalPages(paged.totalPages);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const query: OwnerListQuery = {
      q: q.trim() || undefined,
      page,
      perPage: PAGE_SIZE,
    };

    if (kind === "items") {
      if (systemCategory) {
        query.categoryMode = "system";
        query.category = systemCategory;
      }
    } else {
      query.coordinateView = "season";
      if (season && season !== "all") query.season = season;
    }

    void getOwnerListPage(
      kind === "items" ? "items" : "coordinates",
      ownerUserId,
      query,
      { includeFacets: true },
    ).then((result) => {
      if (cancelled) return;
      for (const row of result.items) {
        rowCache.current.set(row.id, row);
      }
      setRows(result.items);
      setTotalPages(result.totalPages);
      if (result.facets) setFacets(result.facets);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    kind,
    ownerUserId,
    q,
    page,
    systemCategory,
    season,
    linkedOnly,
    linkedRows,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const diff = useMemo(() => {
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    for (const id of selected) {
      if (!linked.has(id)) addedIds.push(id);
    }
    for (const id of linked) {
      if (!selected.has(id)) removedIds.push(id);
    }
    return { addedIds, removedIds };
  }, [selected, linked]);

  const title =
    kind === "items" ? "アイテムを紐づけ" : "コーディネートを紐づけ";
  const placeholder =
    kind === "items"
      ? "アイテム名・タグで検索"
      : "コーデ名・タグで検索";
  const emptyLabel =
    kind === "items"
      ? "該当するアイテムがありません"
      : "該当するコーデがありません";
  const linkedOnlyLabel =
    kind === "items"
      ? "紐付け済みのアイテムのみ表示"
      : "紐付け済みのコーディネートのみ表示";

  const systemCategories = (facets?.itemCategories ?? []).filter(
    (c) => c.count > 0,
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedRows: PublicListItem[] = [];
    for (const id of selected) {
      const row = rowCache.current.get(id);
      if (row) selectedRows.push(row);
    }
    onConfirm?.({
      selectedIds: [...selected],
      addedIds: diff.addedIds,
      removedIds: diff.removedIds,
      selectedRows,
    });
    onClose();
  };

  const withCaptions = rows.some((item) =>
    Boolean(attachTileCaption(item, kind)),
  );
  const resetPage = () => setPage(1);
  const hasDiff = diff.addedIds.length > 0 || diff.removedIds.length > 0;

  const footerSummary = (() => {
    const parts: string[] = [];
    if (diff.addedIds.length > 0) parts.push(`追加 ${diff.addedIds.length}`);
    if (diff.removedIds.length > 0) {
      parts.push(`解除 ${diff.removedIds.length}`);
    }
    if (parts.length === 0) return `${selected.size}件選択（変更なし）`;
    return `${parts.join("・")}（選択 ${selected.size}）`;
  })();

  return (
    <ModalDialog
      open={open}
      title={title}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-xs text-kr-muted">
            {footerSummary}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-kr-muted hover:bg-neutral-100 hover:text-kr-text"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasDiff}
              className="whitespace-nowrap rounded bg-kr-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-kr-navy/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              紐づけを確定
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-3 overflow-hidden rounded-xl bg-neutral-50">
        <div className="relative mx-auto aspect-square w-full max-w-[7.5rem] sm:max-w-[9rem]">
          <TileImage
            src={preview.src}
            alt={preview.alt}
            fill
            sizes="144px"
            className="object-contain"
          />
        </div>
        <p className="whitespace-nowrap px-3 py-2 text-center text-[11px] text-kr-muted sm:text-xs">
          写真を見ながら選んで、下で確定（複数可）
        </p>
      </div>

      <label className="sr-only" htmlFor="attach-search-q">
        {placeholder}
      </label>
      <input
        id="attach-search-q"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          resetPage();
        }}
        placeholder={placeholder}
        className="mb-3 w-full rounded border border-kr-border px-3 py-2 text-sm outline-none focus:border-kr-navy"
        autoFocus
      />

      {kind === "items" ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterSelect
            label="カテゴリ"
            value={systemCategory ?? ""}
            onChange={(v) => {
              setSystemCategory(v || undefined);
              resetPage();
            }}
            options={systemCategories.map((c) => ({
              value: c.name,
              label: c.name,
            }))}
          />
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterSelect
            label="季節"
            value={season}
            onChange={(v) => {
              setSeason((v || "") as MypageSeason | "");
              resetPage();
            }}
            options={MYPAGE_SEASON_OPTIONS.map((s) => ({
              value: s.id,
              label: s.label,
            }))}
          />
        </div>
      )}

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-kr-text">
        <input
          type="checkbox"
          checked={linkedOnly}
          onChange={(e) => {
            setLinkedOnly(e.target.checked);
            resetPage();
          }}
          className="h-3.5 w-3.5 rounded border-kr-border accent-kr-navy"
        />
        {linkedOnlyLabel}
      </label>

      {loading ? (
        <p className="py-8 text-center text-sm text-kr-muted">読み込み中…</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-kr-muted">{emptyLabel}</p>
      ) : (
        <>
          <ul
            className={`grid grid-cols-3 gap-[var(--kr-tile-gap)] ${
              withCaptions ? "detail-tile-grid--meta" : ""
            }`}
          >
            {rows.map((item) => (
              <li key={item.id}>
                <AttachResultTile
                  item={item}
                  kind={kind}
                  selected={selected.has(item.id)}
                  linked={linked.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              </li>
            ))}
          </ul>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="!mt-4"
          />
        </>
      )}
    </ModalDialog>
  );
}

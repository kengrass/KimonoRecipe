# 一覧・検索・マイページ一覧 — 共通の作り方

**エンドポイント一覧:** [`API_CATALOG.md`](./API_CATALOG.md)

**方針: 絞って持ってくる。**  
全部取ってフロントで絞らない。公開検索もマイページ一覧も **同じ構造** で、対象範囲だけ変える。

```
URL クエリ
  → API（サーバが条件＋権限で絞る）
  → { data: 一覧1件[] }
  → 同じタイルで表示
```

現行サービスの検索スパゲッティは移植しない。この契約に置き換える。

---

## 1. 共通ルール

| # | 内容 |
|---|------|
| 1 | フィルタ・公開判定は **サーバのみ** |
| 2 | レスポンスは `{ "data": [...] }`（配列直返ししない） |
| 3 | 1件の形は一覧カード（公開は `PublicListItem`） |
| 4 | フロントは URL ↔ クエリ変換と表示だけ |
| 5 | 「持ってきて絞る」「画面ごとに別ロジック」は禁止 |

モックの `search-catalog.ts` は一覧プール生成用。絞り込みの正は `public-list-query` / `owner-list-query`（API 経由）。フロント画面での再フィルタは禁止。

---

## 2. 公開（トップ・検索）

| | |
|--|--|
| 対象 | 公開コンテンツのみ |
| API | `GET /api/public/coordinates` ・ `GET /api/public/items` |
| UI | `/`（新着）・ `/search`（条件付き） |

### クエリ（サーバで解釈）

| クエリ | 意味 | 備考 |
|--------|------|------|
| （なし） | 新着先頭セット | トップ用。`posted_at` 降順 |
| `q` | フリーテキスト | `title` / `user.name` / `tags` |
| `tag` | タグ完全一致 | |
| `g` | `women` \| `men` \| `kids` | |
| `season` | `春` \| `夏` \| `秋` \| `冬` | `seasons` に含むもの |
| `cat` | システムカテゴリ | **アイテム:** 自身の `category`。**コーデ:** 紐づく**公開**アイテムの `category`（スケール方針: [`SEARCH_SCALE.md`](./SEARCH_SCALE.md)） |
| `obi` | 帯結び | **コーデのみ** |
| `page` | ページ（1始まり） | **検索で使用**。トップは省略可 |
| `per_page` | 1ページ件数 | 省略時 **12** |
| `user` | 投稿者ユーザー ID | **他人プロフィール一覧**。公開のみ。owner／非公開は載せない |
| `scope` | ~~all \| favorite \| following~~ | **廃止（公開一覧）**。会員一覧は `/api/me/...` |

### 会員コレクション（公開一覧とは別口）

| Method | Path | 用途 |
|--------|------|------|
| `GET` | `/api/me/favorites` | いいねした投稿（`kind` + `page`） |
| `GET` | `/api/me/following/posts` | フォロー中の投稿 |

公開 API に `scope` で混ぜない（キャッシュ・権限境界）。

### 検索のページネーション（必須）

```
条件で絞る → total を確定 → page/per_page で切片 →
{ data: 1ページ分, meta: { page, per_page, total, total_pages } }
```

| | |
|--|--|
| 既定件数 | 12（転送・描画を抑える） |
| トップ | クエリなしの先頭セットで可（`meta` 任意） |
| 検索 UI | URL `page` ↔ API `page`。`PaginationBar` で送り |

### UI の見せ方（現状据え置き）

API は常にチャンク返す。画面側だけ次のとおり。詳細は `.cursor/rules/list-pagination-policy.mdc`。

| 画面 | UI | 備考 |
|------|-----|------|
| トップ | 先頭セット ＋「もっと見る」→ 検索 | ページネーション不要 |
| 検索 | **ページネーション** | `CollectionList`（タイトルなし） |
| マイページ一覧 | **ページネーション** | `CollectionList`＋所有者オーバーレイ |
| いいね／フォロー | **ページネーション** | `CollectionList` |

無限スクロールは当面採用しない。

モックの `mypage-enrich` は owner／プロフィール一覧 API のサーバ側相当。本番でも **同じクエリで絞って返す**（フロント再フィルタしない）。

レスポンス1件: [`API_CONTRACT.md`](./API_CONTRACT.md) / `PublicListItem`（`frontend/src/lib/types.ts`）。

公開APIに本人の非公開を混ぜない。詳細は同ドキュメント「公開コンテンツ以外を絶対に出さない」。

---

## 3. マイページ（自分の一覧）

| | |
|--|--|
| 対象 | **ログイン本人の投稿のみ**（非公開含む） |
| API | owner／mypage 用一覧（公開APIとは **別エンドポイント**） |
| UI | `/m/[自己id]` の一覧・絞り込み |
| 構造 | 公開と同じ（クエリでサーバが絞る → `data[]`） |

### 想定エンドポイント（owner 一覧）

| Method | Path | 用途 |
|--------|------|------|
| `GET` | `/api/owner/coordinates` | 自分のコーデ一覧＋絞り込み |
| `GET` | `/api/owner/items` | 自分のアイテム一覧＋絞り込み |

※ パス名は実装時相談可。**公開の `/api/public/...` に flag で混ぜない。**

### クエリ（公開と揃えるもの＋一覧固有）

公開と同じく使えるもの: `q` / `g` / `season` / `cat` / `obi` / `page`

マイページ固有（URL・API とも同じ語彙。実装: `mypage-state`）:

| 意味 | クエリ | 備考 |
|------|--------|------|
| 季節一覧 | `season` | コーデ。旧 `s` は読み取り互換 |
| 仮コーデ | `temp=1` | コーデ。旧 `v=t` |
| システムカテゴリ | `cat` | アイテム。旧 `c` |
| 断捨離候補 | `declutter=1` | アイテム。旧 `cm=dc` |
| 並べ替え | `sort` | 旧 `o` |
| 公開状態 | `status=public\|private` | owner のみ（任意） |
| ファセット | `include_facets=1` | 任意。チップ用集計（形は [`API_CONTRACT.md`](./API_CONTRACT.md)） |

タブは検索と同じ `m=c\|i`（旧 `t=i`）。ページは `page`（旧 `p`）。

**契約外:** 旧 `my_folder` / `my_category` クエリは読み取り契約に含めない（フロントは季節・システムカテゴリへ寄せるのみ）。

1件の形: 一覧カード ＋ 本人向けに `owner_status` 等を載せてよい（公開APIには載せない）。

owner 一覧は任意で `visibility_by_id`（当該ページ分）。他人プロフィールは公開一覧に `user=` ＋必要なら同じ `include_facets=1`。

一覧 UI は現状 `PaginationBar`（ページネーション）。「もっと見る」への変更は API 契約を壊さず検討可。

### 禁止

- 公開APIで「自分のときだけ非公開も返す」
- マイページ用に全件ダウンロードしてフロントだけで仕分け

---

## 4. 領域と実装の目安順

正式棚でも同じ順が安全な **領域の目安**。

| 順 | 内容 |
|----|------|
| 1 | 公開一覧（トップ）＋ **同じAPIに検索クエリ**（絞って返す） |
| 2 | 公開詳細（`/c` `/i`。関連は詳細レスポンスに含める） |
| 3 | owner 詳細フル・owner 一覧・`GET /api/public/users/{id}`・公開一覧 `user=` |
| 4 | `/api/me/...`（いいね／フォロー） |

Next UI は既にこの契約に接続済み（モック／spike）。  
- 詳細: `load-detail`（本人 → owner フル／それ以外 → public）＋ neighbors  
- マイページ: `getPublicUser` ＋ `getOwnerListPage`／`getPublicProfileListPage`  
手続き: [`../spike/docs/API.md`](../spike/docs/API.md) ・ 契約: [`API_CONTRACT.md`](./API_CONTRACT.md)

---

## 5. 関連

- 全体契約: [`API_CONTRACT.md`](./API_CONTRACT.md)
- 渡すセット: [`HANDOFF.md`](./HANDOFF.md)
- 検索の件数増対策: [`SEARCH_SCALE.md`](./SEARCH_SCALE.md)
- Next UI: `frontend/src/app/(main)/` ・ `frontend/src/base/`

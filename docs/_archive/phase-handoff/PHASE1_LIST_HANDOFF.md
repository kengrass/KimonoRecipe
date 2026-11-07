# 公開一覧 API — フィールド見本（旧 Phase1）

> **Phase1〜3 の作業段階は廃止。** 既存 Laravel DB への接続指示としては使わない。  
> 本番の正: [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md) ・ [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md)  
> 本ファイルは **パス／JSON 形の見本**として残す。

**方針の正:** [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)  
（絞って持ってくる。検索もマイページ一覧も同じ構造・経路だけ分ける）

**対象エンドポイント（形の見本）**

- `GET /api/public/coordinates`
- `GET /api/public/items`
- 上記に **検索用クエリ**（サーバ側で絞る）。レスポンス1件の形は常に同じ

`user=` と owner 一覧は [`PHASE3_OWNER_HANDOFF.md`](./PHASE3_OWNER_HANDOFF.md)。  
詳細は [`PHASE2_DETAIL_HANDOFF.md`](./PHASE2_DETAIL_HANDOFF.md)。

Next UI（`/` ・ `/search`）が期待する定義と見本です。

---

## 見るもの（この4つ）

| # | 内容 | パス |
|---|------|------|
| 1 | 一覧・検索・マイページの共通方針 | [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) |
| 2 | 本ファイル（Phase1 公開一覧の項目・受け入れ） | |
| 3 | 見本レスポンス | `frontend/src/mocks/api/public/coordinates/list.json` ・ `items/list.json` |
| 4 | 画面 | `frontend/src/app/(main)/` ＋ `frontend/src/base/` |

型の正: `frontend/src/lib/types.ts` の `PublicListItem` / `ListResponse` / `PublicUser` / `ContentSeason`

---

## エンドポイント（Phase1）

| Method | Path | 用途 |
|--------|------|------|
| `GET` | `/api/public/coordinates` | 公開コーデ（トップ新着／検索） |
| `GET` | `/api/public/items` | 公開アイテム（トップ新着／検索） |

### レスポンス形

**トップ（クエリなし・先頭セット）**

```json
{ "data": [ /* PublicListItem */ ] }
```

`meta` は省略可（先頭セットのみ返す想定）。

**検索（`/search` 接続・ページネーション必須）**

```json
{
  "data": [ /* 当該ページの PublicListItem のみ */ ],
  "meta": {
    "page": 1,
    "per_page": 12,
    "total": 120,
    "total_pages": 10
  }
}
```

- 並び: **新しい順**（`posted_at` 降順）を既定とする
- **フィルタはサーバで適用済み**の結果だけを返す（フロントで再絞りしない前提）
- `data` は **1ページ分だけ**（全件を載せない）

### クエリ（サーバで絞る）

| クエリ | 意味 | 必須 | 備考 |
|--------|------|------|------|
| （なし） | 新着先頭 | | トップ用。ページネーション不要 |
| `q` | フリーテキスト | | `title` / `user.name` / `tags` |
| `tag` | タグ完全一致 | | |
| `g` | `women` \| `men` \| `kids` | | |
| `season` | `春` \| `夏` \| `秋` \| `冬` | | `seasons[]` に含む |
| `cat` | システムカテゴリ | | **items のみ**。coordinates では無視または400 |
| `obi` | 帯結び | | **coordinates のみ** |
| `page` | ページ（1始まり） | 検索 | 省略時は1。フロント URL も `page`（1は省略可） |
| `per_page` | 1ページ件数 | | 省略時は **12**（フロント `LIST_PAGE_SIZE` と一致） |

### ページネーション契約（検索）

| 項目 | 定義 |
|------|------|
| 既定 `per_page` | **12** |
| `page` | 1始まり。範囲外は末頁に寄せるか 1 頁目（実装で統一） |
| `meta.total` | 条件に合う公開件数（ページング前） |
| `meta.total_pages` | `ceil(total / per_page)`。0件でも最低1としてよい |
| `meta.page` / `meta.per_page` | 実際に適用した値 |
| ランニング | ページ単位で返す（全件転送しない） |

フロント: `SearchView` ＋ `PaginationBar`。URL の `page` を API の `page` に渡す。

---

## 1件の項目（`PublicListItem`）

### 共通

| 項目 | 内容 | 備考 |
|------|------|------|
| `id` | ID | 必須 |
| `title` | タイトル | キー必須。`""` 可 |
| `image_url` | 代表画像URL | 必須 |
| `user.id` | 投稿者ID | 必須 |
| `user.name` | 投稿者名 | 必須 |
| `user.profile_url` | プロフィールURL | 必須（相対推奨 `/m/...`） |
| `posted_at` | 投稿日時 | 必須（ISO8601） |
| `tags` | タグ | キー必須。`[]` 可 |
| `seasons` | 季節（複数可） | キー必須。`[]` 可。値は `春`\|`夏`\|`秋`\|`冬` |
| `detail_url` | 詳細URL | 必須（相対推奨） |
| `gender` | 性別 | 必須（`women`\|`men`\|`kids`） |

### コーデ一覧のみ

| 項目 | 内容 |
|------|------|
| `obi_knot` | 帯結び（必須）。`category` は載せない |

### アイテム一覧のみ

| 項目 | 内容 |
|------|------|
| `category` | システムカテゴリ（必須）。`obi_knot` は載せない |

本命1件:

- コーデ: `frontend/src/mocks/api/public/coordinates/_list/FgNzIyU.json`
- アイテム: `frontend/src/mocks/api/public/items/_list/ISSIeSA.json`

---

## 受け入れ条件（これで OK）

1. **公開のみ**（次節）
2. **必須欠けは不正**／空の `image_url` は返さない
3. **`title: ""` / `seasons: []` は正常**
4. **所有者専用フィールドを含めない**
5. **見本 `list.json` とキー集合が一致**
6. **クエリありでも1件の形は同じ**（絞ってから返す）
7. **フロント再フィルタ前提にしない**（サーバ結果が正）
8. **検索は `meta` 付きページネーション**（`data` は1ページ分のみ。既定12件）

---

## 公開コンテンツ以外を絶対に出さない（担保）

フロントやクエリで隠す、は不可。**サーバが公開行だけを返す**ことが唯一の正です。

### エンジニア側で必ずやること

| # | 内容 |
|---|------|
| 1 | DB／クエリで `visibility = public`（または同等）を**必須条件**にする |
| 2 | 公開一覧用のクエリ／Repository を owner 用と**分離**する |
| 3 | レスポンスに `owner_status` / `visibility` / 非公開メモ等を**載せない** |
| 4 | 検索クエリも**同じ公開クエリの上に**条件を足す |
| 5 | 非公開 ID の詳細は **404**（存在が分かる 403 は避けるのが望ましい） |

### 受け入れで証明すること（テスト）

| # | 内容 |
|---|------|
| A | 非公開の既知 ID が一覧 `data[].id` に出ない（クエリなし／あり両方） |
| B | 公開→非公開で一覧から消える |
| C | 非公開→公開で戻る |
| D | 未ログイン／他者セッションでも A〜C が同じ |

モック非公開サンプル: `PrivCoord1` / `PrivCoord2` / `PrivItem1`

### 契約上の禁止

- 一覧を全部返してフロントが非公開や検索条件を除く
- 公開 API に本人の非公開を混ぜる（マイページは owner 一覧）

---

## 画面との対応

| UI | API |
|----|-----|
| `/` 新着コーデ | `GET /api/public/coordinates`（クエリなし） |
| `/` 新着アイテム | `GET /api/public/items`（クエリなし） |
| `/search` | 同 API ＋ 検索クエリ ＋ **`page` / `per_page`（`meta` 必須）** |

モック時の Next トップ: `frontend/src/base/home-data.ts`（見本 `list.json`）。  
モック時の検索: `getPublicListPage`（`public-list-query` で絞ってページング）。

---

## スコープ外（Phase1 で作らなくてよい）

- 詳細 `GET .../{id}`（Phase2）
- owner 詳細・**owner 一覧**（Phase3。構造は `LIST_QUERY_ARCHITECTURE.md`）

---

## 実装後の接続（参考）

`NEXT_PUBLIC_API_BASE_URL` 設定時、`frontend/src/lib/api.ts` の `getPublicListPage` が本番 API を呼ぶ。  
Next `/search` はすでにこの経路（モック時も同関数で絞ってページング）。

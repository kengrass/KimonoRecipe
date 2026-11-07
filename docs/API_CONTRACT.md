# API 契約メモ

フロント／spike が期待する API の形です。  
実装時のフィールド名は相談可ですが、**公開／所有者の分離**と下の必須／任意は維持してください。

作業の正は [`NEW_DB.md`](./NEW_DB.md) と [`../spike/docs/API.md`](../spike/docs/API.md)。

**エンジニア向け入口** → [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) ・ [`NEW_DB.md`](./NEW_DB.md) ・ [`API_FOR_ENGINEERS.md`](./API_FOR_ENGINEERS.md)  
**エンドポイント一覧** → [`API_CATALOG.md`](./API_CATALOG.md)  
**OpenAPI（読み取り中心）** → [`openapi.yaml`](./openapi.yaml)  
**一覧・検索・マイページの共通方針** → [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)  
**渡すセット** → [`HANDOFF.md`](./HANDOFF.md)

## 必須・任意（ドメイン）

登録・保存時に必須なものと、レスポンス上の扱いです。

### 命名規則（初見向け）

| UI | API / コード | 型・値 | メモ |
|----|--------------|--------|------|
| カテゴリ | `category` | string | システム必須 |
| コーデ／アイテム区分 | `coordinates` \| `items` | `ContentKind` | URL だけ `m=c\|i`（検索ユーザーは `m=u`） |
| 公開範囲（UI） | `visibility` | public \| private | owner JSON は `owner_status` |

- コード・型では長い名前。短い URL クエリは各 `*-state.ts` 先頭の対応表を正とする。
- `Coord` 略語は使わず `Coordinate`（型・コンポーネント名）。
- **Myフォルダ／Myカテゴリは本契約の対象外**（Next UI 撤去・新系にも載せない）。レスポンス／クエリに含めない。

| 項目 | 必須? | 備考 |
|------|-------|------|
| 公開範囲（visibility） | **必須** | 公開APIは `public` のみ返す。値は owner API の `owner_status` |
| 画像 | **必須** | 1枚以上。一覧は代表1枚 `image_url` |
| カテゴリ | **必須** | アイテム本体。コーデでは使用アイテム各々に `category` |
| 帯結び `obi_knot` | **必須（コーデ）** | アイテムには無し |
| 性別 `gender` | **必須** | `women` \| `men` \| `kids` |
| タイトル `title` | **任意** | 未設定は `""`。空は正常（バグではない） |
| 説明・タグ | 任意 | |
| 色調 `color_tone` | **UI 廃止**（互換でフィールドは残してよい） | 新規入力なし。詳細にも出さない |
| お気に入り `favorite_rank` | 任意（アイテム・**常に所有者のみ**） | 1〜5（星入力）。owner API のみ。未設定可 |
| 断捨離候補 `declutter_candidate` | 任意（アイテム・**常に所有者のみ**） | boolean。owner API のみ |

画面はタイトル空のとき「○○のコーディネート」等にフォールバックする。

---

## 共通ルール

- 公開APIは公開範囲が「公開」のもののみ返す（非公開は 404／一覧に出さない）
- 公開APIレスポンスに非公開メモ・`owner_status`・閲覧数・着用日・お気に入り度・断捨離を**含めない**
- 所有者向け情報は owner API のみ（フロントは「投稿者 === ログインユーザー」のときだけ呼ぶ）
- 所有者判定はサーバー側（クライアントの隠し表示に頼らない）
- 認証は既存セッション／Cookie（同一ドメイン前提）
- 一覧・詳細とも JSON。例は `data` 配列ラッパー（配列直返しも可・要相談）
- `profile_url` / `detail_url` は**相対パス推奨**（例: `/m/FL6QQa`, `/c/FgNzIyU`）

見本JSON: `frontend/src/mocks/api/`（パス＝本番API）

---

## 公開一覧

> **関連**: [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md)  

> **方針**: [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)（サーバで絞る。検索も同型）  
> 本命見本: `frontend/src/mocks/api/public/coordinates/list.json` ・ `items/list.json`  
> 型の正: `frontend/src/lib/types.ts` → `PublicListItem` / `ListResponse`

トップ「新着」と公開検索は **同じ2エンドポイント**。検索はクエリでサーバが絞る（フロント再フィルタ前提にしない）。

### クエリ（公開一覧共通）

| クエリ | 意味 | 備考 |
|--------|------|------|
| `q` / `tag` / `g` / `season` / `cat` / `obi` | 検索条件 | 詳細は LIST_QUERY |
| `page` / `per_page` | ページング | 既定 `per_page=12` |
| `user` | 投稿者ユーザー ID | **他人プロフィール一覧**。公開のみ。未指定＝全体 |

```
GET /api/public/coordinates?user=FL6QQa&page=1
GET /api/public/items?user=FL6QQa&page=1
```

フロント: `getPublicProfileListPage`。手続き見本: [`../spike/docs/API.md`](../spike/docs/API.md)。

### `GET /api/public/coordinates`

公開コーデ一覧。レスポンスは `{ "data": PublicListItem[] }`。

```json
{
  "data": [
    {
      "id": "FgNzIyU",
      "title": "ルミロックコーデ",
      "image_url": "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
      "user": {
        "id": "FL6QQa",
        "name": "Kensuke",
        "profile_url": "/m/FL6QQa"
      },
      "posted_at": "2016-04-29T15:45:00+09:00",
      "tags": ["ルミロック", "男の着物"],
      "seasons": ["秋"],
      "detail_url": "/c/FgNzIyU",
      "gender": "men",
      "obi_knot": "貝の口"
    }
  ]
}
```

必須キー: `id`, `image_url`, `user`, `posted_at`, `gender`, `obi_knot`, `detail_url`, `title`, `tags`, `seasons`  
（`title` は `""` 可。`tags` / `seasons` は `[]` 可。`category` は載せない。`seasons` の値は `春`\|`夏`\|`秋`\|`冬`）

検索結果も同型。フィルタ用クエリは [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)。

追加クエリ（~~会員コレクション~~ → 別口）:

公開一覧に `scope` は載せない。いいね／フォローは:

| クエリ | 値 | 用途 |
|--------|-----|------|
| — | `GET /api/me/favorites` | いいねした投稿 |
| — | `GET /api/me/following/posts` | フォロー中の投稿 |

### `GET /api/public/items`

公開アイテム一覧。形はコーデ一覧と同型だが **`category` 必須・`obi_knot` なし**。

```json
{
  "data": [
    {
      "id": "ISSIeSA",
      "title": "シルクウール着物 横段ブルーグレー",
      "image_url": "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
      "user": {
        "id": "FL6QQa",
        "name": "Kensuke",
        "profile_url": "/m/FL6QQa"
      },
      "posted_at": "2016-04-29T16:04:00+09:00",
      "tags": [],
      "seasons": ["冬"],
      "detail_url": "/i/ISSIeSA",
      "gender": "men",
      "category": "単衣"
    }
  ]
}
```

### 公開一覧の受け入れ条件

1. 公開コンテンツのみ（非公開は出さない）
2. 必須キー欠落・空の `image_url` は返さない
3. `title: ""` は正常
4. owner 専用フィールドを含めない
5. 見本 `list.json` とキー集合が一致すること
6. トップにページネーションは不要（先頭セットで可）
7. 検索結果も同じ1件形（`seasons` 含む）。**検索は `meta` 付きページネーション必須**（既定 `per_page=12`、`data` は1ページ分のみ）。詳細は `LIST_QUERY_ARCHITECTURE.md`

---

## 公開詳細

### `GET /api/public/coordinates/{id}`

公開コーデ詳細。非公開IDは 404。

| フィールド | 必須 | 説明 |
|------------|------|------|
| id | ○ | |
| title | | 空文字可 |
| description | | |
| images[] | ○ | 1枚以上 |
| gender | ○ | `women` \| `men` \| `kids` |
| obi_knot | ○ | 帯結び |
| user / posted_at | ○ | |
| tags / like_count | | |
| items[] | ○ | 各要素に `category`, `image_url`, `id`, `detail_url`。`title` は任意 |
| related_coordinates[] | | 同ユーザーの他コーデ（公開・一覧同型・目安最大9・当該 ID 除外）。**詳細同梱**。別 GET しない |
| og | ○ | OGP |

### `GET /api/public/items/{id}`

公開アイテム詳細。非公開IDは 404。

| フィールド | 必須 | 説明 |
|------------|------|------|
| id | ○ | |
| title | | 空文字可 |
| description | | |
| category | ○ | システムカテゴリ |
| images[] | ○ | 1枚以上 |
| gender | ○ | |
| user / posted_at | ○ | |
| tags / like_count | | |
| used_in_coordinates[] | | このアイテムを使ったコーデ（一覧同型）。**詳細同梱** |
| related_items[] | | 同ユーザーの他アイテム（公開・一覧同型・目安最大9）。**詳細同梱** |
| color_tone | | **公開レスポンスに載せない**（DB 互換のみ可） |
| og | ○ | |

### `GET /api/public/coordinates/{id}/neighbors` / `GET /api/public/items/{id}/neighbors`

詳細直リンク時の前後ナビ用（一覧セッションが無いとき）。
レスポンスは `{ "data": PublicListItem[] }`（当該 ID を含む短いウィンドウ／ページ分で可。**全件は返さない**）。
公開新着順で当該 ID が属するページ分を返す。非公開・仮・無い ID は 404。
障害時フロントは公開一覧の先頭ページへフォールバックしてよい。

---

## owner／users／me

### `GET /api/owner/coordinates/{id}`

所有者のみ。未ログイン 401、非所有者 403。

**本人用フル詳細**（公開詳細と同型の項目を重複して持ち、そのうえで所有者専用を載せる）。  
公開 API に非公開を混ぜない。フロントは **本人と分かればこの API だけ**（取れなければ公開へフォールバック）。

```json
{
  "id": "FgNzIyU",
  "title": "ルミロックコーデ",
  "description": "赤レンガの今昔きもの市へ",
  "images": ["https://…"],
  "user": { "id": "FL6QQa", "name": "Kensuke", "profile_url": "/m/FL6QQa" },
  "posted_at": "2016-04-29T15:45:00+09:00",
  "tags": ["ルミロック"],
  "like_count": 3,
  "gender": "men",
  "obi_knot": "貝の口",
  "items": [],
  "related_coordinates": [],
  "og": { "title": "…", "description": "…", "image_url": "…" },
  "edit_url": "/compose/coordinate?id=FgNzIyU",
  "add_coordinate_item_url": "/compose/coordinate?id=FgNzIyU",
  "private_note": "非公開メモ本文",
  "owner_status": "private",
  "updated_at": "2021-11-13T18:14:53+09:00",
  "view_count": 128,
  "worn_on": "2016-04-29"
}
```

| 区分 | 内容 |
|------|------|
| 公開詳細と同型 | `title` / `images` / `user` / `items` / `related_*` / `og` 等（**重複して返す**。組み立てはサーバ内で共有推奨） |
| 所有者専用 | `edit_url` / `add_coordinate_item_url` / `private_note` / `owner_status` / `updated_at` / `view_count` / `worn_on` |

`owner_status`: `public` \| `private`（将来 `followers` / `draft` 等は要相談）

**ルール（サーバが保証）**

1. 公開 API は非公開を返さない（404）  
2. 本人用 API は本人以外に渡さない（401/403）  
3. 本人の非公開も本人用フルで返す  

### `GET /api/owner/items/{id}`

所有者のみ。コーデ owner と同様に **公開詳細フル ＋ 所有者専用**。

所有者専用の追加例:

```json
{
  "edit_url": "/compose/item?id=ISSIeSA",
  "add_used_coordinate_url": "/compose/item?id=ISSIeSA",
  "private_note": "非公開メモ本文",
  "owner_status": "public",
  "updated_at": "2021-11-13T17:19:38+09:00",
  "view_count": 512,
  "favorite_rank": 4,
  "declutter_candidate": false
}
```

| フィールド | 必須 | 説明 |
|------------|------|------|
| favorite_rank | | `1`〜`5`（5が最高）。未設定は `null`／省略。詳細は本人のみ表示 |
| declutter_candidate | | `true` でマイページ「断捨離候補」に出す。省略時は false 扱い |

※ `worn_on`（着用日）は **コーデのみ**。アイテム詳細には載せない。

---

### `GET /api/owner/coordinates` / `GET /api/owner/items`

所有者の一覧（マイページ）。公開一覧と同型のクエリ＋ページング。  
公開の `/api/public/...` に flag で非公開を混ぜない。  
詳細: [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) §3

#### 任意クエリ `include_facets=1`

マイページの絞り込みチップ用。省略時は `facets` を付けなくてよい（転送節約）。

レスポンス（`data` / `meta` に加えて）:

```json
{
  "data": [/* PublicListItem */],
  "meta": { "page": 1, "per_page": 12, "total": 40, "total_pages": 4 },
  "facets": {
    "season_counts": { "all": 40, "春": 10, "夏": 8, "秋": 12, "冬": 10 },
    "item_categories": [{ "name": "着物", "count": 5 }],
    "item_declutter_categories": [],
    "coordinate_count": 40,
    "item_count": 20,
    "declutter_count": 2
  },
  "visibility_by_id": { "FgNzIyU": "public", "xxxx": "private" }
}
```

| キー | いつ | 説明 |
|------|------|------|
| `facets` | `include_facets=1` のとき | 上記。件数は **現在の一覧条件に整合**した集計でよい |
| `visibility_by_id` | owner 一覧（任意だがNext マイページが使用） | 当該 `data` 内 id → `public` \| `private`。公開 API には載せない |

#### 公開一覧でも `include_facets=1`（他人プロフィール）

`GET /api/public/coordinates|items?user=<id>&include_facets=1`  
`facets` 形は owner と同じ。`visibility_by_id` は付けない（公開のみのため不要）。

フロント: `getOwnerListPage` / `getPublicProfileListPage`（`includeFacets: true`）

---

### `GET /api/public/users`

公開ユーザーの **一覧・検索**（検索タブ「ユーザー」）。投稿一覧とは別口。  
サーバで `q` を適用し、チャンクで返す（全件取得→クライアント絞りは禁止）。

```json
{
  "data": [
    {
      "id": "FL6QQa",
      "name": "Kensuke",
      "profile_url": "/m/FL6QQa",
      "avatar_url": null,
      "bio": "きものレシピの企画から運営までを行なっています。"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 12,
    "total": 1,
    "total_pages": 1
  }
}
```

| クエリ | 必須 | 説明 |
|--------|------|------|
| q | | name / bio の部分一致。未指定・空は `data: []`（全件は返さない） |
| page | | 1始まり |
| per_page | | 省略時 12 |

並び: 名前順（`ja`）。新着順ではない。

見本: `frontend/src/mocks/api/public/users/list.json`  
フロント: `getPublicUsersPage` ← `/search?m=u`

---

### `GET /api/public/users/{id}`

マイページ上部の **公開プロフィール（名刺）**。投稿一覧とは別口。  
無いユーザーは **404**。非公開の自己紹介・サイズは載せない。

```json
{
  "id": "FL6QQa",
  "name": "Kensuke",
  "profile_url": "/m/FL6QQa",
  "avatar_url": null,
  "bio": "きものレシピの企画から運営までを行なっています。",
  "profile_links": [{ "label": "👘とは？", "href": "https://www.kimonorecipe.com/about.html" }],
  "sns": [{ "kind": "x", "label": "X", "href": "https://twitter.com/kimonorecipe" }],
  "public_size": [{ "label": "身長", "value": "158cm" }]
}
```

| フィールド | 必須 | 説明 |
|------------|------|------|
| id / name / profile_url | ○ | |
| avatar_url | | 任意 |
| bio | | 公開自己紹介。未設定は `""` または省略 |
| profile_links / sns | | 公開リンクのみ |
| public_size | | 公開してよいサイズのみ（身長・身丈など） |

見本: `frontend/src/mocks/api/public/users/FL6QQa.json`  
フロント: `getPublicUser` ← `/m/[id]`

投稿数などは一覧の `include_facets` で足りる。設定画面専用の項目は載せない（[`WRITE_PATH.md`](./WRITE_PATH.md)）。

---

## 管理 API（admin）

`GET /api/admin/stats` → `{ source, kpis, activity, usage }`（要ログイン。本番は admin ロール）。

### `AdminKpis`（`kpis`）

| フィールド | 型 | 説明 |
|------------|-----|------|
| `userCount` | number | 会員数 |
| `coordinateCount` | number | 本コーデ（`is_temp=0`） |
| `tempCoordinateCount` | number | 仮コーデ |
| `itemCount` | number | アイテム数 |
| `imageCount` | number | 画像資産数（`images` 行） |
| `attachmentRate` | number | 0–1。本コーデのうちアイテム1件以上付き（仮は分母・分子とも除外） |

ユーザー行（`GET /api/admin/users`）も同系統の camelCase カウンタ（`tempCoordinateCount` / `attachmentRate` / `imageCount` 等）。  
型の正: `frontend/src/lib/admin/types.ts` ・ spike `admin-users.ts`。

---

## フロント側の呼び出し方針

1. 詳細ページは **ログイン中かつ本人の可能性があるとき本人用フルを先に**呼ぶ（`getOwnerCoordinate` / `getOwnerItem`）  
2. 本人用が 401/403／null なら公開詳細へフォールバック  
3. 未ログイン・他人は公開詳細のみ（非公開は 404）  
4. マイページ: 人物は `getPublicUser`、一覧は `getOwnerListPage`／`getPublicProfileListPage`（`user=`）  
5. 詳細前後ナビ（直リンク）は `getDetailNeighborList`

実装参照: `frontend/src/lib/api.ts` / `frontend/src/base/detail/load-detail.ts` / `frontend/src/lib/types.ts` / `frontend/src/mocks/api/`

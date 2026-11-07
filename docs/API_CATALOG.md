# API 一覧（リニューアルの正）

このリニューアルの肝は **新DB＋API を用意し、Next UI が「絞って持ってきた JSON」だけで画面を組む**こと。

## 文書の正（確定）

1ファイルに統合しない。役割を分ける。

| 役割 | 正 | 備考 |
|------|-----|------|
| **エンドポイント一覧** | **本ファイル** | 人が読む一覧の正 |
| フィールド・必須／任意 | [`API_CONTRACT.md`](./API_CONTRACT.md) | |
| 書き込み・認証の手続き | [`../spike/docs/API.md`](../spike/docs/API.md) | 見本実装と一体 |
| OpenAPI | [`openapi.yaml`](./openapi.yaml) | 読み取り GET の副本。ズレたら **本ファイル／CONTRACT／spike API.md を優先** |

OpenAPI に **意図的に載せない**もの（正は本ファイル＋spike）:  
`auth`／書き込み CRUD／画像／toggle／admin／ads／usage など。

一覧方針: [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)  
**入口:** [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) ・ [`NEW_DB.md`](./NEW_DB.md)

| 見るもの | パス |
|----------|------|
| **新DB仕様** | [`NEW_DB.md`](./NEW_DB.md) |
| **手続き見本（読み書き）** | [`../spike/docs/API.md`](../spike/docs/API.md) |
| **この一覧** | `docs/API_CATALOG.md`（本ファイル） |
| フィールド契約 | [`API_CONTRACT.md`](./API_CONTRACT.md) |
| **OpenAPI（読み取り副本）** | [`openapi.yaml`](./openapi.yaml) |
| 書き込み現状 | [`WRITE_PATH.md`](./WRITE_PATH.md) |
| フロント呼び出し | `frontend/src/lib/api.ts` ・ `spike-write.ts` 等 |
| 擬似 JSON | `frontend/src/mocks/api/` |

接続: `NEXT_PUBLIC_API_BASE_URL` または spike（`NEXT_PUBLIC_USE_SPIKE_API` / `SPIKE_API_ORIGIN`）。どちらも無いときだけモック（導出フラグ `USE_MOCK_API`。env ではない）。

---

## 1. 三つの口（混ぜない）

| 接頭辞 | 誰向け | 載せないもの |
|--------|--------|--------------|
| `/api/public/...` | 誰でも（キャッシュ向き） | 非公開・owner 専用・会員専用一覧 |
| `/api/owner/...` | **投稿の所有者だけ** | 他人セッションでは 401/403 |
| `/api/me/...` | **ログイン本人のコレクション／設定** | 公開一覧に `scope=` で混ぜない |

```
画面の種類              呼ぶ口
─────────────────────────────────
トップ・検索・他人プロフ   public（一覧・users・pickup）
詳細（他人・未ログイン）   public 詳細
詳細（本人）               owner 詳細フル（だめなら公開へフォールバック）
自分のマイページ一覧       owner
いいね・フォロー投稿       me
投稿・設定・いいね書き込み  owner / me / auth（手続きは spike）
管理（統計・広告）         admin（＋ public ads 配信）
```

---

## 2. エンドポイント一覧

凡例: **Ready** = フロント配線済み（モックまたは spike）

### 2.1 公開（public）

| Method | Path | 用途 | 主な画面 | フロント |
|--------|------|------|----------|----------|
| GET | `/api/public/coordinates` | 公開コーデ一覧・検索・他人プロフィール | `/` `/search` `/m/{他者}` | `getPublicListPage` / `getPublicProfileListPage` |
| GET | `/api/public/items` | 公開アイテム一覧・検索・他人プロフィール | 同上 | 同上 |
| GET | `/api/public/coordinates/{id}` | 公開コーデ詳細 | `/c/{id}` | `getPublicCoordinate` |
| GET | `/api/public/items/{id}` | 公開アイテム詳細 | `/i/{id}` | `getPublicItem` |
| GET | `/api/public/coordinates/{id}/neighbors` | 詳細前後ナビ用の短い窓 | `/c/{id}` 直リンク | `getDetailNeighborList` |
| GET | `/api/public/items/{id}/neighbors` | 同上（アイテム） | `/i/{id}` 直リンク | 同上 |
| GET | `/api/public/users` | 公開ユーザー一覧・検索 | `/search?m=u` | `getPublicUsersPage` |
| GET | `/api/public/users/pickup` | 自動 Pick up | `/` | `getPickupUsers` |
| GET | `/api/public/users/{id}` | 公開プロフィール（名刺） | `/m/{id}` 上部 | `getPublicUser` |
| GET | `/api/public/ads/pick` | 広告1件抽選 | トップ・詳細 | ads-store |
| GET | `/api/public/ads/logo-sponsors` | 表示中協賛ロゴ | フッター等 | logo-sponsors-store |
| POST | `/api/public/ads/events` | 広告 impression（ビューアブル50%×1s）／click | 同上 | ads-store |
| POST | `/api/public/usage/pageview` | 利用計測（pathname 単位の SPA PV） | 全体（admin 除く） | usage-tracking |

#### 公開一覧のクエリ

| クエリ | 意味 | 備考 |
|--------|------|------|
| （なし） | 新着先頭 | トップ |
| `q` | フリーテキスト | title / description / tags / **user.name**（＋ items は category、coords は obi） |
| `tag` | タグ完全一致 | |
| `g` | `women` \| `men` \| `kids` | |
| `season` | `春` \| `夏` \| `秋` \| `冬` | |
| `cat` | システムカテゴリ | **items**、または coords は紐付けアイテム経由 |
| `obi` | 帯結び | **coordinates のみ** |
| `page` | ページ（1始まり） | 検索・プロフィールで必須運用 |
| `per_page` | 件数 | 省略時 **12** |
| `user` | 投稿者 ID | **他人プロフィール一覧**。公開のみ。未指定＝全体 |
| `include_facets` | `1` | 任意。チップ用 `facets`（形は API_CONTRACT）。`user=`／owner 一覧で使用 |

#### 公開ユーザー一覧のクエリ（`GET /api/public/users`）

| クエリ | 意味 | 備考 |
|--------|------|------|
| `q` | フリーテキスト | name / bio。**未指定は空一覧**（全件名簿は返さない） |
| `page` / `per_page` | ページング | 省略時 per_page **12** |

**禁止:** 公開一覧に `scope=favorite|following` を復活させない（→ `/api/me/...`）。

#### 公開一覧レスポンス

```
{ "data": PublicListItem[], "meta": { page, per_page, total, total_pages } }
```

- トップは先頭セットのみでも可（`meta` 任意）
- **検索は `meta` 必須**（1ページ分だけ返す）
- 1件の形: `PublicListItem`（`types.ts`）

#### 公開詳細

- 非公開 ID は **404**（存在を漏らす 403 は避ける）
- 関連・構成は **詳細レスポンスに含める**（フロントが全件一覧を引かない）
- neighbors は短い窓のみ（**全件禁止**）。spike 実装あり

---

### 2.2 所有者（owner）

| Method | Path | 用途 | 主な画面 | フロント |
|--------|------|------|----------|----------|
| GET | `/api/owner/coordinates` | 自分のコーデ一覧（非公開含む） | `/m/{自分}` | `getOwnerListPage` |
| GET | `/api/owner/items` | 自分のアイテム一覧 | `/m/{自分}` | 同上 |
| GET | `/api/owner/coordinates/{id}` | 本人用詳細フル | `/c/{id}` 本人時 | `getOwnerCoordinate` |
| GET | `/api/owner/items/{id}` | 同上（アイテム） | `/i/{id}` 本人時 | `getOwnerItem` |
| POST/PATCH/DELETE | `/api/owner/coordinates` 等 | 投稿 CRUD・紐付け | `/compose/*` | spike-write |
| POST/PATCH/DELETE | `/api/owner/items` 等 | 同上 | `/compose/*` | spike-write |
| GET/POST/… | `/api/owner/images*` | 画像マスター／正方形／未使用 | compose・整理 | spike-write |

#### owner 一覧のクエリ（要約）

公開と同じ: `q` / `g` / `season` / `cat` / `obi` / `page` / `per_page`  

マイページ固有: `temp` / `declutter` / `sort` / `status=public|private`（`my_folder` / `my_category` は**契約外**）  

語彙の正: `LIST_QUERY_ARCHITECTURE.md` §3 ・ `mypage-state.ts`

#### owner 詳細（フル）

公開詳細と **同型の本文項目を重複して持ち**、そのうえで所有者専用（`private_note` / `owner_status` / `edit_url` / `view_count` 等）を載せる。  
**差分パッチではない。** 公開詳細レスポンスには所有者専用を載せない。  
フロントは本人なら owner フル優先（`load-detail.ts`）。

---

### 2.3 会員（me）・認証

| Method | Path | 用途 | 主な画面 | フロント |
|--------|------|------|----------|----------|
| POST | `/api/auth/login` \| `register` \| `logout` | 認証 | ログイン／登録 | AuthForm / spike-auth |
| GET/PATCH/DELETE | `/api/me` | 本人プロフィール・退会 | `/settings` | spike-write |
| POST | `/api/me/email/*` ・ `/api/me/password` | メール／パスワード | `/settings` | spike-write |
| GET | `/api/me/favorites` | いいねした投稿 | `/likes` | `getMeFavoritesPage` |
| GET | `/api/me/following` | フォロー中ユーザー一覧 | `/following` | `getMeFollowingUsers` |
| GET | `/api/me/following/posts` | フォロー中の投稿 | `/following` | `getMeFollowingPostsPage` |
| GET/POST | `/api/me/favorites|following` check・toggle | 状態確認・トグル | 詳細等 | spike-write |

| クエリ（favorites / following/posts） | 意味 |
|------|------|
| `kind` | `coordinates` \| `items` |
| `page` / `per_page` | ページング（既定 12） |

未ログインでは会員口を呼ばない（画面側でゲストゲート）。

---

### 2.4 管理（admin）

| Method | Path | 用途 | フロント |
|--------|------|------|----------|
| GET | `/api/admin/users` | ユーザー一覧 | admin-data |
| GET | `/api/admin/users/{id}` | ユーザー詳細 | admin-data |
| PATCH | `/api/admin/users/{id}` | ユーザー更新（状態・メモ等） | admin-write |
| POST | `/api/admin/users/{id}/password-reset` | パスワードリセット | admin-write |
| GET | `/api/admin/stats` | KPI・活動・利用 | admin-data（`AdminKpis` 等） |
| GET/PUT | `/api/admin/ads` | 純広告案件 | ads-store |
| GET/PUT | `/api/admin/logo-sponsors` | 協賛ロゴ | logo-sponsors-store |

spike ではログイン済み＝仮の運営者。本番は admin ロール判定に差し替える。  
管理アラート実装は引き渡し範囲外（[`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md) は設計メモ）。

---

## 3. 画面 → API 早見

| 画面 | 呼ぶ API |
|------|----------|
| `/` トップ | `GET /api/public/coordinates` ・ `items`（page=1）・ `users/pickup` |
| `/search` | コーデ／アイテムは同上＋`meta`。ユーザーは `GET /api/public/users` |
| `/m/{他者}` 一覧 | `GET /api/public/...?user={id}` |
| `/m/{id}` 人物 | `GET /api/public/users/{id}` |
| `/m/{自分}` 一覧 | `GET /api/owner/coordinates` ・ `items` |
| `/c/{id}` `/i/{id}` | 本人 → owner 詳細フル／それ以外 → public 詳細 |
| 詳細の前後（直リンク） | `.../{id}/neighbors` |
| `/likes` | `GET /api/me/favorites` |
| `/following` | `GET /api/me/following` ＋ `following/posts` |
| `/compose/*` `/settings/*` | 書き込みは [`WRITE_PATH.md`](./WRITE_PATH.md) ・ 手続きは spike |
| `/admin/*` | `GET /api/admin/stats` ・ `users` ・ ads／協賛 |

---

## 4. 読み取り／書き込みの整理

「対応済み」＝口と Next 経路が決まっている（正式棚の実装はエンジニア側）。  
手続きの正は常に [`../spike/docs/API.md`](../spike/docs/API.md)。

| 領域 | 口 | メモ |
|------|-----|------|
| トップ新着／検索 | `GET /api/public/coordinates\|items` | トップ新着は `per_page=9` |
| Pick up | `GET /api/public/users/pickup` | |
| 詳細本体・構成 | `GET /api/public\|owner/.../{id}` | 非公開は public で 404 |
| 詳細下部「このユーザーの他の〜」 | 詳細内 `related_*` | 同梱・目安最大9 |
| 詳細の前後ナビ | `.../neighbors` | 短い窓。全件禁止 |
| マイページ一覧 | owner 一覧 ／ 公開 `user=` | |
| いいね／フォロー | `GET /api/me/...` ＋ toggle | |
| 投稿・画像・設定 | owner / me / auth | spike 接続済み。本番は同手続き |
| 管理 KPI／広告 | admin ＋ public ads | |

詳細: [`WRITE_PATH.md`](./WRITE_PATH.md)。

---

## 5. 実装チェック（正式棚・新DB）

### 公開一覧

- [ ] `coordinates` / `items` が公開のみ返す
- [ ] 検索クエリでサーバ側絞り込み（`q` に user.name 含む）
- [ ] 検索は `meta` 付き・1ページ分のみ
- [ ] 1件形が `PublicListItem` と一致

### 公開詳細

- [ ] 非公開は 404
- [ ] 関連・構成を詳細に含める
- [ ] neighbors が全件を返さない

### owner・プロフィール・me・admin

- [ ] `?user=` がその人の公開投稿のみ
- [ ] owner 一覧が非公開を含み、他人は 403。`status=` 可
- [ ] owner 詳細が本人だけ（フル）
- [ ] `GET /api/public/users` が公開ユーザー検索
- [ ] `GET /api/me/following` と `following/posts` の両方
- [ ] `GET /api/admin/stats` の KPI 形が契約どおり

見本: `frontend/src/mocks/api/README.md` ・ spike

---

## 6. 関連ドキュメント

| 目的 | ドキュメント |
|------|----------------|
| フィールド必須／任意 | [`API_CONTRACT.md`](./API_CONTRACT.md) |
| OpenAPI | [`openapi.yaml`](./openapi.yaml) |
| 一覧方針 | [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) |
| 新DB | [`NEW_DB.md`](./NEW_DB.md) |
| 移行受け渡し | [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) |
| 手続き見本 | [`../spike/docs/API.md`](../spike/docs/API.md) |
| 書き込み | [`WRITE_PATH.md`](./WRITE_PATH.md) |
| 渡すセット | [`HANDOFF.md`](./HANDOFF.md) |

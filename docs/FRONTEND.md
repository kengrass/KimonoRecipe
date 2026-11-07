# フロント構成メモ（エンジニア向け）

**入門は [`ENGINEERING_GUIDE.md`](./ENGINEERING_GUIDE.md)。** 索引は [`README.md`](./README.md)。

## Next UI の前提

- **レイアウトは1カラム固定**（旧 lab／2カラムは `_archive/lab-20260923`）
- App Router + モック／任意で spike（[`WRITE_PATH.md`](./WRITE_PATH.md) ・ [`../spike/README.md`](../spike/README.md)）
- 画面上部: モック時は `MockAuthBar`（`SHOW_MOCK_DEV_CHROME`）。spike 時は `SpikeAuthBar`。本番 API 接続後はモックバーなし

## ディレクトリの見方

| 場所 | 役割 |
|------|------|
| `app/(main)/` | Next ルート（`/` ・ `/search` ・ `/m` ・ `/likes` ・ `/following` ・詳細・compose・settings） |
| `app/(admin)/` | 管理 UI（`/admin`）。spike 時は users／stats／ads 接続 |
| `src/base/` | Next UI（[base/README](../frontend/src/base/README.md)・触るファイル表あり） |
| `src/base/shell/` | Header／SiteMenu／NewPost／SiteChrome／UsageBeacon／SponsorLogoStrip |
| `src/base/form/` | 投稿・設定の共通部品・プレビューバナー |
| `src/base/compose/` | 投稿・未使用・クロップ・仮コーデ |
| `src/base/admin/` | 管理画面 UI（見た目） |
| `src/base/dev/` | MockAuthBar・SpikeAuthBar・RootProviders |
| `src/lib/` | サイト側データ入口（[lib/README](../frontend/src/lib/README.md)） |
| `lib/laravel-urls.ts` | `APP_ROUTES`（Next）と `LARAVEL`（本番） |
| `lib/api.ts` | 読み取り API 入口（`api-public`／`api-owner`／`api-me` に分割） |
| `lib/public-list-query.ts` | 公開一覧の絞り込み・ページング（`user=` 含む） |
| `lib/public-user-query.ts` | 公開ユーザー検索（`GET /api/public/users`） |
| `lib/mock-api-fixtures.ts` | 擬似API JSON の読み込み口 |
| `mocks/api/` | `GET /api/public/...` および `GET /api/owner/...` 相当の JSON |

## 主要画面の入口

| URL | コンポーネント |
|-----|----------------|
| `/` | `(main)/page` → `base/home/HomeFeed` |
| `/search` | `(main)/search` → コーデ／アイテムは `getPublicListPage`、ユーザーは `getPublicUsersPage` + `base/SearchView` |
| `/likes` | `(main)/likes` → `buildLikesPage` + `LikesView` |
| `/following` | `(main)/following` → `buildFollowingPage` + `FollowingView` |
| `/m/[id]` | `(main)/m/[id]` → `base/mypage/ProfileView` |
| `/c/[id]` `/i/[id]` | `base/detail` |
| `/compose/*` | 投稿。spike 時は保存接続（[`WRITE_PATH.md`](./WRITE_PATH.md)） |
| `/settings/profile` | 設定。spike 時はプロフィール／アカウント接続（[`WRITE_PATH.md`](./WRITE_PATH.md)） |
| `/admin/*` | 管理。spike 時は統計・ユーザー・広告／協賛接続 |

## ページ割り付け

`PageShell`（旧名 `PageWithSidebar`）は **1カラム専用**。  
`aside` は「メインの上に積む」用途のみ（他人プロフィールの自己紹介など）。右カラムは無い。

## 本命モックJSON

| 用途 | パス |
|------|------|
| 公開一覧 | `mocks/api/public/coordinates/list.json` ・ `items/list.json` |
| 公開詳細 | `mocks/api/public/coordinates/FgNzIyU.json` ・ `items/ISSIeSA.json` |
| owner 詳細 | `mocks/api/owner/...` |
| 公開プロフィール | `mocks/api/public/users/FL6QQa.json` |
| 公開ユーザー検索 | `mocks/api/public/users/list.json` |

詳細マップ: [`frontend/src/mocks/api/README.md`](../frontend/src/mocks/api/README.md)

## UI 上の注意（契約との関係）

| 項目 | Next UI | 契約 |
|------|---------|------|
| Myフォルダ／Myカテゴリ | **撤去**（旧 URL は寄せる） | **契約対象外**（新系にも載せない） |
| 仮コーデ／クロップ | spike 時は保存接続 | 手続きは [`WRITE_PATH.md`](./WRITE_PATH.md) ・ spike API.md |
| `/admin` | spike 時は読み書き接続 | カタログ §2.4。アラート実装は引き渡し外 |

# サイト側データ（`lib/`）

会員向け Next UI が触る読み書き・計測の入口。管理は [`admin/README.md`](./admin/README.md)。

## 環境分岐

`config.ts`:

| 状態 | 条件 | サイトの動き |
|------|------|--------------|
| **モック** | `USE_MOCK_API` | fixtures／`mock-*`。書き込みはトーストのみが多い |
| **spike** | `USE_SPIKE_API` | 同オリジン `/api/*` → spike（証明用） |
| **本番相当** | `API_BASE_URL` | 同じパス／JSON を正式 API へ |

UI の見た目改修や契約の再発明はスコープ外。手続きの正は `docs/API_CATALOG.md` ・ `spike/docs/API.md`。

## 触るならこのファイル

| やりたいこと | ファイル |
|--------------|----------|
| 公開／owner／me の読み取り（入口） | `api.ts`（中身は下の三口） |
| → `/api/public` | `api-public.ts` |
| → `/api/owner` | `api-owner.ts` |
| → `/api/me` | `api-me.ts` |
| → 共通 fetch | `api-fetch.ts` |
| → モック詳細土台 | `api-mock-detail.ts` |
| 投稿・画像・紐付け・設定の書き込み（spike） | `spike-write.ts` |
| 一覧クエリ（公開） | `public-list-query.ts` / `public-user-query.ts` |
| 一覧クエリ（owner） | `owner-list-query.ts` |
| マイページ組み立て | `mypage-data.ts` / `mypage-state.ts` ← UI は `base/mypage/load-mypage.ts` |
| 詳細前後ナビ | `detail-browse.ts` |
| Pick up 等の発見枠 | `discovery-data.ts` |
| 認証（モック／spike hydrate） | `auth.tsx` |
| PV／UU | `usage-tracking.ts`（入口）→ `usage-pageview` / `usage-mock-store` / `usage-path` |
| 広告計測 | `ad-tracking.ts` → 実績は `admin/ads-store` |
| ルート定数 | `laravel-urls.ts`（`APP_ROUTES`） |
| 型 | `types.ts` |

## データ経路（読み取り）

```
[app/(main) / base/*]
  → api.ts（USE_MOCK_API ? fixtures : fetch /api/public|owner|me）
  → 一覧はサーバで絞った1チャンク（page / per_page）
```

## データ経路（書き込み・計測）

```
[compose / settings / detail 紐付け]
  → spike 時: spike-write.ts → /api/...
  → モック時: 多くはトーストのみ（WRITE_PATH.md）

[SiteChrome → UsageBeacon]
  → usage-pageview.trackPageView → POST /api/public/usage/pageview

[SponsorAd]
  → ads-store 抽選 ＋ ad-tracking（impression=ビューアブル）
```

## 注意

- 公開 API に非公開・owner 専用を載せない。いいね／フォロー一覧は `/api/me`。
- 全件取得してフロントで絞るのを正にしない（検索・マイページもチャンク）。
- 管理の Storage／Event 購読の話は `admin/README.md`。

# 運用・セキュリティ（Next 並走〜公開）

公開範囲の担保を最優先にした、**このリポジトリ側で決めた運用**です。  
Laravel 本体・EC2 の詳細は既存サイト側。企画側ドキュメントは Next の環境変数と受け入れの注意点。

関連: [`API_CATALOG.md`](./API_CATALOG.md) ・ [`DO_NOT.md`](./DO_NOT.md) ・ [`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md) ・ [`frontend/README.md`](../frontend/README.md)

---

## 0. 判断不要で守ること（チェック）

| # | 項目 | 担当 |
|---|------|------|
| 1 | 並走ホストは **Basic（USER+PASSWORD 両方）または IP 制限**なしで公開しない | 企画／Next |
| 2 | 本番切替後は **Basic の env を両方削除して再デプロイ** | 企画／Next |
| 3 | プレビュー用パスワードを本番秘密と **共用しない** | 企画／Next |
| 4 | API 接続環境で **モック Cookie を本人判定の正にしない** | 両方 |
| 5 | Laravel 接続・公開の前に **§5 受け入れゲートをすべて満たす**（スキップ禁止） | エンジニア＋企画確認 |

---

## 1. 環境変数

| 変数 | 必須? | 意味 |
|------|-------|------|
| `NEXT_PUBLIC_API_BASE_URL` | **本番公開で必須** | 正式棚の API オリジン。未設定かつ spike も無し → モック（本番禁止） |
| `NEXT_PUBLIC_SITE_URL` | **本番公開で必須** | canonical / OGP / sitemap / robots。未設定時は Laravel オリジンに落ちるため、並走・本番では必ず設定 |
| `KR_REQUIRE_LIVE_API` | 本番ビルド推奨 | `1` のときモック起動を拒否（`config.ts`）。ステージ／本番の安全弁 |
| `NEXT_PUBLIC_USE_SPIKE_API` | spike 接続時 | `1` で spike 利用（[`frontend/.env.spike.example`](../frontend/.env.spike.example)） |
| `SPIKE_API_ORIGIN` | spike 接続時 | 例: `http://127.0.0.1:4010`。これだけでも spike 有効になり得る |
| `SPIKE_COOKIE_SECURE` | spike HTTPS 時 | `1` でセッション Cookie に `Secure`（または `X-Forwarded-Proto: https`） |
| `BASIC_AUTH_USER` | 並走時 | プレビュー保護。**PASSWORD と両方あるときだけ** Basic 認証が有効 |
| `BASIC_AUTH_PASSWORD` | 並走時 | 同上。公開切替後は **両方とも外す** |

`USE_MOCK_API` は **env ではない**（`config.ts` の導出）。`NEXT_PUBLIC_API_BASE_URL` も spike も無いときだけモック。  
**本番公開チェック:** `KR_REQUIRE_LIVE_API=1` ＋ `NEXT_PUBLIC_API_BASE_URL` ＋ `NEXT_PUBLIC_SITE_URL`。モック Cookie を本人判定に使わない。

実装: `frontend/src/lib/config.ts` ・ `frontend/src/lib/seo.ts` ・ `frontend/src/middleware.ts`

```bash
# 並走検証の例（frontend/.env.local）
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://next-preview.example.com
BASIC_AUTH_USER=preview
BASIC_AUTH_PASSWORD=change-me-not-production-secret
```

---

## 2. 並走公開の手順（安全側）

1. Next を **本番とは別ホスト**（または別パス）に載せる  
2. **Basic 認証**（上記 env）または ELB／nginx 同等のアクセス制限  
3. `NEXT_PUBLIC_SITE_URL` をその検証 URL に合わせる（canonical が本番 www を指さないように）  
4. 自分だけでトップ一覧などから確認  
5. 問題なければ URL 切替。**Basic の env を削除して再デプロイ**  
6. 検索エンジン向けは `robots.ts` / `sitemap.ts`（公開コンテンツのみ）

Laravel 本番（既存 www）には Basic をかけない。

---

## 3. モック認証と本番 viewer

| 状態 | 挙動 |
|------|------|
| API 未設定（モック） | 琥珀色バー＋ Cookie `kr-mock-auth-mode` → `getServerViewerUserId` |
| API 設定後 | モックバー非表示。**モック Cookie は無視・削除・書かない** |
| 本番の本人判定 | `getServerViewerUserId`（`frontend/src/lib/server-viewer.ts`）に **Laravel セッション／JWT を差し込む**。呼び出し側は変えない |

**やってはいけない:** 本番でモック Cookie を正にする／可視性マップをサーバの代わりにする（[`DO_NOT.md`](./DO_NOT.md)）。

---

## 4. Next 側ですでに入れている防護

| 項目 | 内容 |
|------|------|
| セキュリティヘッダ | `X-Frame-Options: DENY` ・ `nosniff` ・ `Referrer-Policy` ・ `Permissions-Policy` ・ `COOP`（`next.config.ts`） |
| CSP | `Content-Security-Policy-Report-Only`（**強制しない**。違反はブラウザコンソール。enforce は別判断） |
| Basic 認証 | env 両方設定時のみ（`middleware.ts`） |
| SEO | 公開詳細・カテゴリ／帯結び検索は index。likes／compose／settings／非公開詳細は noindex |
| 画像ホスト | `next/image` は CDN と `www.kimonorecipe.com` のみ |

API レート制限・VPN／管理面 MFA は **既存インフラ側**（本リポ外）。  
**WAF は公開・API 経路に設定する**（下記 §4.1・§5.3）。未設定のまま本番相当を晒さない。

### 4.1 WAF・AWS アカウント所有（方針）

| 項目 | 方針 |
|------|------|
| **WAF** | ALB／CloudFront 等、外向け入口に **WAF を設定する**（OWASP 相当の基本ルール＋必要ならレート制限）。新規ホスト・並走公開でも入口を作るなら同様 |
| **AWS の所有者** | リソースの **所有者は発注側（きものレシピ側）アカウント**。エンジニア個人アカウントで本番／準本番を作らない |
| **権限の渡し方** | 発注側アカウント上にリソースを作り、エンジニアには **IAM 等で必要最小の権限を付与**する（所有権の移譲・個人課金に寄せない） |

バックエンド刷新・移行・新環境構築のときも、この方針を崩さない。

---

## 5. 接続・公開の受け入れゲート（必須・スキップ禁止）

Laravel API を Next に繋ぐ／本番相当で公開する前に、人手で確認する。  
**1つでも未達なら接続・公開しない。**

### 5.1 公開範囲（最優先）

- [ ] `GET /api/public/...` の非公開 ID は **404**（403 で存在を漏らさない）  
- [ ] `GET /api/owner/...` は本人以外 **401/403**  
- [ ] `GET /api/me/...` は未ログイン **401**、他人のコレクションを返さない  
- [ ] 公開 JSON に `private_note` / `owner_status` / `view_count` / `edit_url` 等を載せない  

### 5.2 セッション

**方針（決定）:** ログイン維持は **30日・スライド延長**（操作のたびに期限を延ばす）。  
「ログイン状態を保持」OFF や共有端末向けの短命セッションは、必要なら後から例外として足す。

spike 見本（確定反映）: スライド延長・`HttpOnly`/`SameSite=Lax`・HTTPS 時 `Secure`・パスワード／メール確定後は他セッション無効化（当該端末は新セッション）。

- [ ] セッション Cookie が `Secure` / `HttpOnly` / 適切な `SameSite`  
- [ ] 有効期限が **30日スライド**（Laravel 側設定と一致）  
- [ ] パスワード変更・メール変更後は既存セッションを無効化  
- [ ] Next の `getServerViewerUserId` が **実セッション**を見る（モック Cookie ではない）  

### 5.2b 画像配信（方針・決定）

| 種別 | 方針 |
|------|------|
| **公開**投稿の画像 | 公開 URL（現行モックは CDN。正式棚は S3＋CloudFront 等） |
| **非公開**／仮／未使用 | **所有者セッション必須**で配信。拒否は **404**（存在を漏らさない） |
| 正式棚の非公開 | Cookie 付きプロキシでも **署名付き URL** でも可（協議）。spike 見本は `/media/...`＋セッション |

モックの CDN 残しは表示検証用（`DO_NOT` §13）。本番の正は正式棚のメディア。

### 5.3 インフラ（既存サイト側・依頼）

- [ ] HTTPS 強制、不要ポート閉鎖  
- [ ] **WAF を外向け入口に設定している**（§4.1）  
- [ ] AWS リソースは **発注側アカウント所有**。エンジニア個人アカウント製の本番／準本番がない（§4.1）  
- [ ] OS／PHP／依存の更新運用がある  
- [ ] 管理面・VPN・保守アカウントに MFA（または同等）  
- [ ] 管理の失敗通知が [`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md) の受け入れを満たす（本番口接続時）  

詳細チェック: [`API_CATALOG.md`](./API_CATALOG.md) §5 ・各 `packs/` ・ `PHASE*_HANDOFF.md`

---

## 6. インシデント初動（1枚）

不正アクセス・漏えいの疑いが出たら、調査より先にこれを回す。

| 順 | やること | メモ |
|----|----------|------|
| 1 | **拡大防止** | 疑わしい経路の遮断／該当アカウント停止。ログを消さない・上書きしない |
| 2 | **連絡** | 決めている連絡先へ（空欄を埋める ↓） |
| 3 | **事実の切り分け** | いつから／どの口（www・並走 Next・API・管理面）／個人情報の有無 |
| 4 | **保全** | アクセスログ・アプリログ・設定変更履歴をコピーして保管 |
| 5 | **対外** | 個人情報漏えいの可能性があれば、個人情報保護委員会への報告要否を確認（速報の意識） |

### 連絡先（運用で記入）

| 役割 | 名前／チャネル |
|------|----------------|
| 一次受け（企画） | （記入） |
| インフラ／サーバ | （記入） |
| 対外・法務判断 | （記入） |

技術の正はサーバ側の認可と公開範囲。フロントの隠し表示で「守った」ことにしない。

---

## 7. SEO の要点（実装済み）

| URL | インデックス |
|-----|--------------|
| `/` `/c/*` `/i/*` `/m/*`（公開） | する |
| `/search`（条件なし） | する |
| `/search?m=i&cat=…`（カテゴリのみ） | する |
| `/search?m=c&obi=…`（帯結びのみ） | する |
| その他の検索条件・page≥2 | **しない**（noindex） |
| `/likes` `/following` `/compose/*` `/settings/*` | **しない** |

コーデでタイトル空のときメタ／シェアは **帯結び**を使う（`coordinateDetailLabel`）。  
X シェアの投稿文はタイトル＋公開本文（現行踏襲）。`private_note` は載せない。

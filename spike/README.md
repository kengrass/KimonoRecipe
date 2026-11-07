# Spike — 新フロント＋自前 API＋仮 DB

**試作／証明用（本番ではない）。** 正式棚の入口は [`../docs/HANDOFF.md`](../docs/HANDOFF.md)。  
成功条件: **投稿〜画像〜紐付け〜再表示が一周する**（段階実装）。

## 役割分担（この spike）

| 層 | 正にする | 仮 |
|----|----------|-----|
| Next UI | 体験・画面 | — |
| **自前 API** | 画面が叩く手続き（パス・JSON） | — |
| 置き場 | — | いまは **ローカル SQLite**（差し替え可。Supabase 等も候補・**必須ではない**） |

API は置き場に依存しない。エンジニアへの本番依頼は「同じ手続きのまま正式な棚（AWS）へ」。  
**spike／Supabase＝本番ではない。** 仕様書どおり実装すると動く、という証明用。新DB意図: [`../docs/NEW_DB.md`](../docs/NEW_DB.md)。

## 構成

```
spike/
  README.md          ← いまここ
  docs/API.md        ← 手続きの正（最小）
  api/               ← Hono + SQLite
```

`frontend/` 側の Phase 引き渡し docs は、この spike が一周したあとに整理する。

## 起動（API）

```bash
cd spike/api
npm install
npm run dev
```

- Health: http://127.0.0.1:4010/health  
- デモユーザー: `demo@example.com` / `demo-pass`（起動時シード。管理者はこのアカウントのみ）
- 本番公開プロフィールの取り込み（`db:seed-real`）は廃止（実在データ混入防止）
- 公開検索は件数増向け索引＋コーデ `cat`＝紐付き公開アイテム起点（方針の正はリポ `docs/SEARCH_SCALE.md`）

## 進捗（spike 一周）

成功条件: **Laravel なしで、投稿〜画像〜紐付け〜再表示が一周する**。

### できた

| 領域 | 内容 |
|------|------|
| 認証 | 登録／ログイン／ログアウト／退会、Cookie セッション、`/login` `/regist` |
| 公開読み取り | 一覧・検索（チャンク）、詳細、ユーザー検索／Pick up、マイページ公開部 |
| 投稿書き込み | アイテム／コーデ CRUD、仮コーデ＋サーバ合成、紐付け |
| 画像 | アップ（マスター＋正方形・原寸非保存）、再クロップ、未使用プール（明示流入のみ） |
| 会員アクション | いいね／フォロー **GET＋トグル**、所有者の非公開へのいいね可 |
| プロフィール | 表示名／bio／アバター更新、表示名重複・180日クールダウン |
| 計測 | `view_count` 実カウント |
| 入力ガード | テキスト／URL／検索 LIKE のサニタイズ（API 本命） |
| UX 調整 | 検索は条件無しで空、色調削除、お気に入り★、公開表現統一、メモ500、編集フォーム並び、アップ時トリミング省略、保存エラーの気づきやすさ |

### 残り（spike 内）

| 領域 | 内容 |
|------|------|
| 設定・アカウント | メール変更／確認コード、パスワード、配信、リンク／SNS を **spike 接続**（実メール送信はなし・`dev_code`） |
| 広告・協賛 | `ads` / `logo_sponsors` テーブル＋管理 PUT／公開 pick・events |
| 運用アラート | `docs/ADMIN_ALERTS.md` は設計のみ・実装なし |
| 試作の割り切り | CSRF なし、SQLite 仮置き場、spike バー前提の疎通 |
| 管理読み取り | `GET /api/admin/users`・`/users/:id`・`/stats`（ログイン必須・仮の運営者） |
| 利用計測 | `POST /api/public/usage/pageview` → 日次 UU/PV。管理 stats の usage に反映。動線確認: `cd spike/scripts && npm i && node verify-pv.mjs`（Next+spike 起動中・他タブ注意） |

### スコープ外（この spike ではやらない）

- Laravel／本番 AWS への本接続、`docs/openapi.yaml` の spike 都合書き換え
- Myフォルダ／Myカテゴリ
- 管理画面の本番認証ロール・日次UU計測基盤
- 画面から DB 直叩き、Supabase＝本番扱い

## Next UI からつなぐ

```bash
# 1) API
cd spike/api && npm run dev

# 2) frontend/.env.local（見本: frontend/.env.spike.example）
SPIKE_API_ORIGIN=http://127.0.0.1:4010
NEXT_PUBLIC_USE_SPIKE_API=1

# 3) Next
cd frontend && npm run dev
```

- `/api/*` と `/media/*` は Next が spike へ（`/media` は Cookie 転送付きプロキシ）
- **画像:** 公開投稿が参照していれば誰でも可。非公開／仮／未使用のみは所有者セッション必須（拒否は 404）
- 画面上部の **spike API** バーで `demo@example.com` / `demo-pass` ログイン  
  → ヘッダーにマイページ／新規投稿が出る。`/mypage` は自分の `/m/{id}` へリダイレクト
- 公開一覧・詳細・owner 詳細が spike データを見る  
  （仮コーデは公開フィードに出さない。Pick up は実在ユーザーのみ）

## やらないこと

- 提供中の `docs/openapi.yaml` を spike 都合で書き換え
- 画面から DB を直接叩く
- Supabase＝本番、とみなすこと

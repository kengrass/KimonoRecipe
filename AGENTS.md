# AGENTS.md — AI / 実装エージェント向け入口

このリポジトリでコードや API を触る AI は **最初にこのファイルだけ**を前提にし、必要なら末尾のリンクだけ追う。

**人向け方針1枚:** [`docs/FOR_ENGINEERS.md`](./docs/FOR_ENGINEERS.md)（命令ではなく共有）  
**AI／詳細索引:** [`docs/HANDOFF.md`](./docs/HANDOFF.md)  
口調: エンジニアへの作業押しはしない。協議・尊重前提。

## 役割（最重要）

- **提供済み（企画側・勝手に変えない）:** Next UI・API のパス／クエリ／JSON 形・新DB意図・モック／spike
- **エンジニア側の本丸:** 同じ手続きを **新DB＋AWS 上の正式棚** に実装する
- **spike:** 仕様どおり動く証明（任意）。本番扱いしない → [`spike/README.md`](./spike/README.md)
- 人向け経緯・方針: [`docs/FOR_ENGINEERS.md`](./docs/FOR_ENGINEERS.md)
- 詳細: [`docs/DELIVERY_MODEL.md`](./docs/DELIVERY_MODEL.md) ・ [`docs/NEW_DB.md`](./docs/NEW_DB.md) ・ 進捗: [`docs/LEADER_STATUS.md`](./docs/LEADER_STATUS.md)

フロントの見た目改修・契約の再発明はスコープ外。頼まれても拒否し、契約変更は人手の承認が必要と返す。  
ただし **セキュリティ欠陥・認可穴・実在データの除去・spike≠本番の明示** など、エンジニア／レビュー指摘の修正は進めてよい。

## 絶対にやるな

全文: [`docs/DO_NOT.md`](./docs/DO_NOT.md)

- 全件取得してフロント／クライアントで絞る
- 公開 API に非公開・owner 専用フィールドを載せる
- `/api/public` に `scope=favorite|following` を足す（→ `/api/me/...`）
- `app/(main)` / `src/base` の Next UI を「改善」目的で大きく変える
- 書き込み API を契約なしに追加する（見本は spike）
- モック可視性マップを本番の正にする（非公開はサーバ 404）
- 本番でモック Cookie（`kr-mock-auth-mode`）を正にする
- 既存スパゲティスキーマを新系の正として継承する
- spike／Supabase を本番扱いする

## API の三口

| 接頭辞 | 用途 |
|--------|------|
| `/api/public/...` | 誰でも。公開のみ。一覧はチャンク |
| `/api/owner/...` | 所有者のみ。マイページ一覧・**本人用詳細フル** |
| `/api/me/...` | ログイン本人のいいね／フォロー投稿 |

### API 文書の正（1ファイル統合ではない）

| 役割 | 正 |
|------|-----|
| エンドポイント一覧 | [`docs/API_CATALOG.md`](./docs/API_CATALOG.md) |
| フィールド・必須／任意 | [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) |
| 書き込み・認証の手続き | [`spike/docs/API.md`](./spike/docs/API.md) |
| OpenAPI | [`docs/openapi.yaml`](./docs/openapi.yaml)（**読み取り副本**。admin／ads／書き込みは未収載でよい） |

新DB: [`docs/NEW_DB.md`](./docs/NEW_DB.md)  
並走・セキュリティ・SEO: [`docs/OPS_SECURITY.md`](./docs/OPS_SECURITY.md)  
検索の件数増: [`docs/SEARCH_SCALE.md`](./docs/SEARCH_SCALE.md)

## 典型タスク

| やりたいこと | 見るもの |
|--------------|----------|
| 全体理解 | [`docs/FOR_ENGINEERS.md`](./docs/FOR_ENGINEERS.md) ・ [`docs/NEW_DB.md`](./docs/NEW_DB.md) ・ [`docs/DELIVERY_MODEL.md`](./docs/DELIVERY_MODEL.md) |
| API 手続き | [`spike/docs/API.md`](./spike/docs/API.md) |
| 読み取り形の整理 | [`docs/API_CATALOG.md`](./docs/API_CATALOG.md) ・ [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) |
| 移行の受け渡し | [`docs/MIGRATION_INTAKE.md`](./docs/MIGRATION_INTAKE.md) |
| 正式棚の着手案 | [`docs/FORMAL_SHELF_STARTER.md`](./docs/FORMAL_SHELF_STARTER.md) |
| ローカルで動かす | [`spike/README.md`](./spike/README.md) |

## このリポに無いもの

- 既存 Laravel／PHP 本体を新系の正とする前提
- AWS 本番の最終構成（エンジニアと協議）

## フロントを動かすだけなら

```bash
cd frontend && npm install && npm run dev
```

モックのまま動く。spike 接続は `frontend/.env.spike.example` 参照。本番 API は `NEXT_PUBLIC_API_BASE_URL`。

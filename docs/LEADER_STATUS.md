# リーダー向け共有 — 進捗と残タスク

対象: 大枠を握る企画側リーダー（現行仕様・DBは詳しくなくてよい）  
更新目安: 2026-11-07

---

## 1. やり方（1分）

```
[企画側]                                      [エンジニア側に頼むこと]
Next UI + API 手続き + 新DB仕様            →  同じ手続きを正式棚（AWS）へ
spike は「仕様どおり動く」証明（任意）         必要データのみ新DBへ移行
```

**提供済み ≠ このまま公開可。** スタート地点の定義は [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md)。正式棚の体制・時期は要協議。

- 企画側: **優先順・受け入れ・窓口・新スキーマ意図**（[`NEW_DB.md`](./NEW_DB.md)）
- エンジニア側: **API＋新DBを AWS 上で実現**（置き方は協議）
- 入口: [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md)（人向け1枚・経緯含む）・ AI用 [`HANDOFF.md`](./HANDOFF.md)

---

## 2. いまの状態

| 領域 | 状態 |
|------|------|
| Next UI | 提供可能。モック／spike で一通り触れる |
| spike（API＋SQLite） | 投稿一周・設定・広告／協賛の永続まで接続（証明用） |
| 新DB仕様 | [`NEW_DB.md`](./NEW_DB.md) ドラフトあり |
| 本番 AWS 棚 | **未着手**（着手案: [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md)。エンジニアと協議） |
| 移行 | 受け渡し形は [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) |
| `/admin` | 統計／ユーザーは spike 読み取り。広告・協賛は spike 永続。アラートは設計のみ |
| SEO／並走セキュリティ | Next／文書済み（[`OPS_SECURITY.md`](./OPS_SECURITY.md)） |

### 画面

| 画面 | 状態 |
|------|------|
| トップ・検索・詳細・マイページ・いいね／フォロー | UI あり。spike 時は spike データ |
| 投稿・未使用・仮コーデ | spike 時は保存接続済み |
| 設定 | spike 時はプロフィール＋アカウント（メール／パス／リンク／SNS）接続 |
| `/admin` | 統計・ユーザー・スポンサー（spike 時は API） |

Myフォルダ／Myカテゴリは **新系に含めない**。

ローカル一周: [`../spike/README.md`](../spike/README.md)

---

## 3. 残タスク

### A. 企画側

| 優先 | タスク | 状態 |
|------|--------|------|
| — | 読み取り UI・手続き見本・新DBドラフト | **済〜進行** |
| — | spike で一周検証 | **進行中** |
| P1 | 本資料・提供モデルの維持 | 進行中 |
| P2 | OpenAPI へ書き込み／管理口を昇格 | **後続可**。一覧正は CATALOG、手続きは spike API.md、OpenAPI は読み取り副本（階層確定済み） |
| P2 | 認可境界の自動確認 | **着手済** — `spike/scripts/verify-auth.mjs`（spike 起動中に実行） |
| P2 | 署名URL／必須env／セッション（6〜8の今できる分） | **方針＋spike 反映済**（画像§5.2b、KR_REQUIRE_LIVE_API、スライド／Secure／パス変更無効化）。S3・実メールは棚待ち |
| P3 | `/admin` アラート実装 | **引き渡し外**（[`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md)） |

### B. エンジニア側

**入口:** [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md)

| 順 | やること | 完了の見え方 |
|----|----------|--------------|
| **0** | 方針理解（新DB・三口・公開範囲） | [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) の意図が共有できる |
| **1** | AWS 上の DB／API 配置を協議（**後回し可**） | 置き場が決まる（起点: [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md)）。モック画像は現行 CDN 残しで確定済み |
| **2** | 新スキーマ＋同じ手続きを実装（AI 草案可） | spike と同じ口が正式棚で動く |
| **3** | 既存からの必要データ移行 | 移行対象だけ載る |

Next UI 改修は頼まない。契約変更は企画側。

### C. 企画側リーダー

| タスク |
|--------|
| モックまたは spike を一通りクリックし受け入れ感覚を掴む |
| `NEW_DB.md` ＋ spike API をエンジニア／AI に渡し、指示が足りるか確認 |
| 契約変更は企画側に戻す |
| 並走 URL の Basic・`SITE_URL` を [`OPS_SECURITY.md`](./OPS_SECURITY.md) どおりにする |

---

## 4. マイルストーン

| マイルストーン | 完了条件 |
|----------------|----------|
| **M0 手続き＋UI** | カタログ／spike で画面一周できる → **ほぼ到達** |
| **M0b 新DB仕様** | [`NEW_DB.md`](./NEW_DB.md) で意図が説明できる → **ドラフト到達** |
| **M1 正式棚** | AWS 上で同じ API＋新DBが動く（協議後） |
| **M2 移行** | 必要データのみ新DBへ |


---

## 5. リーダー向けショートメッセージ（コピペ用）

> 新フロントに合わせた新DB／APIを本番の正にしたいです。既存DBの全面継承は考えていません。  
> 方針の要約は `docs/FOR_ENGINEERS.md` です。spike は動く見本です。  
> とりあえずの最小構成・分担は `docs/FORMAL_SHELF_STARTER.md`。AWSの置き方と移行は相談させてください。

---

## 6. 関連リンク

| 用途 | パス |
|------|------|
| **方針1枚** | [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) |
| AI／詳細 | [`HANDOFF.md`](./HANDOFF.md) |
| 役割分担 | [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) |
| 新DB | [`NEW_DB.md`](./NEW_DB.md) |
| API 手続き | [`../spike/docs/API.md`](../spike/docs/API.md) |
| 書き込みの現状 | [`WRITE_PATH.md`](./WRITE_PATH.md) |
| spike | [`../spike/README.md`](../spike/README.md) |
| 禁止 | [`DO_NOT.md`](./DO_NOT.md) |
| 正式棚スターター | [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md) |
| 運用・SEO | [`OPS_SECURITY.md`](./OPS_SECURITY.md) |

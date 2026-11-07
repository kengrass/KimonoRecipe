# 正式棚スターター（とりあえず載せる前提）

**目的:** エンジニアがゼロから設計しなくてもよいよう、**最小の正式棚草案**と役割分担を先に固定する。  
AI が実装の大半を書き、人が **所有・権限・WAF・移行・受け入れ** を担う前提。

**本番の正は協議後の AWS 棚。** 本ファイルは独断の最終構成ではなく、**着手用の既定案**（崩すときは協議）。

関連: [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) ・ [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md) ・ [`OPS_SECURITY.md`](./OPS_SECURITY.md) ・ [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) ・ [`DO_NOT.md`](./DO_NOT.md)

---

## 1. 理想の進め方（このリポ向き）

```
[企画＋AI] 手続き見本・新DB意図・本スターター
    ↓
[AI] spike 同口の API＋新DB 実装草案、デプロイ手順／IaC 草案
    ↓
[発注側] AWS アカウント所有・IAM 最小権限・WAF 方針の承認
    ↓
[エンジニア] 草案を発注側アカウントに載せ、穴埋め・移行・切替
    ↓
[双方] OPS §5 受け入れゲート（スキップ禁止）
```

**やらない:** エンジニア個人アカウントで本番／準本番を作る。WAF なしの外向け公開。spike／Supabase＝本番。

---

## 2. 「とりあえず」に含める／含めない

### 含める（M1 最小）

| 要素 | 既定案 | メモ |
|------|--------|------|
| API | spike と同じパス／JSON（三口 public／owner／me＋書き込み） | 手続きの正は `spike/docs/API.md` |
| DB | [`NEW_DB.md`](./NEW_DB.md) のテーブル意図 | Postgres または MySQL（協議）。spike は SQLite 見本 |
| メディア | オブジェクトストレージ（S3 相当）＋配信 | 画像はマスター処理方針どおり（Exif 削除・長辺上限） |
| アプリ配置 | API プロセス＋Next（または API のみ先） | 並走時は Basic／IP 制限（`OPS_SECURITY`） |
| 入口 | **ALB または CloudFront 等＋WAF** | 未設定のまま晒さない |
| 所有 | **発注側（きものレシピ）AWS アカウント** | IAM でエンジニアに最小権限 |
| セッション | Cookie・**30日スライド**（方針決定済み） | `OPS_SECURITY` §5.2 |
| 計測 | `usage/pageview`・広告 events | 定義は spike API.md／WRITE_PATH |

ランニングは現状規模（EC2＋RDS＋S3＋ELB 程度）を超えにくい案を優先。Redis 専有・二重計算の常時並走は効果が見えるまで入れない。

### 含めない（後続・引き渡し外）

| 要素 | 理由 |
|------|------|
| 管理アラート実装 | [`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md) は設計のみ |
| Myフォルダ／Myカテゴリ | 新系スコープ外 |
| OpenSearch 等の全文専有 | 必要になるまで RDS 側で足りることが多い（`SEARCH_SCALE`） |
| Supabase＝本番 | 任意の証明置き場候補のみ |
| 既存スパゲティスキーマの継承 | 移行は受け渡し形のみ |
| Next UI リデザイン | 提供済み・触らない |

### 要協議（とりあえず後でも可・早めに話せる）

- パスワードハッシュ移行 vs 初回再設定（`MIGRATION_INTAKE`）
- 公開 ID（`/c` `/i` `/m`）の維持 vs 対応表
- Next と API を同ホスト／別ホスト、既存 Laravel との並走期間
- 管理画面の本番ロール（spike は仮の運営者）

**移行の実施（方針）:** **ユーザー単位**。起動は **管理代理がメイン**（自己移行は一般期だけのサブ・最悪なしでも可）。**旧改修は最小**（解約済み流用＋表示名・メモ。専用ステータスは作らない。足りない分は新側／運用）。**大口≈50人を先に**（案 B: 画像を手動で大方→通常再実行で穴埋め。件数は新管理）。一般約3ヶ月 → 旧クローズ＋問い合わせは代理のみ。詳細 [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) §4–5。

---

## 3. インフラ既定案（コスト意識・変更可）

**準本番〜本番の最小イメージ（例）:**

```
Internet → WAF → ALB (HTTPS)
              ├─ Next（静的／Node）
              └─ API（spike 同口）
                    └─ RDS（新DB）
S3（画像マスター／表示用）← 公開は公開 URL、非公開はセッション or 署名 URL（方針: OPS §5.2b）
```

| 優先 | 理由 |
|------|------|
| 1 台寄りの API＋RDS＋S3＋ALB＋WAF | 現状ランニングに近い。まず口が動くこと |
| キャッシュは公開確定のみ | 非公開・下書きは載せない。公開→非公開は即無効化 |
| 可用性の極端な1台化の押し付けはしない | 要・方針確認 |

詳細のインスタンスサイズ・AZ・バックアップはエンジニア判断。

---

## 4. だれが何をするか

### AI／実装エージェントが書いてよい（草案）

1. `NEW_DB` に沿ったマイグレーション＋ spike 同口の API 実装（言語／FW は協議で決まったもの）  
2. 環境変数一覧・ローカル／ステージング起動手順  
3. Dockerfile／compose、または既存 EC2 向けの配置手順の草案  
4. IaC（Terraform 等）の**草案**（発注側アカウント前提・個人アカウント禁止を明記）  
5. 移行スクリプトの**受け側**（`MIGRATION_INTAKE` の形 → 新DB）。出元抽出は別  

実装順の目安（壊れにくい）: **一覧 → 詳細 → owner／users → me → 書き込み**（`API_FOR_ENGINEERS.md`）。

### 人がやること（短縮しにくい）

| 担当 | 内容 |
|------|------|
| 発注側 | AWS アカウント所有の確認、IAM 付与、課金・WAF 方針の承認 |
| エンジニア | 草案のレビュー、発注側アカウントへの適用、既存網／DNS／証明書、監視 |
| エンジニア | 既存データからの抽出・移行実行・切り戻し |
| 双方 | [`OPS_SECURITY.md`](./OPS_SECURITY.md) §5 受け入れ（公開範囲最優先） |

---

## 5. Next のつなぎ方（UI は触らない）

```bash
# 正式 API 並走例（frontend/.env.local）
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://next-preview.example.com
BASIC_AUTH_USER=preview
BASIC_AUTH_PASSWORD=change-me-not-production-secret
```

- モック Cookie を本番の本人判定にしない  
- 切替後は Basic の env を削除して再デプロイ  
- 詳細: `OPS_SECURITY.md` §1–3

---

## 6. 受け入れ（載ったあとの最低ライン）

スキップ禁止。要約:

1. 公開 API に非公開が混ざらない（404）  
2. owner／me の権限境界  
3. 実セッション（モック Cookie ではない）  
4. WAF 付き入口・発注側アカウント所有  
5. 一覧はチャンク（全件取得しない）  

全文: `OPS_SECURITY.md` §5 ・ `API_CATALOG.md` §5

---

## 7. AI に続きを頼むときのプロンプト例

> `docs/FOR_ENGINEERS.md` と `docs/FORMAL_SHELF_STARTER.md` を正として読め。  
> `docs/NEW_DB.md` と `spike/docs/API.md` に沿い、正式棚用 API＋DB の**実装草案**をリポ内に用意せよ（spike は本番にしない）。  
> AWS リソースは発注側アカウント前提。WAF なし公開や個人アカウント本番は提案するな。  
> Next UI のリデザイン・契約の独断変更・既存スパゲティ継承はするな。  
> まず一覧 GET から足し、`OPS_SECURITY` §5 を満たす形で進めよ。

人が先に決めると早いもの: **DB 製品（Postgres/MySQL）**・**API の実行環境（既存 EC2 並走か新規か）**・**発注側アカウントへの IAM**。

---

## 8. 進捗の見え方

| 段階 | 完了の見え方 |
|------|----------------|
| 本スターター合意 | 含める／含めないが共有できた |
| API 草案 | spike と同じ口がステージングで応答する |
| 入口＋WAF | 外向け URL が発注側アカウント上で守られている |
| Next 並走 | `NEXT_PUBLIC_API_BASE_URL` で画面が正式 API を見る |
| 移行 | `MIGRATION_INTAKE` の必須だけ載る |
| 本番切替 | §5 ゲート通過・Basic 解除 |

マイルストーン対応: M1＝正式棚稼働、M2＝移行（`LEADER_STATUS.md`）。

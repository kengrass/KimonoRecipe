# 新DB仕様（本番の正・ドラフト）

**方針:** スキーマは **新UI／APIから合理的に新規設計**する。  
必要な情報だけ新DBへ移せるようにする（受け渡し: [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md)）。  
AWS 上の実現（RDS 等）はエンジニアと協議。

**spike（SQLite／任意で Supabase）の役割:**  
仕様どおり実装すると動く、という **証明用の参照実装**。必須ではない。  
本番＝spike／Supabase、とみなさない。

関連: [`../spike/docs/API.md`](../spike/docs/API.md) ・ [`../spike/README.md`](../spike/README.md) ・ [`WRITE_PATH.md`](./WRITE_PATH.md) ・ [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md)

---

## 1. エンジニア／AI への渡し方

1. 本仕様（テーブル意図）＋ [`spike/docs/API.md`](../spike/docs/API.md)（手続き）を読む  
2. 同じ手続きを正式な棚（AWS 上の API＋DB）に実装する  
3. 既存DBからは **移行対象だけ** 抽出（継続マッピングしない）  
4. 動作確認の見本が必要なら spike を起動（任意）

---

## 2. テーブル一覧（意図）

型は論理名。本番は Postgres／MySQL いずれでもよい（spike は SQLite）。

### 2.1 `users` — 会員

| 列 | 意図 |
|----|------|
| `id` | 公開ID（短い英数） |
| `email` | ログイン用。一意 |
| `password_hash` | サーバ側のみ |
| `name` | 表示名。一意（大文字小文字無視の方針可） |
| `bio` | 公開自己紹介 |
| `avatar_url` | 公開アバター（メディアURL） |
| `mail_opt_in` | 運営メール受信可否 |
| `links_json` | 公開プロフィールリンク `[{title,url}]`（最大10） |
| `sns_json` | 公開SNS `{ twitter,instagram,… }`（フルURL） |
| `public_size_json` | 公開サイズ `[{label,value}]`（身長・身丈など） |
| `admin_status` | 管理状態 `active` / `suspended` / `withdrawn` |
| `admin_note` | 管理メモ |
| `mail_rejected` | メール拒否 |
| `premium_id` | プレミアム uid（任意） |
| `pending_email` / `pending_email_code` / `pending_email_expires_at` | メール変更の確認中 |
| `created_at` / `last_active_at` | 登録・最終利用 |

付帯: `user_name_history`（表示名変更の180日クールダウン用）  
付帯: `sessions`（Cookie セッション）

### 2.2 `items` / `coordinates` — 投稿

| 共通の意図 | |
|------------|--|
| `owner_id` | 所有者 |
| `visibility` | `public` / `private` |
| `images_json` | 表示用URL配列（一覧は先頭） |
| `tags_json` | タグ |
| `private_note` | 所有者のみ |
| `view_count` | 閲覧数 |
| `created_at` / `updated_at` | |

アイテム固有: `category`, `gender`, `favorite_rank`, `declutter_candidate`  
互換のみ（UI 非表示・移行の正にしない）: `color_tone`  
コーデ固有: `gender`, `obi_knot`, `is_temp`, `worn_on`  
**仮コーデ** (`is_temp=1`) は公開フィード・紐付率の分母から除外。

### 2.3 `coordinate_items` — 紐付け

`coordinate_id` + `item_id` + `sort_order`。同一所有者のアイテムのみ。

### 2.4 `images` — アップロード資産

原寸は残さない。`master_url` + `square_url`。`in_unused_pool` で未使用整理。  
投稿の `images_json` と対応。所有者単位で数える（管理の「画像数」）。

### 2.5 `favorites` / `follows`

いいね: `(user_id, kind, target_id)`。`kind` は `coordinates` / `items`。  
フォロー: `(follower_id, followee_id)`。

### 2.6 `usage_page_views` — 利用計測

日次 UU/PV 用。`day`, `path`, `viewer_kind`（member/guest）, `viewer_key`。

### 2.7 `ads` — 純広告案件

| 列 | 意図 |
|----|------|
| `id`, `name`, `advertiser` | 案件・広告主 |
| `placements_json` | `home_top` / `coord_detail` / `item_detail` |
| `href`, `image_url`, `title` | 配信クリエイティブ |
| `enabled`, `start_on`, `end_on` | 配信制御 |
| `impressions`, `clicks` | 累計実績 |

### 2.8 `logo_sponsors` — 協賛ロゴ

フッター上の看板。CTRは持たない。`sort_order` で並び。

---

## 3. 公開範囲（必ずサーバで担保）

- 公開APIは `visibility=public` かつコーデは `is_temp=0` のみ  
- 非公開・仮・未使用画像は所有者セッション必須（拒否は404）  
- 紐付率の分母・分子は **本コーデのみ**（仮除外）

---

## 4. 既存からの移行

**出元テーブルは指定しない。** 新DBが受け取る形を定義する。  
→ 受け渡しの正: [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md)

要約: ユーザー・アイテム・コーデ・紐付け・画像・いいね／フォローを新形で渡す。  
**実施はユーザー単位**（マイページ自己移行／管理の代理移行）。並走タイムライン案あり。詳細は [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) §4–5。  
Myフォルダ／Myカテゴリ・色調依存は渡さない。

---

## 5. 未凍結・これから足す口

| 領域 | 状態 |
|------|------|
| 設定（リンク／SNS／配信／メール変更／パスワード） | spike で接続中 |
| 広告・協賛 CRUD＋計測 | spike で接続中 |
| 管理ロール・アラート | 後続（[`ADMIN_ALERTS.md`](./ADMIN_ALERTS.md)） |
| OpenAPI への書き込み昇格 | 手続き確定後に `openapi.yaml` へ |

---

## 6. Supabase は必須か？

**必須ではない。**  
仕様書どおりに DB＋API を実装すれば足りる。  
Supabase は spike の置き場候補のひとつで、「動く証明」をクラウド共有したいときの任意手段。  
AWS 協議後の正式棚が本番の正。着手の既定案: [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md)。

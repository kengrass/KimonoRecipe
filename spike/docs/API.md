# Spike API（手続きの正・最小）

ベース: `http://127.0.0.1:4010`  
認証: Cookie セッション（`kr_spike_session`）。CSRF は試作では省略。

Myフォルダ／Myカテゴリは扱わない。

---

## 認証

### `POST /api/auth/login`

```json
{ "email": "demo@example.com", "password": "demo-pass" }
```

→ `200` `{ "user": { "id", "name", "email" } }` ＋ Set-Cookie  
失敗: `401`

### `POST /api/auth/register`

```json
{ "name": "表示名", "email": "new@example.com", "password": "secret1" }
```

→ `201` 同型 ＋ Set-Cookie。`email` 重複は `409`。パスワードは6文字以上。

### `POST /api/auth/logout`

→ `204`

### `DELETE /api/me`

退会（本人アカウント削除）。投稿・セッション等も削除。→ `204` ＋ Cookie 削除。未ログイン `401`。

### `GET /api/me`

ログイン中: `{ "user": { "id", "name", "email", "bio", "avatar_url", "profile_url" } }`  
未ログイン: `401`

### `PATCH /api/me`

```json
{
  "name": "表示名",
  "bio": "自己紹介",
  "avatar_url": "/media/…",
  "mail_opt_in": true,
  "links": [{ "title": "Blog", "url": "https://…" }],
  "sns": { "instagram": "https://www.instagram.com/…" }
}
```

未指定キーは変更しない。  
表示名変更時: 他ユーザーと重複 → `409 { "error": "name_taken" }`。  
直近180日以内に本人が使っていた名前への変更 → `409 { "error": "name_recently_used" }`。

`GET /api/me` は上記に加え `email`, `mail_opt_in`, `links`, `sns` を返す。

### `POST /api/me/email/request` `{ "email" }`

確認コード発行。spike は実送信せず `{ sent, email, dev_code }`。重複は `409 email_taken`。

### `POST /api/me/email/confirm` `{ "email", "code" }`

メール確定。

### `POST /api/me/password` `{ "password" }`

6文字以上。

### `GET /api/me/favorites?kind=coordinates|items&page=&per_page=`

いいねした投稿。公開は誰の分も、**自分の非公開**も含む。`{ data, meta }`。未ログイン `401`。`kind` 必須。

### `GET /api/me/favorites/check?kind=&id=`

→ `{ "liked": true, "like_count": 3 }`。未ログイン `401`。

### `POST /api/me/favorites/toggle`

```json
{ "kind": "coordinates"|"items", "id": "…" }
```

→ `{ "liked": true|false, "like_count": N }`。  
公開は誰でも可。非公開は**本人のみ**可。仮コーデ・他人の非公開は `404`。

### `GET /api/me/following`

フォロー中ユーザー一覧。`{ data: [{ id, name, profile_url, avatar_url, bio }] }`。未ログイン `401`。

### `GET /api/me/following/posts?kind=coordinates|items&page=&per_page=`

フォロー中ユーザーの**公開**投稿。同型。未ログイン `401`。`kind` 必須。

### `GET /api/me/following/check?user_id=`

→ `{ "following": true }`。未ログイン `401`。

### `POST /api/me/following/toggle`

```json
{ "user_id": "…" }
```

→ `{ "following": true|false }`。自分自身・存在しないユーザーは `404`。

---

## 公開ユーザー

### `GET /api/public/users?q=&page=&per_page=`

`q` 空は空一覧（名簿全件は返さない）。name / bio。名前順。

### `GET /api/public/users/pickup?limit=`

自動 Pick up。公開コーデ・公開アイテムが**それぞれ 10 件以上**のユーザーを件数合計の多い順。該当が足りないときは両方が 1 件以上のユーザーで補完。

→ `{ data: [{ id, name, profile_url, avatar_url, bio, coordinate_count, item_count }] }`

### `GET /api/public/users/{id}`

公開プロフィール。無い ID は `404`。

---

## アイテム

権限: 所有者のみ（一覧・作成・詳細の本人用）。

### `GET /api/owner/items?page=&per_page=&q=&g=&cat=&season=&status=&declutter=1&sort=&include_facets=1`

→ `{ "data": ItemSummary[], "meta": { page, per_page, total, total_pages } }`  
`cat`=システムカテゴリ、`season`=`春|夏|秋|冬`、`status`=`public|private`、`declutter=1`=断捨離候補のみ。`sort`=`newest`|`category`|`favorite_desc`|`favorite_asc`|`links_*`  
`include_facets=1` のとき `facets` と `visibility_by_id` を同梱（My* は空／契約外）。

### `POST /api/owner/items`

```json
{
  "title": "",
  "description": "",
  "category": "袷",
  "gender": "women",
  "visibility": "public",
  "color_tone": null,
  "tags": [],
  "image_urls": ["http://…"]
}
```

→ `201` ItemDetail（owner フル）

### `GET|PATCH|DELETE /api/owner/items/{id}`

本人のみ。`401` / `403` / `404`。PATCH は未指定キーを触らない。

### `GET /api/public/items/{id}`

`visibility=public` のみ。非公開は `404`

### `GET /api/public/items/{id}/neighbors`

公開新着順で当該 ID が属するページ分（既定12）。`{ data }`。非公開・無い ID は `404`。**全件禁止**。

### `GET /api/public/items?page=&per_page=&q=&g=&user=&season=&cat=&tag=`

公開のみチャンク。`user=` で投稿者絞り。  
`q` は title / description / category / tags / **投稿者名**。  
`cat`=システムカテゴリ、`season`=`春|夏|秋|冬`（tags に含む）、`tag`=タグ完全一致。

---

## 画像

生オリジナルは保存しない。サーバで向き適用・メタ削除・長辺≤2048 の **マスター** と、マスターから切った **正方形表示用** を残す。

### `POST /api/owner/images`

`multipart/form-data`  
- `file`（必須・マスター原寸・仮上限 20MB）  
- `square`（任意・クライアントで焼いた表示用正方形）  
- `unused`（任意・`1` のとき未使用プール入り。整理画面アップロード用。投稿クロップは付けない）

→ `201`

```json
{
  "id": "…",
  "master_url": "/media/{userId}/{id}/master.jpg",
  "square_url": "/media/{userId}/{id}/square.jpg",
  "url": "/media/…/square.jpg",
  "width": 1600,
  "height": 1200,
  "bytes": 123456,
  "in_unused_pool": false
}
```

### `PUT /api/owner/images/{id}/square`

マスターは維持し、表示用正方形だけ差し替え（再クロップ）。`multipart` の `file` または `square`。

### `POST /api/owner/images/{id}/square/reset`

マスターから中央 cover の初期正方形を再生成（トリミングのリセット）。投稿の `images_json` 参照も更新。

投稿の `image_urls` には当面 `url`（square）を渡してよい。再クロップは `master_url` 起点。

### `POST /api/owner/images/{id}/park`

投稿編集で画像を外したとき、未使用プールへ移す（`in_unused_pool=1`）。  
流入はこの明示操作と、整理画面アップロード（`unused=1`）だけ。トリミング差し替えでは増やさない。

### `GET /api/owner/images`

所有者の **未使用プール**（`in_unused_pool=1` かつ投稿未参照、直近100件）。  
投稿に載ったままのものは一覧に出さない。保存で載せた画像はプールフラグも外れる。  
参照中の完全削除は `DELETE` が `409`。

### `DELETE /api/owner/images/{id}`

所有者のみ。DB 行とアップロードディレクトリを削除。  
投稿（items / coordinates の `images_json`）で参照中なら `409 { "error": "in_use" }`。

### `GET /media/...`

処理済みファイルの配信。

---

## コーデ

### `GET /api/owner/coordinates?page=&per_page=&temp=1&q=&g=&season=&obi=&status=&sort=&include_facets=1`

- 既定: **本コーデのみ**（`is_temp=0`）
- `temp=1`: **仮コーデのみ**（混在しない）
- `season`: `春|夏|秋|冬`（tags に含むもの。`temp=1` 時は無視）
- `status`: `public` \| `private`（任意）
- `q` / `g` / `obi` / `sort`（`newest`|`worn`|`links_desc`|`links_asc`）
- `include_facets=1` のとき `facets` と `visibility_by_id` を同梱

### `POST /api/owner/coordinates`

```json
{
  "title": "",
  "description": "",
  "gender": "women",
  "visibility": "public",
  "obi_knot": "指定なし",
  "tags": [],
  "image_urls": [],
  "is_temp": true,
  "item_ids": ["itemId1"]
}
```

- `is_temp: false` のとき `image_urls` は1枚以上必須  
- `is_temp: true` のとき画像0枚可。紐付けがある場合はサーバがコラージュを生成して `image_url` に載せる

→ `201` owner フル（`is_temp` / `items[]` 含む）

### `GET|PATCH|DELETE /api/owner/coordinates/{id}`

本人のみ。PATCH で仮 ON/OFF・画像固定など。

### `PUT /api/owner/coordinates/{id}/items`

紐付け確定（全置換）:

```json
{ "item_ids": ["a", "b", "c"] }
```

本人のアイテムのみ。順序＝表示順。  
仮コーデ（`is_temp`）では紐付け変更のたびにサーバ側で合成し直し、`images` を更新する（アイテム0なら空）。

### `GET /api/public/coordinates/{id}`

公開のみ。非公開は `404`。

### `GET /api/public/coordinates/{id}/neighbors`

公開本コーデ新着順で当該 ID が属するページ分。`{ data }`。仮・非公開・無い ID は `404`。

### `GET /api/public/coordinates?page=&per_page=&q=&g=&user=&season=&obi=&tag=`

公開のみチャンク。`user=` で投稿者絞り。  
`q` は title / description / tags / obi / **投稿者名**。  
`season`=`春|夏|秋|冬`（tags に含む）、`obi`=帯結び、`tag`=タグ完全一致。

---

## 管理

### `GET /api/admin/users` / `GET /api/admin/users/{id}`

運営向けユーザー一覧・詳細（camelCase カウンタ）。要ログイン。

### `PATCH /api/admin/users/{id}`

```json
{
  "email": "a@example.com",
  "name": "表示名",
  "status": "active|suspended|withdrawn",
  "adminNote": "メモ",
  "mailRejected": false,
  "premiumId": null
}
```

→ `{ data: AdminUser }`

### `POST /api/admin/users/{id}/password-reset`

spike は一時パスワードを発行して返す（本番は案内メール想定で本文に載せない）。

### `GET /api/admin/stats`

`{ source, kpis, activity, usage }`。KPI 形は `docs/API_CONTRACT.md` の AdminKpis。

### `POST /api/public/usage/pageview`

ボディは主に `{ path }`（閲覧者はセッション／匿名 Cookie で判定）。日次 UU/PV 用。

**PV の定義（フロント UsageBeacon／`usage-pageview` と揃える）**

- **数える:** 画面遷移が落ち着いたあと、表示中の **pathname** ごとに 1 回（一般的な SPA の仮想 PV）
- **数えない:** 同一ドキュメント内の同一 pathname 再送、認証の後追い、ごく短いリダイレクト連鎖、**クエリ／hash のみ**の変化、**`/admin`**
- **フルリロード:** その画面を改めて 1 回
- サーバ側は同一閲覧者・同一 path の極短連打（〜300ms）だけ安全網で落とす

動線確認: `cd spike/scripts && npm i && node verify-pv.mjs`（Next+spike 起動中・他タブ注意）。

---

## 入力ガード（spike）

書き込み・検索クエリは `src/lib/sanitize.ts` で共通処理する。

- 表示名・メモ・タグ等: HTML／スクリプト風の文字列を拒否、制御文字除去、長さ上限
- 画像 URL: `/media/...`（仮コーデ用プレースホルダのみ例外）
- 外部スキーム（`javascript:` 等）・`..` を拒否
- 検索 `q`: 長さ制限＋ LIKE の `%` `_` をエスケープ（ワイルドカード注入防止）

フロントにも同様の軽いガード（`frontend/src/lib/safe-input.ts`）があるが、拒否の本命は API 側。

---

## 広告・協賛

### `GET|PUT /api/admin/ads`

案件配列（camelCase: `imageUrl`, `startOn` 等）。要ログイン。

### `GET|PUT /api/admin/logo-sponsors`

協賛ロゴ配列。要ログイン。

### `GET /api/public/ads/pick?placement=home_top|coord_detail|item_detail`

配信候補からランダム1件。`{ data: ad|null }`。

### `POST /api/public/ads/events` `{ "adId", "type": "impression"|"click" }`

`impression` はビューアブル相当（枠面積の約半分以上が **連続1秒** 見えたとき。IAB 系の一般定義）。`click` は枠クリック。

### `GET /api/public/ads/logo-sponsors`

表示中の協賛のみ。

---

## これから足す口（任意）

1. 置き場を SQLite → 他（Supabase 等）へ差し替え（**必須ではない**・証明用）  
2. 新DB意図の正: [`../../docs/NEW_DB.md`](../../docs/NEW_DB.md)

接続手順: `spike/README.md`「Next UI からつなぐ」。

フィールド名は可能な範囲で既存 `docs/API_CONTRACT.md` に揃える（My* 除く）。

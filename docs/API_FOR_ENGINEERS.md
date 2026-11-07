# エンジニア側向け — API 理解の入口（厚め）

このリニューアルの **本丸は API＋新DB** です。  
Next 画面は企画側が用意済み。エンジニア側にお願いしたいのは、**同じ手続きを新DB＋AWS の正式棚に実装すること**です（置き方は協議）。

```
新DB ──(正式 API)──▶ /api/... JSON ──▶ Next UI が描画
         ↑
   手続きの見本: spike/docs/API.md
   スキーマ意図: docs/NEW_DB.md
```

経緯・前提は [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md)。  
企画側は `spike/` で「仕様どおり動く」ことを検証しています（本番扱いしない）。

**役割の正:** [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) ・ [`NEW_DB.md`](./NEW_DB.md)  
**手続き見本:** [`../spike/docs/API.md`](../spike/docs/API.md)  
**禁止の短文:** [`DO_NOT.md`](./DO_NOT.md)  
**AI に渡す最短入口:** [`../AGENTS.md`](../AGENTS.md)  
**進捗の共有:** [`LEADER_STATUS.md`](./LEADER_STATUS.md)

---

## 0. 30分で掴む（必読）

### 何が「完成」か

| すでにある（企画側・触らない） | エンジニア側で実装 |
|-------------------------------|--------------|
| Next UI（`frontend/`） | 新DB＋正式 API（AWS 上・置き方は協議） |
| パス・クエリ・JSON の形 | [`NEW_DB.md`](./NEW_DB.md) に沿ったスキーマ実装 |
| spike／モック見本 | 公開判定・所有者判定をサーバで担保 |
| 画面からの呼び出し | ページング・検索のサーバ側絞り込み・必要データの移行 |

フロントを「動かす」こと自体は、モック／spike で可能です。

```bash
cd frontend && npm install && npm run dev
# spike 時は spike/README.md 参照
```

本番相当にするには、正式 API 実装のあと Next に:

```bash
NEXT_PUBLIC_API_BASE_URL=https://（正式APIのオリジン）
```

を足す（フロント改修なし）。

### 肝になる考え方（これだけ覚える）

1. **一覧はサーバで絞って、チャンクだけ返す**（全件取得→フロント絞りは禁止）  
2. **公開と所有者は口を分ける**（`/api/public` に非公開を混ぜない）  
3. **非公開の詳細は 404**（存在を漏らす 403 は避ける）  
4. **手続きの見本＝spike**（既存スパゲティを正にしない）  
5. **spike／Supabase＝本番ではない**

### 三つの口（混ぜると事故る）

| 接頭辞 | 誰 | 典型 |
|--------|-----|------|
| `/api/public/...` | 誰でも | トップ・検索・他人プロフ・公開詳細 |
| `/api/owner/...` | **その投稿の所有者だけ** | 自分のマイページ一覧・本人用詳細フル |
| `/api/me/...` | **ログイン本人のコレクション** | いいね／フォローした投稿 |

よくある間違い:

| やりがち | 正しいやり方 |
|----------|--------------|
| 公開一覧に `scope=favorite` | `/api/me/favorites` |
| 公開詳細に `private_note` | owner 詳細だけ |
| 非公開 ID を 403 | **404** |
| 検索で全件 `data` | `meta` 付きで **1ページ分だけ** |
| owner 詳細を「差分パッチ」だけ返す | 公開と同型の **フル** ＋所有者専用 |

一覧の正: [`API_CATALOG.md`](./API_CATALOG.md)  
フィールド: [`API_CONTRACT.md`](./API_CONTRACT.md)  
機械可読: [`openapi.yaml`](./openapi.yaml)

---

## 1. 読む順（人向け・初速用）

通読は不要。**この順でピンポイント**に読む。

| 順 | 文書 | 何のために |
|----|------|------------|
| 1 | **本ファイル** | 全体像・落とし穴 |
| 2 | [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) | 触ってよい／だめ |
| 3 | [`DO_NOT.md`](./DO_NOT.md) | 禁止の短文 |
| 4 | [`API_CATALOG.md`](./API_CATALOG.md) | 全エンドポイント早見 |
| 5 | [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) | 一覧・検索の作り方 |
| 5b | [`SEARCH_SCALE.md`](./SEARCH_SCALE.md) | 件数増に備える検索索引・クエリ方針 |
| 6 | [`NEW_DB.md`](./NEW_DB.md) | 新スキーマ意図 |
| 7 | [`../spike/docs/API.md`](../spike/docs/API.md) | 手続きの見本（読み書き） |
| 8 | [`API_CONTRACT.md`](./API_CONTRACT.md) | 必須／任意・命名 |
| 9 | 見本 JSON `frontend/src/mocks/api/` ・ spike 実走 | 最終形の具体例 |
| あと | [`openapi.yaml`](./openapi.yaml) | 読み取り中心（書き込み昇格途上） |

実装の目安順（正式棚でも同じ）: **一覧 → 詳細 → owner／users → me → 書き込み**。一覧が先。詳細の関連も「一覧を全件取る」前提にしない。

---

## 2. 画面 → API（実装の地図）

図付きの俯瞰: [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md)

| 画面 | 呼ぶ API（要約） |
|------|------------------|
| `/` トップ | 新着: `GET .../coordinates|items?page=1&per_page=9`（3列×3行） |
| `/search`（コーデ／アイテム） | 同上 ＋ `q`/`tag`/`g`/`season`/`cat`/`obi` ＋ **meta 必須** |
| `/search?m=u`（ユーザー） | `GET /api/public/users`（`q`・チャンク・**meta**）。`q` 空は空一覧 |
| `/c/{id}` `/i/{id}` | 本人なら owner 詳細フル、だめなら public 詳細。非公開は public で 404。下部「他の〜」は詳細内 `related_*`。紐づけ候補一覧は owner 一覧 |
| 詳細の前後（直リンク） | `.../{id}/neighbors`（短い窓。全件禁止） |
| `/m/{他者}` 一覧 | `GET /api/public/...?user={id}`（公開のみ） |
| `/m/{id}` 人物 | `GET /api/public/users/{id}` |
| `/m/{自分}` 一覧 | `GET /api/owner/coordinates` ・ `items` |
| `/likes` | `GET /api/me/favorites?kind=...` |
| `/following` | `GET /api/me/following` ＋ `following/posts?kind=...` |
| `/compose/*` `/settings/*` | 書き込みは spike 手続きどおり（[`WRITE_PATH.md`](./WRITE_PATH.md)） |

詳細の出し分けはフロントが「本人っぽいとき owner を先に試す」。  
**権限の正はサーバ**（クライアントの隠し表示に頼らない）。

---

## 3. 見本 JSON と契約の関係

```
frontend/src/mocks/api/
  public/coordinates/list.json     ← GET /api/public/coordinates の見本
  public/items/list.json
  public/coordinates/mckX046.json  ← GET /api/public/coordinates/{id}
  public/items/mckX070.json
  public/users/mckDemo.json
  public/users/list.json           ← GET /api/public/users（検索）
  owner/coordinates/mckX046.json   ← owner 詳細の所有者キー見本
  owner/items/mckX070.json
```

パス階層 ≈ 本番 API パス。  
**ファイルそのものが本番になるのではなく、「同じ形のレスポンスを返す」**のが仕事です。

- 値は **架空**（`mck*` ID・ダミー文言）。**画像 URL だけ**現行 CDN を残してよい（表示検証・[`DO_NOT.md`](./DO_NOT.md) §13）  
- **キー名・入れ子・必須／任意**は契約＋見本に合わせる  
- `title: ""` は正常（バグではない）  
- 一覧のコーデは `obi_knot` 必須・`category` なし／アイテムはその逆（契約参照）

マップ表: [`frontend/src/mocks/api/README.md`](../frontend/src/mocks/api/README.md)

---

## 4. 一覧・検索で絶対に守ること

詳細は [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)。

```
条件で絞る → total 確定 → page/per_page で切片
→ { "data": [1ページ分], "meta": { page, per_page, total, total_pages } }
```

| 項目 | 値 |
|------|-----|
| 既定 `per_page` | **12** |
| トップ | クエリなし先頭セット。`meta` 省略可 |
| 検索 | **`meta` 必須**。全件を `data` に載せない |
| `user=` | その人の **公開**投稿のみ（owner／非公開は載せない） |
| `cat` | items のみ |
| `obi` | coordinates のみ |

公開一覧に会員の `scope` を復活させない。

---

## 5. 公開範囲・セキュリティ（受け入れで必ず見る）

| ケース | 期待 |
|--------|------|
| 非公開コーデ／アイテムを public 詳細 | **404** |
| 他人セッションで owner 詳細／一覧 | **401/403** |
| public JSON | `private_note` / `owner_status` / `view_count` / お気に入り度 / 断捨離 **なし** |
| Myフォルダ／Myカテゴリ | **契約対象外**（レスポンス／クエリに載せない） |
| owner 詳細 | 公開と同型フル ＋ 所有者専用（差分だけ返さない） |

運用メモ: [`OPS_SECURITY.md`](./OPS_SECURITY.md)  
並走 Next の Basic 認証なども同ドキュメント。

---

## 6. 命名で迷いやすいところ

| UI | API | 注意 |
|----|-----|------|
| システムカテゴリ | `category` | アイテム必須 |
| 公開範囲（owner） | `owner_status` | `public` \| `private` |
| コーデ／アイテム | `coordinates` \| `items` | URL の `m=c\|i` はフロント用。検索ユーザーは `m=u` |

全文: [`API_CONTRACT.md`](./API_CONTRACT.md) 冒頭の命名規則。

---

## 7. ローカルでの受け入れイメージ（公開一覧）

正式棚または spike に対して、例:

```bash
# 先頭セット（トップ相当）
curl -sS "$API/api/public/coordinates?page=1&per_page=12" | jq '.data | length, .meta'

# 検索（meta 必須・1ページ分）
curl -sS "$API/api/public/items?cat=%E5%8D%98%E8%A1%A3&page=1" | jq 'keys, .meta'

# 非公開 ID（用意できる場合）→ 404
curl -sS -o /dev/null -w "%{http_code}\n" "$API/api/public/coordinates/（非公開ID）"
```

Next:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://（APIオリジン）
```

`/` と `/search` がモック無しで同じ操作感なら公開一覧は受け入れに近い。

チェックリスト正: [`API_CATALOG.md`](./API_CATALOG.md) §5 ・ [`API_CONTRACT.md`](./API_CONTRACT.md)

---

## 8. FAQ（初速で詰まりやすい点）

**Q. DB スキーマはこのリポにある？**  
A. 意図は [`NEW_DB.md`](./NEW_DB.md)。受け渡し形は [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md)。spike は証明用 SQLite。

**Q. 見本と同じ ID で返さないとだめ？**  
A. **だめではない。** 形が合えばよい。

**Q. OpenAPI と Markdown どっちが正？**  
A. 人が読む正は **CATALOG / CONTRACT**。書き込み手続きは **spike/docs/API.md**。OpenAPI は読み取り中心の副本。

**Q. いいね／フォロー POST は不要？**  
A. **不要ではない。** 一覧 GET と toggle の見本は spike にある。正式棚は同じ手続きで実装する。

**Q. 詳細の関連コーデを別 API で全件取りたい**  
A. **しない。** 詳細レスポンスの `related_*` に含める。neighbors は短い窓。紐づけ候補一覧は owner 一覧。

**Q. キャッシュしてよい？**  
A. **公開確定だけ。** 非公開・自分のみ・下書きは載せない。公開→非公開は即無効化。ログイン専用は不向き。  
（方針: `.cursor/rules/running-cost-aware-design.mdc`）

**Q. 検索が重くならない？**  
A. 現行の全件寄りは移植しない。索引・`cat` はカテゴリ起点・深い OFFSET／厳密 COUNT の扱いを [`SEARCH_SCALE.md`](./SEARCH_SCALE.md) に従う。検索エンジン常時並走は後回し。

---

## 9. いま渡すとよいもの（ミーティング用）

エンジニア側への初回セット:

1. [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md)  
2. [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) ・ [`DO_NOT.md`](./DO_NOT.md)  
3. 本ファイル（落とし穴・画面地図）  
4. [`API_CATALOG.md`](./API_CATALOG.md) ・ [`openapi.yaml`](./openapi.yaml)  
5. 任意: `spike/` を動かして体感  

「手続きと新DB意図を読んで、正式棚で同じ口を返す」——これが仕事です。

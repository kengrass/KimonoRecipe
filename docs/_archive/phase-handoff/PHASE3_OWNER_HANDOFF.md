# owner / プロフィール API — フィールド見本（旧 Phase3）

> **Phase1〜3 の作業段階は廃止。** 既存 Laravel DB への接続指示としては使わない。  
> 本番の正: [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md) ・ [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md)  
> 本ファイルは owner・users・`user=` の **形の見本**。書き込みの正は spike。

前提: [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) ・ [`API_CONTRACT.md`](./API_CONTRACT.md) ・ [`WRITE_PATH.md`](./WRITE_PATH.md)

---

## 1. 所有者一覧

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/owner/coordinates` | 自分のコーデ（非公開含む） |
| GET | `/api/owner/items` | 自分のアイテム（非公開含む） |

- 未ログイン／非所有者は 401/403
- クエリ語彙は公開一覧＋マイページ固有（`temp` / `declutter` / `sort` 等。`my_folder`／`my_category` は契約外）
- **公開 API に「自分のときだけ非公開も返す」flag を足さない**
- `include_facets=1` で `facets`（チップ集計）。任意で `visibility_by_id`（当該ページ分）
- 形: [`API_CONTRACT.md`](./API_CONTRACT.md) owner 一覧節

フロント: `getOwnerListPage`（`lib/api.ts`）← `loadMypagePage`（本人時）

---

## 2. 他人プロフィール一覧（公開のみ）

公開一覧と同じエンドポイントに **投稿者フィルタ** を付ける。

| クエリ | 意味 |
|--------|------|
| `user` | 投稿者ユーザー ID。**必須（この用途では）** |
| `include_facets` | `1` のとき `facets`（owner と同形。`visibility_by_id` は不要） |
| ほか | `q` / `season` / `cat` / `obi` / `page` / `per_page` は公開一覧と同じ |

例:

```
GET /api/public/coordinates?user=FL6QQa&page=1
GET /api/public/items?user=FL6QQa&page=1
```

ルール:

- そのユーザーの **公開** 投稿だけ
- `user` 未指定は従来どおり全体の公開一覧（トップ・検索）
- レスポンス形は公開一覧と同じ `{ data, meta }`

フロント: `getPublicProfileListPage` → 内部で公開一覧に `user=`

モック一覧フィルタ: `public-list-query.ts` の `user`、`queryPublicProfileListPage`

---

## 2b. 公開プロフィール（人物）

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/public/users/{id}` | マイページ上部（名前・bio・SNS 等） |

- 無いユーザーは 404
- 公開してよい項目だけ（非公開 bio／サイズは載せない）
- 見本・契約: [`API_CONTRACT.md`](./API_CONTRACT.md) ・ `mocks/api/public/users/FL6QQa.json`

フロント: `getPublicUser` ← `/m/[id]`（一覧より先に人物を解決）

---

## 3. 詳細まわり（再確認）

- 公開詳細で非公開 ID は **404**
- owner 詳細は **公開詳細と同型フル ＋ 所有者専用**（差分パッチではない）
- フロントは本人なら owner フル優先、だめなら公開へフォールバック（`load-detail.ts`）
- 前後ナビ: `/api/public/.../{id}/neighbors`（短い窓。全件禁止）

可視性の正はサーバ。公開 API に非公開を載せない。本人用は本人以外に渡さない。

---

## 4. 書き込み（投稿・設定・紐付け）

**この Phase の必須ではない。** 当面は既存 Laravel 画面へ deep-link。

| 操作 | 当面 |
|------|------|
| コーデ／アイテム作成 | `LARAVEL.addCoordinate` / `addItem` |
| 未使用画像 | `LARAVEL.unusedImages` |
| プロフィール設定 | `LARAVEL.mypage` |
| 詳細の紐付け | 候補一覧は `GET /api/owner/...`（本人一覧と同じ）。確定保存は Next 見た目のみ |

Next に POST/PATCH を載せるときは契約を `API_CONTRACT.md` に追記してから。  
運用の詳細: [`WRITE_PATH.md`](./WRITE_PATH.md)

---

## 5. 受け入れチェック（Laravel）

- [ ] `?user=` 付き公開一覧がそのユーザーの公開投稿のみ返す
- [ ] `GET /api/public/users/{id}` が公開プロフィールを返す（無い ID は 404）
- [ ] `user` なしの公開一覧の挙動がトップ／検索と変わらない
- [ ] owner 一覧が非公開を含み、他人セッションでは 403
- [ ] `include_facets=1` で `facets` が返る（owner・`user=` 付き公開）
- [ ] owner 一覧に当該ページの `visibility_by_id`（Next マイページ用）
- [ ] 公開詳細が非公開 ID で 404
- [ ] owner 詳細が **フル**（公開項目＋所有者専用）で本人のみ
- [ ] 本人が非公開詳細を Next で開ける
- [ ] neighbors が全件を返さない

フロント確認: モックバーで所有者／他者／未ログインを切り替え、`/m/[id]` の一覧が入れ替わること。

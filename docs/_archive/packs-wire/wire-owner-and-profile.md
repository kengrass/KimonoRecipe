# Pack（参考・廃止）: owner / プロフィール / user=

> **廃止:** 既存 DB 接続の作業 pack としては使わない。  
> 正の入口: [`../NEW_DB.md`](../NEW_DB.md) ・ [`../../spike/docs/API.md`](../../spike/docs/API.md) ・ [`./README.md`](./README.md)

## ゴール（フィールド見本）

- `GET /api/owner/coordinates` ・ `/api/owner/items`（本人・非公開含む）
- `GET /api/owner/coordinates/{id}` ・ `/api/owner/items/{id}`（**詳細フル**＝公開同型＋所有者専用）
- `GET /api/public/users`（公開ユーザー検索・`/search?m=u`）
- `GET /api/public/users/{id}`（公開プロフィール／名刺）
- 公開一覧の `?user=`（他人プロフィール一覧・公開のみ）

## 読んでよいファイル（この順）

0. [`../API_FOR_ENGINEERS.md`](../API_FOR_ENGINEERS.md)（全体像・初速）  
1. [`../../AGENTS.md`](../../AGENTS.md)  
2. [`../DO_NOT.md`](../DO_NOT.md)  
3. [`../API_CATALOG.md`](../API_CATALOG.md) §2.1 users・§2.2・`user=`  
4. [`../PHASE3_OWNER_HANDOFF.md`](../PHASE3_OWNER_HANDOFF.md)  
5. [`../LIST_QUERY_ARCHITECTURE.md`](../LIST_QUERY_ARCHITECTURE.md) §3  
6. [`../API_CONTRACT.md`](../API_CONTRACT.md) Phase3（owner 詳細・users）  
7. 見本: `frontend/src/mocks/api/public/users/FL6QQa.json` ・ `owner/...`  
8. 任意: [`../openapi.yaml`](../openapi.yaml)

## 触るな

- 公開 API に「自分のときだけ非公開も返す」flag を足すこと
- Next UIのマイページ UI 改修
- 書き込み API

## やること（既存 DB）

1. owner 一覧: セッション所有者が自分の投稿のみ（他人は 401/403）  
2. クエリ語彙は LIST_QUERY §3（公開と揃えるもの＋`temp`／`declutter` 等。`my_folder`／`my_category` は**契約外・実装不要**）  
3. `user=` 付き公開一覧: そのユーザーの **公開** 投稿だけ  
4. owner 詳細: **公開詳細と同じ本文項目 ＋** `private_note` / `owner_status` / `edit_url` 等。組み立ては公開詳細と共有しダブルメンテを防ぐ  
5. 公開詳細は非公開 404 のまま（本人用に寄せない）  
6. `GET /api/public/users/{id}`: 公開してよい人物情報のみ。無い ID は 404。非公開 bio／サイズは載せない  
7. `GET /api/public/users`: `q` で name／bio。空 `q` は空一覧（全件名簿禁止）。チャンク＋`meta`。見本 `mocks/api/public/users/list.json`  

## 完了条件

- [ ] PHASE3 チェックリスト  
- [ ] `user` なしの公開一覧挙動がトップ／検索と変わらない  
- [ ] 本人が非公開 `/c` `/i` を開ける  
- [ ] `/m/{id}` が users + 一覧 API だけで本人／他人で正しく分岐（フロント改修なし）  
- [ ] `/search?m=u` が `GET /api/public/users` で動く（`q`・`meta`）

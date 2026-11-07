# Pack（参考・廃止）: 公開一覧・検索

> **廃止:** 既存 DB 接続の作業 pack としては使わない。  
> 正の入口: [`../NEW_DB.md`](../NEW_DB.md) ・ [`../../spike/docs/API.md`](../../spike/docs/API.md) ・ [`../packs/README.md`](./README.md)

## ゴール（フィールド見本）

次を **契約どおりの形**で返す（実装先は新DB）。

- `GET /api/public/coordinates`
- `GET /api/public/items`

検索クエリでサーバ側絞り込み。検索は `meta` 付きページング必須。

## 読んでよいファイル（この順）

0. [`../API_FOR_ENGINEERS.md`](../API_FOR_ENGINEERS.md)（全体像・初速）  
1. [`../AGENTS.md`](../../AGENTS.md)  
2. [`../DO_NOT.md`](../DO_NOT.md)  
3. [`../API_CATALOG.md`](../API_CATALOG.md) §2.1  
4. [`../PHASE1_LIST_HANDOFF.md`](../PHASE1_LIST_HANDOFF.md)  
5. [`../API_CONTRACT.md`](../API_CONTRACT.md) の Phase1・命名規則  
6. 見本: `frontend/src/mocks/api/public/coordinates/list.json` ・ `items/list.json`  
7. 任意: [`../openapi.yaml`](../openapi.yaml)

## 触るな

- `frontend/src/app/(main)/**`
- `frontend/src/base/**`
- 契約のパス・フィールド名の変更
- `/api/me` や owner 一覧（別 pack）

## やること（既存 DB）

1. 現行サイトの「公開コーデ／公開アイテム」と同じ集合を特定する  
2. `PublicListItem` へマッピング（必須キー欠落・空 `image_url` は返さない）  
3. クエリ `q` / `tag` / `g` / `season` / `cat` / `obi` / `page` / `per_page` をサーバで適用  
4. コーデの `cat` は **紐づく公開アイテムの category**（非公開アイテムではヒットさせない）。索引・形は [`SEARCH_SCALE.md`](../SEARCH_SCALE.md)  
5. 検索レスポンスは `{ data, meta: { page, per_page, total, total_pages } }`  
6. 公開のみ（非公開・下書きは出さない）

## 完了条件

- [ ] PHASE1 受け入れ条件を満たす  
- [ ] 見本 `list.json` とキー集合が一致（値は実データでよい）  
- [ ] `per_page` 省略時 12、検索で全件を `data` に載せない  
- [ ] 公開検索向け索引（[`SEARCH_SCALE.md`](../SEARCH_SCALE.md) §2）を入れ、代表クエリを `EXPLAIN` で確認  
- [ ] Next は `NEXT_PUBLIC_API_BASE_URL` を向けるだけで一覧・検索が動く（フロント改修なし）

## 出さないもの

owner 専用フィールド、会員コレクション、書き込み API。

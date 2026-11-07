# 詳細索引（AI・深掘り用）

人が最初に読むのは **[`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md)**（1枚の方針）です。  
このファイルは、AI にリポを読ませるときや、実装中に参照するリンク集です。

更新: 2026-11-07

---

## 方針の要約

経緯・前提は [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) にだけ書いてある。ここはリンク集。

- **スタート地点:** 提供済み＝UI＋API の形＋spike 見本。**このリポをそのまま公開する想定はない**（定義は FOR_ENGINEERS）  
- 新UI／API／新DBを本番の正にする（本番実装は正式棚）  
- spike は動く証明（任意・本番ではない。穴ごとコピーしない）  
- 移行は **ユーザー単位＋大口案 B**（正は [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md)）  
- モック画像 URL は現行 CDN 残し（確定）。正式棚の体制・時期は後回し（[`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md)）  
- API 文書の正: 一覧=`API_CATALOG`／フィールド=`API_CONTRACT`／手続き=`spike/docs/API.md`／OpenAPI=読み取り副本  

---

## AI に渡すとき（例）

> `docs/FOR_ENGINEERS.md` を正として意図を把握して。  
> ローカルは `spike/README.md` と `frontend/` で起動確認まで。  
> 詳細が要るときだけ `docs/NEW_DB.md` ・ `spike/docs/API.md` ・ `docs/DO_NOT.md` を読んで。  
> Next UI のリデザイン、契約の独断変更、既存スパゲティの継承、spike＝本番扱いはしない。  
> 正式棚に着手するなら `docs/FORMAL_SHELF_STARTER.md`（WAF・発注側アカウント前提）。

---

## 参照リンク

| 用途 | 文書 |
|------|------|
| **人向け1枚** | [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) |
| 役割 | [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) |
| 新DB意図 | [`NEW_DB.md`](./NEW_DB.md) |
| 移行の受け渡し | [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) |
| 正式棚スターター（とりあえず） | [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md) |
| API 手続き | [`../spike/docs/API.md`](../spike/docs/API.md) |
| 禁止 | [`DO_NOT.md`](./DO_NOT.md) |
| 進捗 | [`LEADER_STATUS.md`](./LEADER_STATUS.md) |
| エンドポイント早見 | [`API_CATALOG.md`](./API_CATALOG.md) |
| フィールド | [`API_CONTRACT.md`](./API_CONTRACT.md) |
| 一覧方針 | [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md) |
| 書き込み現状 | [`WRITE_PATH.md`](./WRITE_PATH.md) |
| 並走・SEO | [`OPS_SECURITY.md`](./OPS_SECURITY.md) |
| spike 起動 | [`../spike/README.md`](../spike/README.md) |
| AI 入口 | [`../AGENTS.md`](../AGENTS.md) |

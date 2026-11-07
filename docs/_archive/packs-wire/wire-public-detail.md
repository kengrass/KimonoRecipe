# Pack（参考・廃止）: 公開詳細

> **廃止:** 既存 DB 接続の作業 pack としては使わない。  
> 正の入口: [`../NEW_DB.md`](../NEW_DB.md) ・ [`../../spike/docs/API.md`](../../spike/docs/API.md) ・ [`./README.md`](./README.md)

## ゴール（フィールド見本）

- `GET /api/public/coordinates/{id}`
- `GET /api/public/items/{id}`
- （推奨）`GET /api/public/coordinates|items/{id}/neighbors`

## 読んでよいファイル（この順）

0. [`../API_FOR_ENGINEERS.md`](../API_FOR_ENGINEERS.md)（全体像・初速）  
1. [`../../AGENTS.md`](../../AGENTS.md)  
2. [`../DO_NOT.md`](../DO_NOT.md)  
3. [`../API_CATALOG.md`](../API_CATALOG.md) §2.1 詳細・neighbors  
4. [`../PHASE2_DETAIL_HANDOFF.md`](../PHASE2_DETAIL_HANDOFF.md)  
5. [`../API_CONTRACT.md`](../API_CONTRACT.md) Phase2  
6. 見本: `frontend/src/mocks/api/public/coordinates/FgNzIyU.json` ・ `items/ISSIeSA.json`  
7. 任意: [`../openapi.yaml`](../openapi.yaml)

## 触るな

- Next UI
- owner 詳細 API（別 pack）
- 関連を埋めるための全件一覧 API 呼び出し設計

## やること（既存 DB）

1. 公開のみ返す。非公開 ID は **404**  
2. 構成アイテム／利用コーデ／関連を **詳細レスポンスに含める**  
3. `private_note` / `owner_status` / `view_count` 等を公開詳細に載せない  
4. neighbors は当該 ID を含む短い窓のみ（全件禁止）

## 完了条件

- [ ] PHASE2 の受け入れを満たす  
- [ ] 見本 JSON とキー方針が一致  
- [ ] Next 詳細が API ベース URL 切り替えだけで表示できる（フロント改修なし）

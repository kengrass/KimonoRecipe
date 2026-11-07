# 擬似 API レスポンス

本番／spike と同じパス階層に JSON を置いています。`USE_MOCK_API` 時に `src/lib/api.ts` 経由で読みます。

**渡すセット:** [`docs/HANDOFF.md`](../../../../docs/HANDOFF.md)  
**エンドポイント早見:** [`docs/API_CATALOG.md`](../../../../docs/API_CATALOG.md)

## 公開一覧

| 本番 | ファイル |
|------|----------|
| `GET /api/public/coordinates` | `public/coordinates/list.json` |
| `GET /api/public/items` | `public/items/list.json` |
| 一覧1件パッチ | `public/.../_list/{id}.json` |

Next `/` は上記 `list.json`（先頭セット）。`/search` はモック時カタログをサーバ側で絞る。  
検索方針: [`docs/LIST_QUERY_ARCHITECTURE.md`](../../../../docs/LIST_QUERY_ARCHITECTURE.md)

## 詳細・owner・users

| 本番 | ファイル |
|------|----------|
| `GET /api/public/coordinates/{id}` | `public/coordinates/{id}.json` |
| `GET /api/public/items/{id}` | `public/items/{id}.json` |
| `GET /api/public/users/{id}` | `public/users/{id}.json` |
| `GET /api/owner/coordinates/{id}` | `owner/coordinates/{id}.json` |
| `GET /api/owner/items/{id}` | `owner/items/{id}.json` |

本命見本: コーデ `FgNzIyU` ・ アイテム `ISSIeSA`。  
フィールド: [`docs/API_CONTRACT.md`](../../../../docs/API_CONTRACT.md)。  
手続きの動く見本: [`spike/docs/API.md`](../../../../spike/docs/API.md)。

旧 `PHASE*_HANDOFF.md` は廃止した段階の見本（作業順にしない）。

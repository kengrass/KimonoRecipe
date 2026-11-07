# エンジニア向けガイド（Next フロント地図）

このリポジトリの `frontend/` は企画側提供の **Next UI** です。  
実装の本丸（新DB＋正式 API）は [`HANDOFF.md`](./HANDOFF.md) を正とする。

**役割:** [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) ・ [`NEW_DB.md`](./NEW_DB.md)  
**AI 入口:** [`../AGENTS.md`](../AGENTS.md)

## 5 分で掴む地図

```
app/(main)/page.tsx     ← 薄い RSC
        │
        ▼
src/base/*View          ← Next UI
        │
        ▼
src/lib/api.ts          ← モック / spike / 正式 API
        │
   ┌────┴────┐
   ▼         ▼
mocks/api   API（spike または NEXT_PUBLIC_API_BASE_URL）
```

| 言葉 | 意味 |
|------|------|
| **Next UI** | `app/(main)/` + `app/(admin)/` + `src/base/` |
| **spike** | 動く証明（任意・本番ではない） |
| **正式棚** | AWS 上の新DB＋API（エンジニア協議） |

## 読む順

1. [`HANDOFF.md`](./HANDOFF.md)  
2. [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md)  
3. この文書（フロント地図）  
4. 必要時: [`API_CATALOG.md`](./API_CATALOG.md) ・ [`WRITE_PATH.md`](./WRITE_PATH.md)

Next UI の独自リデザインはしない。

## ディレクトリ早見

| パス | 役割 |
|------|------|
| `frontend/src/app/(main)/` | 一般画面ルート |
| `frontend/src/app/(admin)/` | 管理画面 |
| `frontend/src/base/` | UI（[詳細](../frontend/src/base/README.md)） |
| `frontend/src/lib/` | API・設定・クエリ |
| `frontend/src/mocks/api/` | モック JSON |
| `spike/` | 証明用 API |

## 注意

- 一覧はサーバで絞る（全件フロント絞り禁止）
- 非公開の詳細は 404
- モック Cookie を本番の正にしない（[`OPS_SECURITY.md`](./OPS_SECURITY.md)）

# きものレシピ — Next UI（frontend）

企画側提供の Next 画面です。API 未設定時はモック、spike／正式API接続時は実データを見ます。

> **渡すセット:** [`docs/HANDOFF.md`](../docs/HANDOFF.md)  
> **並走・セキュリティ・SEO:** [`docs/OPS_SECURITY.md`](../docs/OPS_SECURITY.md)

## 起動

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000

spike 接続: [`../spike/README.md`](../spike/README.md) ・ `.env.spike.example`

## コード境界

| | 役割 |
|---|---|
| ルート | `app/(main)/` ・ `app/(admin)/` |
| UI | `src/base/` |
| API 呼び出し | `src/lib/api.ts` 等 |

方針: [`docs/MAINLINE_ARCHITECTURE.md`](../docs/MAINLINE_ARCHITECTURE.md)

## 環境変数（要約）

| 変数 | 意味 |
|------|------|
| （未設定） | モック |
| `NEXT_PUBLIC_USE_SPIKE_API` + `SPIKE_API_ORIGIN` | spike |
| `NEXT_PUBLIC_API_BASE_URL` | 正式 API |
| `NEXT_PUBLIC_SITE_URL` | canonical／OGP |
| `BASIC_AUTH_*` | 並走保護（両方あるときのみ） |

詳細: [`docs/OPS_SECURITY.md`](../docs/OPS_SECURITY.md)

## 擬似 JSON

`src/mocks/api/` — モック時の見本。説明: [`src/mocks/api/README.md`](./src/mocks/api/README.md)

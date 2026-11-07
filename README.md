# きものレシピ — Next UI ＋ API ＋ 新DB

企画側が **画面・API手続き・新DB意図** を提供するリポジトリです。  
正式棚（AWS）の置き方はエンジニアと協議。必要データのみ新DBへ移行。

## エンジニアの方へ

→ **まず [`docs/FOR_ENGINEERS.md`](./docs/FOR_ENGINEERS.md)（方針1枚）**  
経緯・前提はそこにだけ書いてあります。詳細・AI用索引は [`docs/HANDOFF.md`](./docs/HANDOFF.md)。

| すぐ開く | |
|----------|--|
| 方針1枚 | [`docs/FOR_ENGINEERS.md`](./docs/FOR_ENGINEERS.md) |
| 動く見本 | [`spike/README.md`](./spike/README.md) |
| 進捗 | [`docs/LEADER_STATUS.md`](./docs/LEADER_STATUS.md) |

## すぐ見る（フロント）

```bash
cd frontend
npm install
npm run dev
```

- http://localhost:3000/
- spike 一周: [`spike/README.md`](./spike/README.md)（任意・本番ではない）

## 構成

| パス | 内容 |
|------|------|
| `frontend/` | Next UI |
| `spike/` | 動く証明用 API＋SQLite |
| `docs/` | 仕様・契約・運用 |

索引: [`docs/README.md`](./docs/README.md) ・ 並走／SEO: [`docs/OPS_SECURITY.md`](./docs/OPS_SECURITY.md)

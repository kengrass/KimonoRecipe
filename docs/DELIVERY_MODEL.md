# 提供モデル（役割分担）

**基本方針:** フロントと API の「形」は **企画側** が完成品として提供する。  
新UI／APIから合理的に **新DBを設計**し、必要な情報だけ移行する。  
エンジニア側は、同じ手続きを **正式な棚（AWS 上の API＋DB）** に載せる。置き方は協議。

経緯は [`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md) を参照。

```
[企画側が提供・メンテ]
  Next UI
  API 手続き（パス・クエリ・JSON）
  新DB仕様（意図）
  モック／spike（動く証明・任意）

[エンジニア側がやる]
  新DBスキーマの本番実装（AWS）
  同じ API 手続きの本番実装
  既存からの必要データ移行（出元は問わない／受け取り形は MIGRATION_INTAKE）
```

**spike／Supabase＝本番ではない。** 仕様どおり作ると動く、という証明用。  
→ [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md)

## 触ってよい / 触らない

| | エンジニア側 |
|--|------|
| **やる** | 契約どおりの API を新DB上で実装する |
| **やる** | 公開／非公開・所有者判定をサーバで担保する |
| **やる** | AWS 上の DB／API 配置を企画と協議して決める |
| **やらない** | Next UI の画面・IA・コンポーネントの再設計 |
| **やらない** | エンドポイント名・クエリ・レスポンス形の独自変更 |
| **やらない** | 公開 API に非公開を混ぜる／全件返してフロントで絞る |
| **やらない** | 既存スパゲティスキーマを新系の正として継承する |

契約を変えたい場合は **先に企画側へ提案**。エンジニア側が契約を発行しない。

## エンジニア側の初速

→ まず **[`FOR_ENGINEERS.md`](./FOR_ENGINEERS.md)**（方針1枚）。  
詳細や AI 用は [`HANDOFF.md`](./HANDOFF.md)。

厚め解説: [`API_FOR_ENGINEERS.md`](./API_FOR_ENGINEERS.md)

## 関連

| 文書 | 役割 |
|------|------|
| [`NEW_DB.md`](./NEW_DB.md) | 新DB仕様（本番の正・ドラフト） |
| [`MIGRATION_INTAKE.md`](./MIGRATION_INTAKE.md) | 移行の受け渡し形 |
| [`../spike/docs/API.md`](../spike/docs/API.md) | API 手続きの見本 |
| [`API_CATALOG.md`](./API_CATALOG.md) | エンドポイント一覧 |
| [`API_CONTRACT.md`](./API_CONTRACT.md) | フィールド契約 |
| [`openapi.yaml`](./openapi.yaml) | OpenAPI（読み取り中心・昇格途上） |
| [`DO_NOT.md`](./DO_NOT.md) | 禁止事項 |
| [`WRITE_PATH.md`](./WRITE_PATH.md) | 書き込みの現状 |
| [`../spike/README.md`](../spike/README.md) | ローカル一周（証明用） |

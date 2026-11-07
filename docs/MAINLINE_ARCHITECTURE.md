# Next UI アーキテクチャ（現状）

エンジニアが「どこまで本物か」を把握するための短い地図。  
入門は [`ENGINEERING_GUIDE.md`](./ENGINEERING_GUIDE.md)。

## レイヤ

```
app/(main)/layout.tsx
  └─ SiteChrome（base/shell）
       ├─ MockAuthBar（base/dev・本番非表示）
       ├─ NavProgress / Header / SiteMenu / NewPostDialog
       └─ main → page.tsx

page.tsx（RSC・薄い）
  ├─ getServerViewerUserId（モック時 Cookie／本番はセッション差し込み）
  ├─ lib/api.*（一覧・詳細・会員フィード）
  └─ base/*View（クライアント／サーバー混在は画面による）
```

| 層 | 責務 |
|----|------|
| Route | データ取得・可視性ゲート・メタデータ |
| View（`base/`） | 表示・操作 UI |
| `lib/api` | モック／本番の分岐・パス組み立て |
| `*-query` | モック時の「サーバ側絞り込み」相当 |
| `mocks/api` | 本番パスと同型の JSON 見本 |

## 画面と成熟度

| 領域 | 読み取り | 書き込み |
|------|----------|----------|
| トップ・検索（コーデ／アイテム／ユーザー） | 強い（絞って返す・ページング） | — |
| 詳細 | 強い（近傍リスト・公開／owner 分離） | spike 時は紐付け等接続 |
| マイページ一覧 | 強い（owner / 公開プロフィール分岐）。My* UI は撤去 | — |
| いいね／フォロー | 中〜強（ゲストゲートあり） | spike 時はトグル接続 |
| compose / settings | UI あり | spike 時は保存接続（モック時は見た目確認） |
| `/admin` | spike 時は users／stats／ads | spike 時は広告・協賛永続 |

書き込みの運用は [`WRITE_PATH.md`](./WRITE_PATH.md)。画面入口は [`FRONTEND.md`](./FRONTEND.md)。

## 本番 API で特に注意する点

1. **他人プロフィール一覧**は `GET /api/public/coordinates|items?user=<id>`  
   （フロント: `getPublicProfileListPage`）。`user` なしだと全公開が混ざる。
2. **詳細**の非公開はサーバ 404。フロントのモック可視性マップは本番分岐で使わない。
3. **owner 一覧**は `/api/owner/...`。公開 API に非公開 flag を足さない。

契約の正: [`API_CATALOG.md`](./API_CATALOG.md)（一覧）・ [`API_CONTRACT.md`](./API_CONTRACT.md) ・ [`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)。  
並走・モック認証・SEO: [`OPS_SECURITY.md`](./OPS_SECURITY.md)。

## コスト方針（要約）

- 一覧・検索はサーバで条件適用（全件→フロント絞りは避ける）
- 公開後ほぼ不変なものだけキャッシュ候補。非公開は載せない／即無効化
- 追加インフラは効果が見えるまで入れない

詳細は `.cursor/rules/running-cost-aware-design.mdc`。

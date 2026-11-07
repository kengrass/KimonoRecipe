# 書き込み経路（現状）

## これだけ把握してほしいこと

| 環境 | 書き込み |
|------|----------|
| **モックのみ**（API 未接続） | Next の登録ボタンはトーストのみ。保存しない |
| **spike**（証明用） | 投稿・画像・紐付け・設定・いいね／フォロー・広告／協賛が動く。手続きの正は [`../spike/docs/API.md`](../spike/docs/API.md) |
| **正式棚（AWS・新DB）** | 同じ手続きを実装する（置き方は協議） |

本番の書き込み口を独自に発明しない。見本は spike の手続き。

## 画面ごとの現状

| 画面 | 現状 |
|------|------|
| `/compose/*`（アイテム・コーデ・未使用） | spike 時は保存・画像・紐付け接続済み。モック時は見た目確認 |
| `/settings/profile` | spike 時は表示名・bio・アバター・リンク／SNS・メール／パスワード／配信接続 |
| 詳細の紐付け確定 | spike 時は owner の `PUT .../items` 等 |
| `/admin/*` | spike 時はユーザー／統計読み取り＋広告・協賛永続。アラートは後続 |

## 画像

原寸は残さずマスターのみ、表示用正方形は別途可。再クロップはマスターから。  
方針: `.cursor/rules/image-upload-policy.mdc`  
spike: `spike/api` の upload／square 差し替え。

## 正式棚へ載せるとき

1. 手続きは [`../spike/docs/API.md`](../spike/docs/API.md)  
2. スキーマ意図は [`NEW_DB.md`](./NEW_DB.md)  
3. 同じパス／JSON を正式 API が返す  
4. Next は `NEXT_PUBLIC_API_BASE_URL` 切替が基本（UI 再発明しない）  
5. 最小構成・分担の起点は [`FORMAL_SHELF_STARTER.md`](./FORMAL_SHELF_STARTER.md)

## 広告計測（純広告）

枠: `home_top` / `coord_detail` / `item_detail` のみ。  
spike 時: `trackAdEvent` → `/api/public/ads/events`。モック時は localStorage。  
**impression** = ビューアブル（面積の約半分以上が連続1秒）。**click** = 枠クリック。

## 利用計測（PV／UU）

メインサイトのみ（`/admin` 除く）。`trackPageView` → `POST /api/public/usage/pageview`。  
pathname 単位の SPA PV（クエリのみは数えない等）。定義の正: [`../spike/docs/API.md`](../spike/docs/API.md) の pageview。

## 関連

- ローカル一周: [`../spike/README.md`](../spike/README.md)
- 提供モデル: [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md)

# リファクタ後デグレ確認リスト

Next UI（1カラム）向け。退避 `_archive/lab-20260923` と比較可。  
最終確認: 2026-11-05（コード＋モック更新に合わせて見直し）

## 共通

- [x] モックバーで 未ログイン／他者／所有者 を切替できる
- [x] ヘッダー: メニュー・検索・（ログイン時）新規投稿・アバター
- [x] 遷移フィードバック: 上部細いプログレス（`NavProgress`）＋画像遅延時のみタイルグレー（全面骨格オーバーレイは採用しない）
- [x] `scrollbar-gutter: stable`（二重スクロール防止方針）

## トップ `/`

- [x] 新着コーデ → 広告 → 新着アイテム → Pick upユーザー
- [x] 右カラムが無い（1カラム）
- [ ] タイルから詳細へ遷移・戻ると位置がおおむね復元（手動で都度確認）

## 検索 `/search`

- [x] コーデ／アイテム／**ユーザー**切替、フィルタ、クリア（実装あり）
- [x] コーデ／アイテム: 件数・ページネーション（実装あり）
- [x] ユーザー: `m=u`。`q` なしは空。名前／bio。結果から `/m/{id}`（実装あり）

## 詳細 `/c/{id}` `/i/{id}`

- [x] BrowseBar（一覧・前後）— `/c/mckX046` `/i/mckX070` で確認
- [x] 構成アイテム／利用コーデが本文下に出る（右カラムに逃げない）
- [x] コーデ／アイテム詳細: 純広告枠（案件なしは非表示）
- [x] 所有者モードで編集・非公開メモ（owner fixture 経由）。**Myフォルダ UI は無し**
- [x] Next `/c` `/i` はサーバで本人用フル／公開を出し分け（`load-detail`）
- [x] 直リンク前後ナビは `getDetailNeighborList`（全件一覧を取らない）
- [x] 紐付けダイアログ: 候補一覧は owner GET。spike 時はコーデ PUT で確定
- [ ] 手動: 仮コーデ作成・ON/OFF・合成（アイテム詳細／コーデ編集）

## いいね `/likes` ・フォロー `/following`

- [x] 未ログイン: RSC で一覧 API を叩かず誘導のみ（`CollectionGuestGate`）
- [x] ログイン: `buildLikesPage` / `buildFollowingPage` → `getMeFavoritesPage` / `getMeFollowingPostsPage` ＋ `CollectionList`
- [x] お気に入り: コーデ／アイテム切替に件数（右上の重複件数は出さない）
- [x] フォロー: 投稿一覧が主。人ブロックは「フォロー中（件数）／おすすめ」タブ
- [x] 検索も同じ `CollectionList`（`withTitles=false`）
- [x] トップ新着も `getPublicListPage`（静的 JSON 直読みなし）
- [x] 詳細 Browse は ID 列＋neighbor 実体（フル list の session 廃止）

## マイページ `/m/{id}`

- [x] 本人: プロフィール aside なし。季節／仮コーデ等（**Myフォルダ追加 UI は無し**）
- [x] 他人: 上にプロフィール。季節・システムカテゴリ等（**Myカテゴリ UI は無し**）
- [x] 「コーディネートの整理」ボタンが無い
- [x] 一覧は `loadMypagePage` → `getOwnerListPage`／`getPublicProfileListPage`（OwnerListQuery・常時 API 経路）
- [x] 旧 `my_folder` / `my_category` URL は季節・システムカテゴリへ寄せる

## モックAPI見本

- [x] 本命公開 JSON: `mocks/api/public/coordinates/mckX046.json` / `items/mckX070.json`
- [x] owner JSON: `mocks/api/owner/coordinates/mckX046.json` / `items/mckX070.json`
- [x] ユーザー検索: `mocks/api/public/users/list.json`

## 投稿・設定

- [x] `/compose/*` `/settings/profile` — モック時はプレビューバナー。spike 時は保存接続
- [x] 画像トリミング UI（正方形・回転・反転）がある
- [x] 未使用画像プールが整理画面と投稿ピッカーで共有（モック／spike）
- [x] 設定はプロフィール／アカウント中心（旧 My* パネル無し）
- [ ] 手動: spike で投稿一周・設定保存
- [ ] 手動: 公開一覧の `user=` 絞り込み

関連: [`WRITE_PATH.md`](./WRITE_PATH.md) ・ [`HANDOFF.md`](./HANDOFF.md)

## 管理 `/admin`

- [x] `/admin` 配下に統計・ユーザー・スポンサーがある
- [x] spike 時は users／stats／ads／協賛が API 接続（アラート実装は引き渡し外）

## SEO・運用セキュリティ（実装確認）

- [x] ルートメタに「モック」文言が残っていない
- [x] `/likes` `/following` `/compose/*` `/settings/*` が noindex
- [x] `/robots.txt` ・ `/sitemap.xml` が存在する（ビルド／起動後）
- [x] 検索: `cat`／`obi` 単独は index、雑多条件は noindex（`lib/seo.ts`）
- [x] API 設定時はモック認証 Cookie を無視（`server-viewer` / middleware）
- [x] セキュリティヘッダが `next.config.ts` にある
- [x] `Content-Security-Policy-Report-Only` がある（enforce ではない）
- [ ] 並走ホスト: Basic 認証 env または同等の制限（[`OPS_SECURITY.md`](./OPS_SECURITY.md) §0・§2）
- [ ] API 接続前: 受け入れゲート（[`OPS_SECURITY.md`](./OPS_SECURITY.md) §5）を満たす
- [ ] 公開切替後: Basic env を外し、`NEXT_PUBLIC_SITE_URL` を本番 URL に合わせる

関連: [`OPS_SECURITY.md`](./OPS_SECURITY.md)

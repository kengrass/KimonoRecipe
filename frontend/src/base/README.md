/**
 * Next UI（プロダクト本体）
 *
 * ## 置き場
 * | 領域 | パス | 内容 |
 * |------|------|------|
 * | トップ | `base/home/` | Hero・新着・広告・Pick up |
 * | 設定 | `base/settings/` | ユーザー情報設定（spike 時は /api/me 接続） |
 * | 投稿 | `base/compose/` | コーデ／アイテム・未使用画像・クロップ・仮コーデ（spike 時は保存） |
 * | フォーム | `base/form/` | 投稿・設定の共通部品・FormPageShell・プレビューバナー |
 * | 共通UI | `base/` | PageShell・グリッド・TileImage・SectionHeader・list-browse |
 * | 検索 | `base/Search*` | コーデ／アイテム／ユーザー・フィルタ・結果・ページネーション |
 * | 詳細 | `base/detail/` | 詳細・シェル・Browse・紐付け（spike 時は PUT 保存） |
 * | マイページ | `base/mypage/` | プロフィール／一覧。My* UI は撤去 |
 * | コレクション | `base/collection/` | いいね／フォロー |
 * | 管理 | `base/admin/` | `/admin`（データ経路は `lib/admin/README.md`） |
 * | マネタイズ | `base/monetization/` | 純広告枠（SponsorAd） |
 * | 操作UI | `base/ui/` | いいね・フォロー・チップ・アバター・モーダル |
 * | 一覧フォーカス | `base/ListFocusRestore` | 検索↔詳細の戻り／前後ナビ |
 * | シェル | `base/shell/` | Header／Footer／SiteChrome／UsageBeacon／SponsorLogoStrip |
 * | 開発 | `base/dev/` | MockAuthBar・RootProviders（`SHOW_MOCK_DEV_CHROME` 時のみ） |
 * | ルート | `app/(main)/` | `/` `/search` `/c` `/i` `/m` `/likes` `/following` `/compose` `/settings` |
 * | 管理ルート | `app/(admin)/` | `/admin/*` |
 *
 * ## データ方針
 * サーバで絞って返す／詳細は id 1件。
 * 他人プロフィール一覧は公開 API に `user=`。詳細の可視性の正はサーバ。
 * ユーザー検索は `GET /api/public/users`（`q` 空は名簿を返さない）。
 * マイページの閲覧者は Cookie（モック）／spike セッション → `getServerViewerUserId`。
 * サイト側 lib の入口: `lib/README.md`。管理: `lib/admin/README.md`。
 *
 * ## 書き込み
 * 現状の正は `docs/WRITE_PATH.md`（モック＝トーストのみ／spike＝接続／正式棚＝同手続き）。
 *
 * ## 触るならこのファイル（サイト UI）
 * | やりたいこと | ファイル |
 * |--------------|----------|
 * | シェル・PV ビーコン | `shell/SiteChrome.tsx` → `UsageBeacon.tsx` |
 * | 純広告枠 | `monetization/SponsorAd.tsx`（`lib/ad-tracking`） |
 * | 協賛ロゴ帯 | `shell/SponsorLogoStrip.tsx` |
 * | トップ新着／Pick up | `home/HomeFeed.tsx` |
 * | 検索 UI | `SearchView.tsx` ほか `Search*` |
 * | コーデ／アイテム詳細 | `detail/CoordinateDetailView.tsx` / `ItemDetailView.tsx` |
 * | 詳細の読み込み | `detail/load-detail.ts` |
 * | マイページ画面 | `mypage/ProfileView.tsx`（厚い） |
 * | マイページデータ組立 | `mypage/load-mypage.ts` ← `lib/mypage-*` |
 * | 設定（プロフィール／アカウント） | `settings/ProfileSettingsView.tsx`（厚い） |
 * | コーデ／アイテム投稿 | `compose/CoordinateCreateView.tsx` / `ItemCreateView.tsx` |
 * | クロップ | `compose/ImageCropDialog.tsx` + `useComposeCropSession.ts` |
 * | いいね／フォロー一覧 | `collection/*` |
 * | 管理画面 | `admin/*`（別 README） |
 *
 * ## 厚いファイルについて
 * `ProfileSettingsView` / `ProfileView` / compose・detail の一部は提供 UI として厚い。
 * **見た目の再設計や分割のための分割はしない**（契約・提供モデル外）。
 * 挙動を変えるときだけ触り、データは `lib/` 側を先に見る。
 */

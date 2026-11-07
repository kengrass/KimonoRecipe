# 管理画面データ（`lib/admin`）

エンジニアが入れ替わっても迷わないための入口。UI は `src/base/admin/`。

## 環境分岐（ここが一番大事）

`lib/config.ts` の関係:

| 状態 | 条件 | 管理の動き |
|------|------|------------|
| **モック** | `API_BASE_URL` も spike も無し → `USE_MOCK_API` | デモデータ／ブラウザ Storage |
| **spike** | `NEXT_PUBLIC_USE_SPIKE_API=1` 等 → `USE_SPIKE_API` | `/api/admin/*`（証明用 SQLite） |
| **本番相当** | `NEXT_PUBLIC_API_BASE_URL` あり | 同じ `/api/admin/*` 手続きを実 API へ |

管理の「モック以外は API」判定は **`ADMIN_USES_LIVE_API`（`=!USE_MOCK_API`）** に統一する。  
`USE_SPIKE_API` だけ見ると、本番 URL だけ立てたときに広告／協賛が Storage に落ちる。

**画像アップロード**（`spike-media.ts`）:

| 環境 | 挙動 |
|------|------|
| spike | アップロードして URL 置換 |
| モック | blob のまま（デモ） |
| LIVE かつ非 spike | blob が残っていたら保存を拒否（黙って載せない） |

本番アップロード手続きが決まったら `spike-media.ts` に足す。

## 触るならこのファイル

| やりたいこと | ファイル |
|--------------|----------|
| ユーザー／KPI 読み取り（RSC） | `admin-data.ts` → `admin-fetch.ts` |
| ユーザー保存・パスワード | `admin-write.ts` |
| 広告 CRUD・実績・抽選 | `ads-store.ts`（土台: `create-row-store.ts`） |
| 協賛ロゴ CRUD・公開一覧 | `logo-sponsors-store.ts` |
| window Event 同期 | `admin-window-events.ts` |
| 掲載期間判定 | `schedule.ts` |
| 型 | `types.ts` |
| デモ種 | `mock-data.ts` |
| 画面（見た目・操作） | `src/base/admin/*` |
| 見た目トークン | `src/base/admin/admin-form-styles.ts` |
| 一覧 load／購読／persist | `useAdminRowResource.ts` |
| フォーム開閉殻 | `useAdminCrudForm.ts` |

## データ経路（広告／協賛）

```
[管理 AdsManager / LogoSponsorsManager]
  → useAdminRowResource（初回 load → setRows、save 戻り値 → setRows）
  → create-row-store（loadFromApi / save）
  → LIVE: GET/PUT /api/admin/... ＋ メモリキャッシュ
  → モック: localStorage（広告）／sessionStorage（協賛）

[公開 SponsorAd / SponsorLogoStrip]
  → 必要なら store.subscribe（CustomEvent）で再抽選・再表示
```

**管理画面は Event を購読しない**（自分の load／save 結果だけ）。  
Event（`admin-window-events`）は公開側の同一タブ更新用。広告の STATS は実績加算用。

## 画面側の薄い共通

| 部品 | 役割 |
|------|------|
| `useAdminRowResource` | load・persist・削除（購読なし） |
| `useAdminCrudForm` | 下書き／開閉／削除確認 |
| `useAdminPersistRows` | blob アップロード → `save` → 戻り値で setRows |
| `useAdminFlash` + `AdminFlashBanner` | 一時メッセージ（状態と描画を分離） |

## 注意（伸ばすとき）

- ユーザー一覧（`UserListClient`）は現状 **サーバから受け取った配列をクライアントで絞る**。件数増えたらサーバ `q`／ページングを契約どおり足す（全件取得を正にしない）。
- `SponsorMonthlyReport` は型・モック種のみ。管理 UI 未接続。
- 管理は load／save 結果駆動。公開側の subscribe までやめるのは別判断（同一タブでの即時反映が要るため残している）。

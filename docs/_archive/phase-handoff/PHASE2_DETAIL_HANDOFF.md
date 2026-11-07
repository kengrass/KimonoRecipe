# 公開詳細 API — フィールド見本（旧 Phase2）

> **Phase1〜3 の作業段階は廃止。** 既存 Laravel DB への接続指示としては使わない。  
> 本番の正: [`NEW_DB.md`](./NEW_DB.md) ・ [`../spike/docs/API.md`](../spike/docs/API.md) ・ [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md)

**方針:** トップ／検索と同じく **公開APIだけ**。全件一覧を取って詳細を組み立てない。  
Next UI は `src/base/detail/`。

関連: [`API_CONTRACT.md`](./API_CONTRACT.md)、[`LIST_QUERY_ARCHITECTURE.md`](./LIST_QUERY_ARCHITECTURE.md)  
owner・`user=`: [`PHASE3_OWNER_HANDOFF.md`](./PHASE3_OWNER_HANDOFF.md)

---

## エンドポイント

| Method | Path | 用途 |
|--------|------|------|
| `GET` | `/api/public/coordinates/{id}` | 公開コーデ詳細 |
| `GET` | `/api/public/items/{id}` | 公開アイテム詳細 |

- **非公開・下書き等は 404**（存在を漏らす 403 は避ける）
- レスポンス形: `frontend/src/lib/types.ts` の `PublicCoordinateDetail` / `PublicItemDetail`
- 見本: `frontend/src/mocks/api/public/coordinates/FgNzIyU.json` ・ `items/ISSIeSA.json`

### 含めない（Phase3 owner）

`private_note` / `owner_status` / `edit_url` / `view_count` 等は **公開詳細に載せない**。  
所有者向けは `GET /api/owner/...` を別経路で足す。

### 関連一覧

`related_coordinates` / `used_in_coordinates` / `related_items` は **詳細レスポンスに含める**（同ユーザー・公開のみ・目安最大9。当該 ID 除外）。  
フロントが別途全件一覧や search-catalog を引いて埋めない。「もっと見る」はプロフィール（公開 `user=`）。  
所有者の紐づけ候補一覧は詳細同梱ではなく `GET /api/owner/coordinates|items`（マイページ本人一覧と同じ口）。

---

## Next UI

| URL | 実装 |
|-----|------|
| `/c/[id]` | `app/(main)/c/[id]` → `base/detail/CoordinateDetailView` |
| `/i/[id]` | `app/(main)/i/[id]` → `base/detail/ItemDetailView` |

構成（コーデ）: BrowseBar → 画像 → メタ（フォロー・いいね・シェア）→ 構成アイテム → 帯結び等 → タグ → 日時 → スポンサー → 関連  
構成（アイテム）: 同様（利用コーデ・アフィ・関連）

実装は公開データのみで組み立てる（下記「やらないこと」）。

### 意図的にやらないこと（負債を持ち込まない）

- 詳細表示のために **全件** 一覧を取る（前後ナビは neighbor or 検索セッション）
- search-catalog の enrich／推定

### Phase3（Next 接続）

| 経路 | 実装 |
|------|------|
| 本人の詳細 | `GET /api/owner/.../{id}` **フル** → `loadCoordinateDetailPage` / `loadItemDetailPage` |
| 他人・未ログイン | 公開詳細のみ。非公開は 404 |
| 前後ナビ（直リンク） | `getDetailNeighborList` → `/neighbors`（モックは当該ページ分） |

**ルール:** 公開 API に非公開を載せない。本人用は本人以外に渡さない。本人は本人用フル（公開項目と重複可）。

---

## 受け入れ

- [ ] 公開 ID は表示。非公開は所有者以外 404
- [ ] 本人（モック所有者）は非公開詳細も本人用フルで表示
- [ ] 必須欠け・空 `images` は不正
- [ ] `title: ""` は正常（見出しを詰める）
- [ ] 関連はレスポンス内のみ
- [ ] Next ページは `base/detail` のみ
- [ ] 所有者モードで編集・非公開メモ（owner fixture）。My* は契約・UIとも対象外

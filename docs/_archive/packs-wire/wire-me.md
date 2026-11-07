# Pack（参考・廃止）: 会員コレクション（me）

> **廃止:** 既存 DB 接続の作業 pack としては使わない。  
> 正の入口: [`../NEW_DB.md`](../NEW_DB.md) ・ [`../../spike/docs/API.md`](../../spike/docs/API.md) ・ [`./README.md`](./README.md)

## ゴール（フィールド見本）

- `GET /api/me/favorites`
- `GET /api/me/following/posts`

ログイン本人のコレクションのみ。**公開一覧に `scope=favorite|following` を足さない。**

## 読んでよいファイル（この順）

0. [`../API_FOR_ENGINEERS.md`](../API_FOR_ENGINEERS.md)（全体像・初速）  
1. [`../../AGENTS.md`](../../AGENTS.md)  
2. [`../DO_NOT.md`](../DO_NOT.md)  
3. [`../API_CATALOG.md`](../API_CATALOG.md) §2.3  
4. [`../LIST_QUERY_ARCHITECTURE.md`](../LIST_QUERY_ARCHITECTURE.md) §2 会員コレクション  
5. フロント: `frontend/src/lib/api.ts` の `getMeFavoritesPage` / `getMeFollowingPostsPage`  
6. 任意: [`../openapi.yaml`](../openapi.yaml)  
7. 挙動のローカル見本（必須ではない）: [`../../spike/docs/API.md`](../../spike/docs/API.md) の me 節

## 触るな

- Next UI
- 公開 API への scope 追加
- owner / public 一覧の契約変更
- いいね／フォローの **書き込み**（トグル等）をこの pack で発明すること  
  （本番書き込みは後続契約。ローカル見本は spike）

## やること（既存 DB）

1. セッション必須。未ログインは 401（フロントは未ログイン時この API を呼ばない）  
2. クエリ: `kind=coordinates|items` ・ `page` ・ `per_page`（省略時 12）  
3. レスポンスは公開一覧と同型 `{ data: PublicListItem[], meta }`  
4. **favorites:** いいねした投稿。他人の分は公開のみ。**自分の非公開**も一覧に含めてよい（本人だけが見るコレクション）  
5. **following/posts:** フォロー中ユーザーの**公開**投稿のみ  
6. following/posts は「投稿一覧」。フォロー中**ユーザー一覧**はこの pack 外（任意・後続）

## 完了条件

- [ ] `/likes` `/following` が `NEXT_PUBLIC_API_BASE_URL` 切替だけで本番データになる  
- [ ] 未ログインで API を叩いてもフロント画面が壊れない（画面側ゲート）  
- [ ] 公開一覧に scope が復活していない  

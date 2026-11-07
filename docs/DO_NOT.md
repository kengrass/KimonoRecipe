# やってはいけないこと（短文）

契約・提供物を壊す典型。AI にも人間にも同じリストを渡す。

1. **全件取ってから絞る** — 一覧はサーバで条件＋ `page` / `per_page`（既定 12）
2. **公開 API に非公開を混ぜる** — 非公開は 404／一覧に出さない。owner は別口
3. **公開一覧に会員 scope** — `favorite` / `following` は `/api/me/...` のみ
4. **neighbors や詳細組み立てでカタログ全件** — 短い窓／詳細レスポンスに含める
5. **Next UI の独自リデザイン** — `frontend/src/base`・`(main)` は提供物
6. **契約の勝手な変更** — パス・フィールド名・必須を変えない。必要なら提案のみ
7. **書き込み API の勝手な発明** — 手続きの見本は spike（`WRITE_PATH.md` / `spike/docs/API.md`）
8. **モック用可視性マップを本番の正にする** — 本番の公開判定はサーバのみ
9. **タイトル空をバグ扱い** — `title: ""` は正常
10. **本番でモック認証 Cookie に頼る** — API 接続後は無視。`getServerViewerUserId` に実セッションを差し込む（[`OPS_SECURITY.md`](./OPS_SECURITY.md)）
11. **既存スパゲティ DB を新系の正にする** — 新DBは新UI／APIから設計（`NEW_DB.md`）
12. **spike／Supabase を本番扱いする**
13. **本番会員の投稿・プロフィールをモック／シードに取り込む** — 架空データのみ。画像 URL を表示検証で残す場合も本文・名前はダミー

正: [`NEW_DB.md`](./NEW_DB.md) ・ [`DELIVERY_MODEL.md`](./DELIVERY_MODEL.md) ・ [`AGENTS.md`](../AGENTS.md)

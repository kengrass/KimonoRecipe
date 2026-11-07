/**
 * 本番公開コンテンツの取り込みは廃止しました（実在会員データの混入防止）。
 * ローカル検証は `npm run db:seed` の架空デモユーザーのみを使ってください。
 */
console.error(
  "[disabled] db:seed-real: 本番コンテンツの取り込みは禁止です。",
);
process.exit(1);

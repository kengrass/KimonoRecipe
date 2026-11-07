/**
 * 本番公開プロフィール寄せの再シードは廃止しました（実在会員データの混入防止）。
 */
console.error(
  "[disabled] reseed-mock-users.mjs: 本番寄せシードは禁止です。",
);
process.exit(1);

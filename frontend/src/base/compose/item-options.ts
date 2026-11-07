/** アイテム編集モック用の選択肢 */

export const ITEM_CATEGORIES = [
  "袷",
  "単衣",
  "薄物",
  "浴衣",
  "袋帯",
  "名古屋帯",
  "半幅帯",
  "兵児帯",
  "角帯",
  "その他帯",
  "帯揚",
  "帯締",
  "帯留",
  "アウター",
  "羽織",
  "羽織紐",
  "袴",
  "半襟",
  "襦袢",
  "下着類",
  "足袋",
  "履物",
  "髪飾",
  "根付",
  "アクセサリー",
  "帽子",
  "バッグ",
  "反物",
  "その他",
  "断捨離済",
] as const;

export const WESTERN_CATEGORIES = [
  "洋)トップス",
  "洋)ボトムス",
  "洋)アウター",
  "洋)靴",
  "洋)その他",
] as const;

export function toChipOptions<T extends string>(ids: readonly T[]) {
  return ids.map((id) => ({ id, label: id }));
}

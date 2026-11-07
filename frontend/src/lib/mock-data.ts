import { CDN_ORIGIN, LARAVEL_ORIGIN } from "./config";
import type {
  ContentGender,
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
  PublicUser,
} from "./types";

function defaultGender(user: PublicUser, tags: string[]): ContentGender {
  const blob = [...tags, user.name].join(" ");
  if (user.id === "mckDemo" || user.id === "mckBrandA" || /男|角帯|モック/.test(blob)) return "men";
  if (/キッズ|子供/.test(blob)) return "kids";
  return "women";
}

function ensureCoordListItem(
  item: Omit<PublicListItem, "gender" | "obi_knot" | "category" | "seasons"> &
    Partial<PublicListItem>,
): PublicListItem {
  const tags = item.tags ?? [];
  const title = item.title ?? "";
  return {
    ...item,
    title,
    tags,
    seasons:
      item.seasons ??
      (["春", "夏", "秋", "冬"] as const).filter(
        (s) => title.includes(s) || tags.includes(s),
      ),
    gender: item.gender ?? defaultGender(item.user, tags),
    obi_knot: item.obi_knot ?? "貝の口",
  };
}

function ensureItemListItem(
  item: Omit<PublicListItem, "gender" | "obi_knot" | "category" | "seasons"> &
    Partial<PublicListItem>,
): PublicListItem {
  const tags = item.tags ?? [];
  const title = item.title ?? "";
  return {
    ...item,
    title,
    tags,
    seasons:
      item.seasons ??
      (["春", "夏", "秋", "冬"] as const).filter(
        (s) => title.includes(s) || tags.includes(s),
      ),
    gender: item.gender ?? defaultGender(item.user, tags),
    category: item.category ?? tags[0] ?? "その他",
  };
}
import {
  REAL_COORDINATE_LIST_PATCHES,
  REAL_ITEM_LIST_PATCHES,
  REAL_COORDINATE_IDS,
  REAL_ITEM_IDS,
} from "./mock-api-fixtures";

const img = (path: string) => `${CDN_ORIGIN}${path}`;

export const MOCK_OWNER_USER: PublicUser = {
  id: "mckDemo",
  name: "デモ花子",
  profile_url: "/m/mckDemo",
};

export const MOCK_OTHER_USER: PublicUser = {
  id: "mckTaro",
  name: "デモ太郎",
  profile_url: "/m/mckTaro",
};

/** モック用・他者投稿者（ID mckMidori。デモ花子／運営とは別人） */
export const MOCK_DEMO_MIDORI_USER: PublicUser = {
  id: "mckMidori",
  name: "デモみどり",
  profile_url: "/m/mckMidori",
};


/** モックカタログ用ブランド風ユーザー（架空名） */
export const MOCK_BRAND_A_USER: PublicUser = {
  id: "mckBrandA",
  name: "デモブランドA",
  profile_url: "/m/mckBrandA",
};

export const MOCK_BRAND_B_USER: PublicUser = {
  id: "mckBrandB",
  name: "デモブランドB",
  profile_url: "/m/mckBrandB",
};

/** 「ログイン・他者」モード時の自分（投稿者ではない会員） */
export const MOCK_MEMBER_USER: PublicUser = {
  id: "mckViewer",
  name: "閲覧会員",
  profile_url: "/m/mckViewer",
};

/** GET /api/public/coordinates 相当 */
const BASE_COORDINATE_LIST: Omit<
  PublicListItem,
  "gender" | "obi_knot" | "category" | "seasons"
>[] = [
  {
    id: "mckX046",
    title: "モックコーデ",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T15:45:00+09:00",
    tags: ["モック", "モック", "モック", "モック", "モック", "モック", "モック"],
    detail_url: "/c/mckX046",
  },
  {
    id: "mckX110",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/f46b9c5bf24fd969751e2a8b50302c44860a96c3.jpeg?20220211222557",
    user: MOCK_OWNER_USER,
    posted_at: "2022-02-11T22:25:00+09:00",
    tags: [],
    detail_url: "/c/mckX110",
  },
  {
    id: "mckX089",
    title: "モックコーデ",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/2dfadeb1456ff7b0644c22f408f6e683ae2f86d8.jpeg?20260929235843",
    user: MOCK_OTHER_USER,
    posted_at: "2026-09-29T23:58:00+09:00",
    tags: [],
    detail_url: "/c/mckX089",
  },
  {
    id: "mckX017",
    title: "モックコーデ",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/6f3b5b1917d0466b8ae98acde60a739c53782817.jpeg?20260923225014",
    user: MOCK_OTHER_USER,
    posted_at: "2026-09-23T22:50:00+09:00",
    tags: [],
    detail_url: "/c/mckX017",
  },
  {
    id: "mckX068",
    title: "モックコーデA",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/802b03230ba8cc6a6517d3edd9d769bf1e1303c0.JPG?20260929231129",
    user: MOCK_DEMO_MIDORI_USER,
    posted_at: "2026-09-29T23:11:00+09:00",
    tags: ["モック", "単衣"],
    detail_url: "/c/mckX068",
  },
  {
    id: "mckX122",
    title: "モックコーデB",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/6e41377a0af61c48521490629a1d8dce30fb5c7e.JPG?20260928235457",
    user: MOCK_DEMO_MIDORI_USER,
    posted_at: "2026-09-28T23:54:00+09:00",
    tags: ["モック"],
    detail_url: "/c/mckX122",
  },
  {
    id: "mckX136",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/cfcce0e4f3606a999958cd113da9f77ec230d726.jpg?20240307134604",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-06T21:34:00+09:00",
    tags: ["モック","ブランド"],
    detail_url: "/c/mckX136",
  },
  {
    id: "mckX053",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/e8f499b7d1bd42948163dbb71f99ea7b73c6acfc.jpg?20240307132634",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-06T21:34:00+09:00",
    tags: ["モック","ブランド"],
    detail_url: "/c/mckX053",
  },
  {
    id: "mckX003",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/0cc5059ff332537e23782a5d205045f7dfba197d.jpg?20240307132227",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-06T21:34:00+09:00",
    tags: ["モック","ブランド"],
    detail_url: "/c/mckX003",
  },
  {
    id: "mckX124",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/6068486203d357cccd1b668fff244b375fec2ff4.jpg?20240621142031",
    user: MOCK_BRAND_B_USER,
    posted_at: "2024-06-21T14:20:00+09:00",
    tags: [],
    detail_url: "/c/mckX124",
  },
  {
    id: "mckX066",
    title: "",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/36500eb8ae700cbc9a4ed0017431e3711542991d.jpg?20240621141842",
    user: MOCK_BRAND_B_USER,
    posted_at: "2024-06-21T14:18:00+09:00",
    tags: [],
    detail_url: "/c/mckX066",
  },
  {
    id: "mckX020",
    title: "モックコーデ",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/0fa65e732586e289e29546e720ed06f58461e31f.jpg?20240404011641",
    user: MOCK_BRAND_B_USER,
    posted_at: "2023-08-24T11:01:00+09:00",
    tags: ["モック", "ブランド"],
    detail_url: "/c/mckX020",
  },
];

/** 検索ページネーション確認用（BASE + EXTRA）。
 * 画像と user は必ず同じ投稿者のまま（マイページで他人写真が混ざらないように）。
 */
const EXTRA_COORDINATE_LIST: typeof BASE_COORDINATE_LIST = Array.from(
  { length: 15 },
  (_, i) => {
    const n = i + 1;
    const src = BASE_COORDINATE_LIST[i % BASE_COORDINATE_LIST.length];
    const id = `PgC${String(n).padStart(2, "0")}`;
    const day = String(23 - (i % 10)).padStart(2, "0");
    const hour = String(10 + (i % 8)).padStart(2, "0");
    return {
      id,
      title: `ページ送り確認コーデ ${n}`,
      image_url: src.image_url,
      user: src.user,
      posted_at: `2026-08-${day}T${hour}:00:00+09:00`,
      tags: [["春"], ["夏"], ["秋"], ["冬"], ["浴衣"]][i % 5] as string[],
      detail_url: `/c/${id}`,
    };
  },
);

export const MOCK_COORDINATE_LIST: PublicListItem[] = [
  ...BASE_COORDINATE_LIST,
  ...EXTRA_COORDINATE_LIST,
].map((item) =>
  ensureCoordListItem(REAL_COORDINATE_LIST_PATCHES[item.id] ?? item),
);

/** GET /api/public/items 相当 */
const BASE_ITEM_LIST: Omit<
  PublicListItem,
  "gender" | "obi_knot" | "category" | "seasons"
>[] = [
  {
    id: "mckX070",
    title: "モック単衣",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T16:04:00+09:00",
    tags: [],
    detail_url: "/i/mckX070",
  },
  {
    id: "mckX088",
    title: "モック浴衣",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/4fdf8bba4d3b6b8803d5c1b30d9344fd380b584c.jpeg?20240531133458",
    user: MOCK_OWNER_USER,
    posted_at: "2024-05-31T13:13:00+09:00",
    tags: ["浴衣"],
    detail_url: "/i/mckX088",
  },
  {
    id: "mckX178",
    title: "mckX178",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/4be74bc425a388a86b75b4d3a5933500d31d98d8.jpeg?20240412120502",
    user: MOCK_OWNER_USER,
    posted_at: "2024-04-12T12:05:00+09:00",
    tags: ["襦袢"],
    detail_url: "/i/mckX178",
  },
  {
    id: "mckX106",
    title: "モック帯揚",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/247aa17a19d5e2b41e039e29e2699784b3295974.jpeg?20251204210610",
    user: MOCK_OTHER_USER,
    posted_at: "2025-12-04T21:06:00+09:00",
    tags: ["帯揚"],
    detail_url: "/i/mckX106",
  },
  {
    id: "mckX095",
    title: "モック帯締A",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/9d8fd3696348082a121375d7aba85f99b723f100.jpg?20260919011507",
    user: MOCK_DEMO_MIDORI_USER,
    posted_at: "2026-09-19T01:15:00+09:00",
    tags: ["モック", "帯締"],
    detail_url: "/i/mckX095",
  },
  {
    id: "mckX189",
    title: "モック帯締B",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/81bb8198e18863c9a7b9323548f810e886175429.jpg?20260919011133",
    user: MOCK_DEMO_MIDORI_USER,
    posted_at: "2026-09-19T01:11:00+09:00",
    tags: ["モック", "帯締"],
    detail_url: "/i/mckX189",
  },
  {
    id: "mckX148",
    title: "モックアイテムA",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/3bbf8596d6cc02e06619f520fceb021a9b0dae17.jpg?20240306212829",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-04T20:22:00+09:00",
    tags: ["モック"],
    detail_url: "/i/mckX148",
  },
  {
    id: "mckX190",
    title: "モックアイテムB",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/91fd69b1709f26562587c7dc566d936d72046d92.jpg?20240306212343",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-04T20:22:00+09:00",
    tags: ["モック"],
    detail_url: "/i/mckX190",
  },
  {
    id: "mckX099",
    title: "モックアイテムC",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/7667948b37fb343bc779f79893711c520d1d9b65.jpg?20240306211848",
    user: MOCK_BRAND_A_USER,
    posted_at: "2024-03-04T20:22:00+09:00",
    tags: ["モック"],
    detail_url: "/i/mckX099",
  },
  {
    id: "mckX109",
    title: "モック草履",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/b007a1f7743adb659fcd4093c58477707dc07e96.jpg?20240904172149",
    user: MOCK_BRAND_B_USER,
    posted_at: "2024-09-04T17:21:00+09:00",
    tags: ["モック", "モック"],
    detail_url: "/i/mckX109",
  },
  {
    id: "mckX055",
    title: "モック仮紐",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/a183af2527bd517851232056666308c5337d5a1f.jpg?20240904165957",
    user: MOCK_BRAND_B_USER,
    posted_at: "2024-09-04T16:59:00+09:00",
    tags: ["モック", "ブランド"],
    detail_url: "/i/mckX055",
  },
  {
    id: "mckX047",
    title: "モック帯留",
    image_url: "https://d2z0ysf6sthedw.cloudfront.net/_b/created/square/2693f4704ab3acba4a5789916c814a9507e7855d.jpg?20240904164616",
    user: MOCK_BRAND_B_USER,
    posted_at: "2024-09-04T16:46:00+09:00",
    tags: ["モック", "ブランド"],
    detail_url: "/i/mckX047",
  },
];

/** 検索ページネーション確認用（BASE + EXTRA）。
 * 画像と user は必ず同じ投稿者のまま（マイページで他人写真が混ざらないように）。
 */
const EXTRA_ITEM_LIST: typeof BASE_ITEM_LIST = Array.from(
  { length: 15 },
  (_, i) => {
    const n = i + 1;
    const src = BASE_ITEM_LIST[i % BASE_ITEM_LIST.length];
    const id = `PgI${String(n).padStart(2, "0")}`;
    const day = String(23 - (i % 10)).padStart(2, "0");
    const hour = String(10 + (i % 8)).padStart(2, "0");
    return {
      id,
      title: `ページ送り確認アイテム ${n}`,
      image_url: src.image_url,
      user: src.user,
      posted_at: `2026-08-${day}T${hour}:15:00+09:00`,
      tags: [["単衣"], ["帯"], ["小物"], ["履物"], ["羽織"]][i % 5] as string[],
      detail_url: `/i/${id}`,
    };
  },
);

export const MOCK_ITEM_LIST: PublicListItem[] = [
  ...BASE_ITEM_LIST,
  ...EXTRA_ITEM_LIST,
].map((item) =>
  ensureItemListItem(REAL_ITEM_LIST_PATCHES[item.id] ?? item),
);

export const MOCK_COORDINATE_DETAIL: PublicCoordinateDetail = {
  id: "mckX046",
  title: "モックコーデ",
  description: "モック用の説明です。",
  images: [
    img(
      "/_b/created/square_l/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
    ),
    img(
      "/_b/created/square_l/411552e8c0f92c7d77006070dd2d261e41ee43ea.jpeg?20211113181517",
    ),
    img(
      "/_b/created/square_l/6a42524519a74060b8086ee8576eb483d47acf5e.jpeg?20211113171938",
    ),
    img(
      "/_b/created/square_l/1eb3a7b32512895cb23c787e98e3db8f64486962.jpeg?20211113180005",
    ),
    img(
      "/_b/created/square_l/2ab2613b30cde4ba4ad833fa51656bb821f2a53a.jpeg?20211113171937",
    ),
  ],
  user: MOCK_OWNER_USER,
  posted_at: "2016-04-29T15:45:00+09:00",
  tags: [
    "モック",
    "モック",
    "モック",
    "モック",
    "モック",
    "モック",
    "モック",
  ],
  obi_knot: "貝の口",
  like_count: 3,
  gender: "men",
  items: [
    {
      id: "mckX070",
      title: "モック単衣",
      category: "単衣",
      image_url: img(
        "/_b/created/square/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
      ),
      detail_url: "/i/mckX070",
    },
    {
      id: "mckX044",
      title: "モック角帯",
      category: "角帯",
      image_url: img(
        "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
      ),
      detail_url: "/i/mckX044",
    },
    {
      id: "mckX098",
      title: "モックの羽織",
      category: "羽織",
      image_url: img(
        "/_b/created/square/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
      ),
      detail_url: "/i/mckX098",
    },
    {
      id: "mckX052",
      title: "モック羽織紐",
      category: "羽織紐",
      image_url: img(
        "/_b/created/square/414921386904708febe67a87d71f099c98343860.jpeg?20211113180005",
      ),
      detail_url: "/i/mckX052",
    },
    {
      id: "mckX025",
      title: "モック襦袢",
      category: "襦袢",
      image_url: img(
        "/_b/created/square/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
      ),
      detail_url: "/i/mckX025",
    },
    {
      id: "mckX067",
      title: "モック足袋",
      category: "足袋",
      image_url: img(
        "/_b/created/square/a9c9e5cd0ea93bcf2473f7ab23684983e31621f8.jpeg?20211113180005",
      ),
      detail_url: "/i/mckX067",
    },
    {
      id: "mckX076",
      title: "モックの草履",
      category: "履物",
      image_url: img(
        "/_b/created/square/f7948bcc113937d619aefde4674d789ce16c40e4.jpeg?20211113180011",
      ),
      detail_url: "/i/mckX076",
    },
    {
      id: "mckX139",
      title: "モック帽子",
      category: "帽子",
      image_url: img(
        "/_b/created/square/e724d7bca495d2c55aa0136f78e3989a1d179f62.jpeg?20211113180008",
      ),
      detail_url: "/i/mckX139",
    },
  ],
  related_coordinates: [
    {
      id: "mckX102",
      title: "モックコーデ",
      image_url: img(
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-01-10T22:23:32+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX102",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX083",
      title: "関連コーデ 2",
      image_url: img(
        "/_b/created/square/f6c771590f05917df11f0db3ddeef48bfb931bca.jpeg?20220104113052",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-01-04T11:30:52+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX083",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX171",
      title: "関連コーデ 3",
      image_url: img(
        "/_b/created/square/100839581bc8c7b8c7e42d64fefb8a96c28a84ef.jpeg?20240327230939",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2024-03-27T23:09:39+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX171",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX018",
      title: "関連コーデ 4",
      image_url: img(
        "/_b/created/square/f7536c3a7643e38efb8faf9f5d274a3438853324.jpeg?20220123193328",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-01-23T19:33:28+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX018",
    gender: "men",
    obi_knot: "貝の口",
    },
  ],
  og: {
    title: "モックコーデ",
    description: "モック用の説明です。",
    image_url: img(
      "/_b/created/square_l/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
    ),
  },
};

export const MOCK_ITEM_DETAIL: PublicItemDetail = {
  id: "mckX070",
  title: "モック単衣",
  description: "",
  category: "単衣",
  images: [
    img(
      "/_b/created/square_l/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
    ),
    img(
      "/_b/created/square_l/bb5534affc00e3c961cb74993a565cfc462e62b7.jpeg?20211113171936",
    ),
    img(
      "/_b/created/square_l/486d086651c988a8a758d7b9cf97abc09dea574a.jpeg?20211113180004",
    ),
    img(
      "/_b/created/square_l/525cb57286ad89aabd22fb1e1800dd4ea36c819f.jpeg?20211113180006",
    ),
  ],
  user: MOCK_OWNER_USER,
  posted_at: "2016-04-29T16:04:00+09:00",
  tags: [],
  like_count: 0,
  gender: "men",
  used_in_coordinates: [
    {
      id: "mckX046",
      title: "モックコーデ",
      image_url: img(
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2016-04-29T15:45:00+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX046",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX024",
      title: "モックコーデC",
      image_url: img(
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2016-04-29T21:22:41+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX024",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX120",
      title: "利用コーデ 3",
      image_url: img(
        "/_b/created/square/c5762aa4a933c073908e7ce8e55707e71c8ddf4c.jpeg?20220111105328",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-01-11T10:53:28+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX120",
    gender: "men",
    obi_knot: "貝の口",
    },
    {
      id: "mckX173",
      title: "利用コーデ 4",
      image_url: img(
        "/_b/created/square/8e24aa4190132dc274d481f4d569b3fb2d403347.jpeg?20220110000719",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-01-10T00:07:19+09:00",
      tags: [],
      seasons: [],
      detail_url: "/c/mckX173",
    gender: "men",
    obi_knot: "貝の口",
    },
  ],
  related_items: [
    {
      id: "mckX010",
      title: "関連アイテム 1",
      image_url: img(
        "/_b/created/square/b96f0998f3f457202bee856437b1fe5b32990acd.jpeg?20211113183123",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2016-04-29T18:31:23+09:00",
      tags: [],
      seasons: [],
      detail_url: "/i/mckX010",
    gender: "men",
    category: "単衣",
    },
    {
      id: "mckX063",
      title: "関連アイテム 2",
      image_url: img(
        "/_b/created/square/bb592ad06f8fde2de787b624eeca7d91ed781798.jpeg?20211113180006",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2016-04-29T18:00:06+09:00",
      tags: [],
      seasons: [],
      detail_url: "/i/mckX063",
    gender: "men",
    category: "単衣",
    },
    {
      id: "mckX166",
      title: "関連アイテム 3",
      image_url: img(
        "/_b/created/square/b4d87e77bf76ac1944e59fe00d97f830b5dca834.jpeg?20240318172155",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2024-03-18T17:21:55+09:00",
      tags: [],
      seasons: [],
      detail_url: "/i/mckX166",
    gender: "men",
    category: "単衣",
    },
    {
      id: "mckX045",
      title: "関連アイテム 4",
      image_url: img(
        "/_b/created/square/e2ed3c779e0a12c2b4bb9f3d84f7c6f09b707db1.jpeg?20221102150442",
      ),
      user: MOCK_OWNER_USER,
      posted_at: "2022-11-02T15:04:42+09:00",
      tags: [],
      seasons: [],
      detail_url: "/i/mckX045",
    gender: "men",
    category: "単衣",
    },
  ],
  og: {
    title: "モック単衣 | きものレシピ",
    description: "単衣",
    image_url: img(
      "/_b/created/square_l/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
    ),
  },
};

/** 詳細モックが揃っている ID（それ以外は一覧から簡易生成） */
export const DETAILED_COORDINATE_IDS = new Set([
  "mckX046",
  "mckX024",
  "mckX102",
  ...REAL_COORDINATE_IDS,
]);
export const DETAILED_ITEM_IDS = new Set([
  "mckX070",
  "mckX044",
  "mckX098",
  "mckX025",
  ...REAL_ITEM_IDS,
]);

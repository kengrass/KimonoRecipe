/**
 * コーデ↔アイテムの複数経路テスト用モック。
 * mckX046 / mckX070 を中心に mckX024, mckX102, mckX044 等が相互リンクする。
 */
import { CDN_ORIGIN } from "./config";
import { MOCK_OWNER_USER } from "./mock-data";
import type {
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
} from "./types";

const img = (path: string) => `${CDN_ORIGIN}${path}`;

const listC = (
  id: string,
  title: string,
  square: string,
  posted_at: string,
  tags: string[] = [],
  obi_knot = "貝の口",
): PublicListItem => ({
  id,
  title,
  image_url: img(square),
  user: MOCK_OWNER_USER,
  posted_at,
  tags,
  seasons: (["春", "夏", "秋", "冬"] as const).filter(
    (s) => title.includes(s) || tags.includes(s),
  ),
  detail_url: `/c/${id}`,
  gender: "men",
  obi_knot,
});

const listI = (
  id: string,
  title: string,
  square: string,
  posted_at: string,
  tags: string[] = [],
  category = "その他",
): PublicListItem => ({
  id,
  title,
  image_url: img(square),
  user: MOCK_OWNER_USER,
  posted_at,
  tags,
  seasons: (["春", "夏", "秋", "冬"] as const).filter(
    (s) => title.includes(s) || tags.includes(s),
  ),
  detail_url: `/i/${id}`,
  gender: "men",
  category,
});

/** mckX046 以外のフル詳細コーデ */
export const GRAPH_COORDINATE_DETAILS: Record<string, PublicCoordinateDetail> = {
  mckX024: {
    id: "mckX024",
    title: "モックコーデC",
    description: "モック用の説明です。グラフリンク確認用。",
    images: [
      img(
        "/_b/created/square_l/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T21:22:41+09:00",
    tags: ["モック", "モック", "イベント"],
    like_count: 1,
    gender: "men",
    obi_knot: "貝の口",
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
    ],
    related_coordinates: [
      listC(
        "mckX046",
        "モックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
        ["モック"],
      ),
      listC(
        "mckX102",
        "モックコーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    og: {
      title: "モックコーデC | きものレシピ",
      description: "モック用の説明です。",
      image_url: img(
        "/_b/created/square_l/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
      ),
    },
  },
  mckX102: {
    id: "mckX102",
    title: "モックコーデ",
    description: "モック用の説明です。リンク確認用。",
    images: [
      img(
        "/_b/created/square_l/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2022-01-10T22:23:32+09:00",
    tags: ["下町", "散策"],
    like_count: 0,
    gender: "men",
    obi_knot: "貝の口",
    items: [
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
    ],
    related_coordinates: [
      listC(
        "mckX046",
        "モックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "mckX024",
        "モックコーデC",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
    ],
    og: {
      title: "モックコーデ | きものレシピ",
      description: "モック用の説明です。",
      image_url: img(
        "/_b/created/square_l/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
      ),
    },
  },
};

/** mckX070 以外のフル詳細アイテム */
export const GRAPH_ITEM_DETAILS: Record<string, PublicItemDetail> = {
  mckX044: {
    id: "mckX044",
    title: "モック角帯",
    description: "モックコーデ",
    category: "角帯",
    images: [
      img(
        "/_b/created/square_l/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T17:30:00+09:00",
    tags: ["角帯", "白"],
    like_count: 0,
    gender: "men",
    used_in_coordinates: [
      listC(
        "mckX046",
        "モックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "mckX024",
        "モックコーデC",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
      listC(
        "mckX102",
        "モックコーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    related_items: [
      listI(
        "mckX098",
        "モックの羽織",
        "/_b/created/square/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
        "2016-04-29T17:20:00+09:00",
        ["羽織"],
      ),
      listI(
        "mckX025",
        "モック襦袢",
        "/_b/created/square/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
        "2016-04-29T17:15:00+09:00",
        ["襦袢"],
      ),
    ],
    og: {
      title: "モック角帯 | きものレシピ",
      description: "角帯",
      image_url: img(
        "/_b/created/square_l/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
      ),
    },
  },
  mckX098: {
    id: "mckX098",
    title: "モックの羽織",
    description: "モック用の説明です。",
    category: "羽織",
    images: [
      img(
        "/_b/created/square_l/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T17:20:00+09:00",
    tags: ["羽織", "モック"],
    like_count: 0,
    gender: "men",
    used_in_coordinates: [
      listC(
        "mckX046",
        "モックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "mckX024",
        "モックコーデC",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
    ],
    related_items: [
      listI(
        "mckX044",
        "モック角帯",
        "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        "2016-04-29T17:30:00+09:00",
        ["角帯"],
      ),
    ],
    og: {
      title: "モックの羽織 | きものレシピ",
      description: "羽織",
      image_url: img(
        "/_b/created/square_l/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
      ),
    },
  },
  mckX025: {
    id: "mckX025",
    title: "モック襦袢",
    description: "モック用の説明です。",
    category: "襦袢",
    images: [
      img(
        "/_b/created/square_l/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T17:15:00+09:00",
    tags: ["襦袢"],
    like_count: 0,
    gender: "men",
    used_in_coordinates: [
      listC(
        "mckX046",
        "モックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "mckX102",
        "モックコーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    related_items: [
      listI(
        "mckX044",
        "モック角帯",
        "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        "2016-04-29T17:30:00+09:00",
        ["角帯"],
      ),
    ],
    og: {
      title: "モック襦袢 | きものレシピ",
      description: "襦袢",
      image_url: img(
        "/_b/created/square_l/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
      ),
    },
  },
};

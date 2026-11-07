/**
 * コーデ↔アイテムの複数経路テスト用モック。
 * FgNzIyU / ISSIeSA を中心に F1hWWVg, MDaAcGQ, FYdjFwI 等が相互リンクする。
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

/** FgNzIyU 以外のフル詳細コーデ */
export const GRAPH_COORDINATE_DETAILS: Record<string, PublicCoordinateDetail> = {
  F1hWWVg: {
    id: "F1hWWVg",
    title: "着物を学びに日本橋へ",
    description: "日本橋の着物教室イベント。同じ着物で別アイテム構成。",
    images: [
      img(
        "/_b/created/square_l/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T21:22:41+09:00",
    tags: ["日本橋", "男の着物", "イベント"],
    like_count: 1,
    gender: "men",
    obi_knot: "貝の口",
    items: [
      {
        id: "ISSIeSA",
        title: "シルクウール着物 横段ブルーグレー",
        category: "単衣",
        image_url: img(
          "/_b/created/square/ebba13f09fcba93f0ec2813a1e139a51d50c3562.jpeg?20211113171938",
        ),
        detail_url: "/i/ISSIeSA",
      },
      {
        id: "FYdjFwI",
        title: "白の角帯",
        category: "角帯",
        image_url: img(
          "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        ),
        detail_url: "/i/FYdjFwI",
      },
      {
        id: "KXFRACU",
        title: "アッパースの羽織",
        category: "羽織",
        image_url: img(
          "/_b/created/square/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
        ),
        detail_url: "/i/KXFRACU",
      },
    ],
    related_coordinates: [
      listC(
        "FgNzIyU",
        "ルミロックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
        ["ルミロック"],
      ),
      listC(
        "MDaAcGQ",
        "下町散策コーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    og: {
      title: "着物を学びに日本橋へ | きものレシピ",
      description: "日本橋の着物教室イベント",
      image_url: img(
        "/_b/created/square_l/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
      ),
    },
  },
  MDaAcGQ: {
    id: "MDaAcGQ",
    title: "下町散策コーデ",
    description: "角帯と襦袢を替えたカジュアル版。FYdjFwI ↔ F2gVBpE の行き来テスト用。",
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
        id: "FYdjFwI",
        title: "白の角帯",
        category: "角帯",
        image_url: img(
          "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        ),
        detail_url: "/i/FYdjFwI",
      },
      {
        id: "F2gVBpE",
        title: "襦袢",
        category: "襦袢",
        image_url: img(
          "/_b/created/square/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
        ),
        detail_url: "/i/F2gVBpE",
      },
      {
        id: "IFRWiTU",
        title: "足袋",
        category: "足袋",
        image_url: img(
          "/_b/created/square/a9c9e5cd0ea93bcf2473f7ab23684983e31621f8.jpeg?20211113180005",
        ),
        detail_url: "/i/IFRWiTU",
      },
    ],
    related_coordinates: [
      listC(
        "FgNzIyU",
        "ルミロックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "F1hWWVg",
        "着物を学びに日本橋へ",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
    ],
    og: {
      title: "下町散策コーデ | きものレシピ",
      description: "角帯と襦袢を替えたカジュアル版",
      image_url: img(
        "/_b/created/square_l/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
      ),
    },
  },
};

/** ISSIeSA 以外のフル詳細アイテム */
export const GRAPH_ITEM_DETAILS: Record<string, PublicItemDetail> = {
  FYdjFwI: {
    id: "FYdjFwI",
    title: "白の角帯",
    description: "ルミロックコーデでも使用。複数コーデにまたがるアイテム。",
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
        "FgNzIyU",
        "ルミロックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "F1hWWVg",
        "着物を学びに日本橋へ",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
      listC(
        "MDaAcGQ",
        "下町散策コーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    related_items: [
      listI(
        "KXFRACU",
        "アッパースの羽織",
        "/_b/created/square/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
        "2016-04-29T17:20:00+09:00",
        ["羽織"],
      ),
      listI(
        "F2gVBpE",
        "襦袢",
        "/_b/created/square/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
        "2016-04-29T17:15:00+09:00",
        ["襦袢"],
      ),
    ],
    og: {
      title: "白の角帯 | きものレシピ",
      description: "角帯",
      image_url: img(
        "/_b/created/square_l/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
      ),
    },
  },
  KXFRACU: {
    id: "KXFRACU",
    title: "アッパースの羽織",
    description: "アッパース製の羽織。ルミロック・日本橋コーデで使用。",
    category: "羽織",
    images: [
      img(
        "/_b/created/square_l/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
      ),
    ],
    user: MOCK_OWNER_USER,
    posted_at: "2016-04-29T17:20:00+09:00",
    tags: ["羽織", "アッパース"],
    like_count: 0,
    gender: "men",
    used_in_coordinates: [
      listC(
        "FgNzIyU",
        "ルミロックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "F1hWWVg",
        "着物を学びに日本橋へ",
        "/_b/created/square/c53202487f351bb6b2d52916bf59b4f0e3e767e6.jpeg?20211113212241",
        "2016-04-29T21:22:41+09:00",
      ),
    ],
    related_items: [
      listI(
        "FYdjFwI",
        "白の角帯",
        "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        "2016-04-29T17:30:00+09:00",
        ["角帯"],
      ),
    ],
    og: {
      title: "アッパースの羽織 | きものレシピ",
      description: "羽織",
      image_url: img(
        "/_b/created/square_l/f2d5add237bf3bfdfe83039968c1a5eef88ca55f.jpeg?20211113171937",
      ),
    },
  },
  F2gVBpE: {
    id: "F2gVBpE",
    title: "襦袢",
    description: "ルミロック・下町散策コーデで使用。",
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
        "FgNzIyU",
        "ルミロックコーデ",
        "/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453",
        "2016-04-29T15:45:00+09:00",
      ),
      listC(
        "MDaAcGQ",
        "下町散策コーデ",
        "/_b/created/square/961a387b3803a6e3c23ce4c45b5ac6e6a87f66e5.jpeg?20220110222332",
        "2022-01-10T22:23:32+09:00",
      ),
    ],
    related_items: [
      listI(
        "FYdjFwI",
        "白の角帯",
        "/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007",
        "2016-04-29T17:30:00+09:00",
        ["角帯"],
      ),
    ],
    og: {
      title: "襦袢 | きものレシピ",
      description: "襦袢",
      image_url: img(
        "/_b/created/square_l/d395c2b035dbe0f735b87687bdb81be7768f9a3b.jpeg?20211113171936",
      ),
    },
  },
};

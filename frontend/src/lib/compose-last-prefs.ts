import type { ComposeVisibility } from "@/lib/compose-edit-load";
import type { ContentGender } from "@/lib/types";

export type ComposeLastPrefs = {
  gender: ContentGender;
  visibility: ComposeVisibility;
};

const DEFAULTS: ComposeLastPrefs = {
  gender: "women",
  visibility: "public",
};

const KEYS = {
  coordinate: "kr-compose-coord-prefs",
  item: "kr-compose-item-prefs",
} as const;

function read(key: string): ComposeLastPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ComposeLastPrefs>;
    const gender =
      parsed.gender === "women" ||
      parsed.gender === "men" ||
      parsed.gender === "kids"
        ? parsed.gender
        : DEFAULTS.gender;
    const visibility =
      parsed.visibility === "public" ||
      parsed.visibility === "private" ||
      parsed.visibility === "limited"
        ? parsed.visibility
        : DEFAULTS.visibility;
    return { gender, visibility };
  } catch {
    return DEFAULTS;
  }
}

function write(key: string, prefs: ComposeLastPrefs) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(prefs));
}

/** コーデ／アイテムそれぞれの前回登録の対象・公開範囲 */
export function readComposeLastPrefs(
  kind: "coordinate" | "item",
): ComposeLastPrefs {
  return read(KEYS[kind]);
}

export function writeComposeLastPrefs(
  kind: "coordinate" | "item",
  prefs: ComposeLastPrefs,
) {
  write(KEYS[kind], prefs);
}

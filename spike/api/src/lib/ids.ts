import { randomBytes } from "node:crypto";

/** 短い公開 ID（既存モック風） */
export function newPublicId(len = 7): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

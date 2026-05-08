import { createHash } from "crypto";

const SALT = process.env.OWNER_SALT || "maple-letters-v1";

export function hashPassword(plain: string): string {
  return createHash("sha256").update(`${SALT}::${plain}`).digest("hex");
}

export function verifyPassword(plain: string | null | undefined, expectedHash: string | null | undefined): boolean {
  if (!plain || !expectedHash) return false;
  return hashPassword(plain) === expectedHash;
}

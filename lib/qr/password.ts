// server-only by construction: the `node:crypto` import below cannot be bundled
// into a client component (webpack errors), so this never reaches the browser.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * ───────────────────────────────────────────────────────────────
 * Page-password hashing for password-protected hosted QR pages.
 *
 * Plaintext is NEVER stored or logged — only a scrypt hash. The owner sets a
 * password (server action hashes it before it touches the DB); a visitor's
 * unlock attempt is hashed server-side and compared in constant time. The
 * salt + cost are embedded in the stored string so verification is
 * self-describing:  scrypt$<N>$<saltHex>$<hashHex>.
 * ───────────────────────────────────────────────────────────────
 */

const scryptAsync = promisify(scrypt);
const KEYLEN = 32;
const COST = 16384; // scrypt N (2^14) — ~16MB, well within Node's default maxmem
const MIN_COST = 1024;

/** Hash a page password. Returns "scrypt$N$saltHex$hashHex". */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain.normalize("NFKC"), salt, KEYLEN)) as Buffer;
  return `scrypt$${COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Constant-time verify. Returns false for any wrong or malformed input. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;
    const [algo, nStr, saltHex, hashHex] = parts;
    if (algo !== "scrypt") return false;
    const n = Number(nStr);
    if (!Number.isInteger(n) || n < MIN_COST) return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (salt.length === 0 || expected.length === 0) return false;
    const derived = (await scryptAsync(plain.normalize("NFKC"), salt, expected.length)) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Basic policy for a page password (kept lenient — these gate content, not accounts). */
export function isAcceptablePassword(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 4 && plain.length <= 128;
}

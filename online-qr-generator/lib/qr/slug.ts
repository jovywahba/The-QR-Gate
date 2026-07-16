/**
 * Cryptographically random public slugs (no sequential ids). 10 chars
 * of [a-z0-9] ≈ 51 bits — collisions are retried at insert time anyway
 * (unique constraint on qr_codes.slug).
 */

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const SLUG_LENGTH = 10;
export const SLUG_PATTERN = /^[a-z0-9]{6,32}$/;

export function generateSlug(length: number = SLUG_LENGTH): string {
  const out: string[] = [];
  // Rejection sampling keeps the distribution unbiased (256 % 36 ≠ 0).
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    const bytes = new Uint8Array(length * 2);
    globalThis.crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < limit) {
        out.push(ALPHABET[b % ALPHABET.length]);
        if (out.length === length) break;
      }
    }
  }
  return out.join("");
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

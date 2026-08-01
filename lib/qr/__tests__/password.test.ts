import { describe, expect, it } from "vitest";
import { hashPassword, isAcceptablePassword, verifyPassword } from "../password";

describe("page-password hashing", () => {
  it("produces a self-describing scrypt hash, never the plaintext", async () => {
    const h = await hashPassword("s3cret-menu");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(h.split("$")).toHaveLength(4);
    expect(h.includes("s3cret-menu")).toBe(false);
  });

  it("uses a fresh salt each time (same password → different hashes)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("verifies the correct password and rejects the wrong one", async () => {
    const h = await hashPassword("open-sesame");
    expect(await verifyPassword("open-sesame", h)).toBe(true);
    expect(await verifyPassword("Open-Sesame", h)).toBe(false);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("", h)).toBe(false);
  });

  it("returns false for malformed / tampered stored hashes (never throws)", async () => {
    for (const bad of ["", "nope", "scrypt$16384$deadbeef", "bcrypt$1$aa$bb", "scrypt$1$aa$bb", "scrypt$x$aa$bb"]) {
      expect(await verifyPassword("x", bad)).toBe(false);
    }
  });

  it("normalizes unicode so equivalent forms match", async () => {
    // é as one codepoint vs e + combining accent → NFKC-equal.
    const composed = "café";
    const decomposed = "café";
    const h = await hashPassword(composed);
    expect(await verifyPassword(decomposed, h)).toBe(true);
  });

  it("enforces a basic length policy", () => {
    expect(isAcceptablePassword("abcd")).toBe(true);
    expect(isAcceptablePassword("abc")).toBe(false);
    expect(isAcceptablePassword("x".repeat(129))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, dayKey, visitorHash } from "../hash";

describe("visitor hashing", () => {
  const base = { ip: "203.0.113.5", ua: "Mozilla/5.0", day: "2026-07-18", secret: "s3cr3t" };

  it("is deterministic for identical inputs", () => {
    expect(visitorHash(base)).toBe(visitorHash({ ...base }));
  });

  it("is a 64-char hex sha256 digest (no raw IP inside)", () => {
    const h = visitorHash(base);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h.includes(base.ip)).toBe(false);
  });

  it("changes when any input changes (ip, ua, day, or secret)", () => {
    const h = visitorHash(base);
    expect(visitorHash({ ...base, ip: "203.0.113.6" })).not.toBe(h);
    expect(visitorHash({ ...base, ua: "curl/8" })).not.toBe(h);
    expect(visitorHash({ ...base, day: "2026-07-19" })).not.toBe(h);
    expect(visitorHash({ ...base, secret: "other" })).not.toBe(h);
  });

  it("dayKey is a UTC YYYY-MM-DD bucket", () => {
    expect(dayKey(new Date("2026-07-18T23:59:59Z"))).toBe("2026-07-18");
    expect(dayKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("client ip extraction", () => {
  const reader = (map: Record<string, string>) => ({ get: (k: string) => map[k] ?? null });
  it("takes the first x-forwarded-for entry", () => {
    expect(clientIpFromHeaders(reader({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip then a placeholder", () => {
    expect(clientIpFromHeaders(reader({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIpFromHeaders(reader({}))).toBe("0.0.0.0");
  });
});

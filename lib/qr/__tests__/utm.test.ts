import { describe, expect, it } from "vitest";
import { buildUrlWithUtm, hasUtm, parseUtm } from "../utm";

describe("buildUrlWithUtm", () => {
  it("appends UTM params to a bare domain (no scheme required)", () => {
    expect(buildUrlWithUtm("example.com", { source: "qr", medium: "print" })).toBe(
      "example.com?utm_source=qr&utm_medium=print",
    );
  });

  it("preserves existing non-UTM query params", () => {
    expect(buildUrlWithUtm("https://x.com/p?ref=abc", { campaign: "spring" })).toBe(
      "https://x.com/p?ref=abc&utm_campaign=spring",
    );
  });

  it("never duplicates a UTM key — replaces the existing one", () => {
    expect(buildUrlWithUtm("x.com?utm_source=old", { source: "new" })).toBe("x.com?utm_source=new");
  });

  it("drops empty values and removes a cleared key", () => {
    expect(buildUrlWithUtm("x.com?utm_source=old&utm_medium=m", { source: "", medium: "m" })).toBe(
      "x.com?utm_medium=m",
    );
  });

  it("preserves the fragment", () => {
    expect(buildUrlWithUtm("x.com/p#section", { source: "qr" })).toBe("x.com/p?utm_source=qr#section");
  });

  it("url-encodes spaces + special chars in values", () => {
    expect(buildUrlWithUtm("x.com", { campaign: "spring sale" })).toBe("x.com?utm_campaign=spring+sale");
  });
});

describe("parseUtm", () => {
  it("splits UTM out of a URL and returns the clean base", () => {
    const { base, utm } = parseUtm("https://x.com/p?ref=1&utm_source=qr&utm_campaign=spring#a");
    expect(base).toBe("https://x.com/p?ref=1#a");
    expect(utm).toEqual({ source: "qr", campaign: "spring" });
  });

  it("round-trips with buildUrlWithUtm", () => {
    const url = "x.com/p?keep=1&utm_source=qr&utm_medium=print";
    const { base, utm } = parseUtm(url);
    expect(buildUrlWithUtm(base, utm)).toBe(url);
  });

  it("returns empty utm for a plain URL", () => {
    expect(parseUtm("https://x.com").utm).toEqual({});
  });
});

describe("hasUtm", () => {
  it("detects any non-empty value", () => {
    expect(hasUtm({})).toBe(false);
    expect(hasUtm({ source: "" })).toBe(false);
    expect(hasUtm({ source: "qr" })).toBe(true);
  });
});

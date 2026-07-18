import { describe, expect, it } from "vitest";
import { isBot, parseUserAgent, referrerHost } from "../ua";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

describe("bot detection", () => {
  it("flags crawlers, preview fetchers, and scripted clients", () => {
    for (const ua of [
      "Googlebot/2.1 (+http://www.google.com/bot.html)",
      "facebookexternalhit/1.1",
      "WhatsApp/2.23",
      "curl/8.4.0",
      "python-requests/2.31",
      "node-fetch/1.0",
      "TwitterBot/1.0",
    ]) {
      expect(isBot(ua), ua).toBe(true);
    }
  });
  it("treats an empty UA as non-human", () => {
    expect(isBot("")).toBe(true);
    expect(isBot(null)).toBe(true);
  });
  it("does not flag real browsers", () => {
    for (const ua of [IPHONE, ANDROID, WINDOWS, IPAD]) expect(isBot(ua)).toBe(false);
  });
});

describe("device / browser / os parsing", () => {
  it("classifies mobile", () => {
    const i = parseUserAgent(IPHONE);
    expect(i.deviceType).toBe("mobile");
    expect(i.os).toBe("iOS");
    expect(i.browser).toBe("Safari");
    expect(i.isBot).toBe(false);
  });
  it("classifies android mobile chrome", () => {
    const a = parseUserAgent(ANDROID);
    expect(a.deviceType).toBe("mobile");
    expect(a.os).toBe("Android");
    expect(a.browser).toBe("Chrome");
  });
  it("classifies desktop windows chrome", () => {
    const w = parseUserAgent(WINDOWS);
    expect(w.deviceType).toBe("desktop");
    expect(w.os).toBe("Windows");
    expect(w.browser).toBe("Chrome");
  });
  it("classifies tablet", () => {
    expect(parseUserAgent(IPAD).deviceType).toBe("tablet");
  });
  it("returns a bot device for crawlers", () => {
    expect(parseUserAgent("Googlebot/2.1").deviceType).toBe("bot");
  });
});

describe("referrer host", () => {
  it("strips protocol + www", () => {
    expect(referrerHost("https://www.google.com/search?q=x")).toBe("google.com");
    expect(referrerHost("https://t.co/abc")).toBe("t.co");
  });
  it("returns null for empty / invalid", () => {
    expect(referrerHost(null)).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
  });
});

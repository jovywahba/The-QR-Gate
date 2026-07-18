/**
 * ───────────────────────────────────────────────────────────────
 * User-agent parsing + bot detection for scan analytics. Pure and
 * unit-tested. Coarse by design: we record device class / browser /
 * OS family only — never a fingerprint, never the raw UA long-term.
 * ───────────────────────────────────────────────────────────────
 */

export type DeviceInfo = {
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  browser: string;
  os: string;
  isBot: boolean;
};

/**
 * Known crawlers, link-preview fetchers, monitors, and scripted
 * clients. These are excluded from every scan count so analytics
 * reflect real people, not machines prefetching Open Graph tags.
 */
const BOT_RE =
  /(googlebot|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandex(bot)?|sogou|exabot|facebookexternalhit|facebot|ia_archiver|applebot|petalbot|semrush|ahrefs|mj12bot|dotbot|bot\b|crawler|crawl|spider|scraper|embedly|quora link preview|outbrain|pinterest(bot)?|slackbot|slack-imgproxy|vkshare|w3c_validator|redditbot|whatsapp|telegrambot|discordbot|twitterbot|linkedinbot|skypeuripreview|nuzzel|bitlybot|google-inspectiontool|chrome-lighthouse|lighthouse|gtmetrix|pingdom|uptimerobot|statuscake|headlesschrome|phantomjs|puppeteer|playwright|curl|wget|python-requests|python-urllib|go-http-client|okhttp|axios|node-fetch|libwww-perl|httpclient|java\/)/i;

export function isBot(ua: string | null | undefined): boolean {
  if (!ua || !ua.trim()) return true; // no UA → treat as non-human
  return BOT_RE.test(ua);
}

function detectBrowser(ua: string): string {
  if (/edg(a|ios|e)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/firefox\/|fxios/i.test(ua)) return "Firefox";
  if (/chrome\/|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && /version\//i.test(ua)) return "Safari";
  if (/msie|trident/i.test(ua)) return "Internet Explorer";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectDevice(ua: string): DeviceInfo["deviceType"] {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  const s = ua ?? "";
  if (isBot(s)) {
    return { deviceType: "bot", browser: "Bot", os: "Bot", isBot: true };
  }
  return {
    deviceType: detectDevice(s),
    browser: detectBrowser(s),
    os: detectOS(s),
    isBot: false,
  };
}

/** A referrer's hostname (for grouping), or null for direct/opaque. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/**
 * ───────────────────────────────────────────────────────────────
 * UTM builder helpers (pure, unit-tested). Campaign parameters are
 * merged INTO the destination URL (which is what the QR encodes), so
 * they work with the existing content model — no schema change.
 *
 * Rules: preserve existing non-UTM query params + fragment, never
 * duplicate a UTM key, drop empty values, and don't require the URL to
 * carry a scheme (users type "example.com").
 * ───────────────────────────────────────────────────────────────
 */

export const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export const UTM_LABELS: Record<UtmKey, string> = {
  source: "Source",
  medium: "Medium",
  campaign: "Campaign",
  term: "Term",
  content: "Content",
};

const PARAM = (k: UtmKey) => `utm_${k}`;

/** Split a raw URL string into {head, query, hash} without needing a scheme. */
function split(raw: string): { head: string; query: string; hash: string } {
  const hashIdx = raw.indexOf("#");
  const hash = hashIdx >= 0 ? raw.slice(hashIdx) : "";
  const noHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
  const qIdx = noHash.indexOf("?");
  const head = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash;
  const query = qIdx >= 0 ? noHash.slice(qIdx + 1) : "";
  return { head, query, hash };
}

function rebuild(head: string, params: URLSearchParams, hash: string): string {
  const qs = params.toString();
  return head + (qs ? `?${qs}` : "") + hash;
}

/** Extract the UTM values from a URL and return the URL with them removed. */
export function parseUtm(url: string): { base: string; utm: Utm } {
  const { head, query, hash } = split(url ?? "");
  const params = new URLSearchParams(query);
  const utm: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(PARAM(k));
    if (v) utm[k] = v;
    params.delete(PARAM(k));
  }
  return { base: rebuild(head, params, hash), utm };
}

/** Merge UTM values into a base URL (existing params + fragment preserved). */
export function buildUrlWithUtm(baseUrl: string, utm: Utm): string {
  const { head, query, hash } = split(baseUrl ?? "");
  const params = new URLSearchParams(query);
  for (const k of UTM_KEYS) {
    params.delete(PARAM(k)); // never duplicate
    const v = (utm[k] ?? "").trim();
    if (v) params.set(PARAM(k), v);
  }
  return rebuild(head, params, hash);
}

/** True when at least one UTM value is set (drives the "applied" badge). */
export function hasUtm(utm: Utm): boolean {
  return UTM_KEYS.some((k) => (utm[k] ?? "").trim().length > 0);
}

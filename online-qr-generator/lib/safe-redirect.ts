/**
 * Open-redirect guard: only same-origin absolute paths pass. Anything
 * scheme-like ("https://evil", "//evil", "javascript:…") falls back.
 */
export function safeRedirectPath(value: unknown, fallback: string): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : fallback;
}

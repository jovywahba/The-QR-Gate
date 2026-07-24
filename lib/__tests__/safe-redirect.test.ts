import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../safe-redirect";

describe("safeRedirectPath (open-redirect guard)", () => {
  it("allows same-origin absolute paths (with query)", () => {
    expect(safeRedirectPath("/dashboard", "/x")).toBe("/dashboard");
    expect(safeRedirectPath("/create?type=website&step=4", "/x")).toBe("/create?type=website&step=4");
    expect(safeRedirectPath("/dashboard/qr-codes", "/x")).toBe("/dashboard/qr-codes");
  });

  it("rejects protocol-relative and absolute external URLs", () => {
    expect(safeRedirectPath("//evil.com", "/fb")).toBe("/fb");
    expect(safeRedirectPath("https://evil.com", "/fb")).toBe("/fb");
    expect(safeRedirectPath("http://evil.com", "/fb")).toBe("/fb");
  });

  it("rejects scheme + backslash tricks and non-strings", () => {
    expect(safeRedirectPath("javascript:alert(1)", "/fb")).toBe("/fb");
    expect(safeRedirectPath("/\\evil", "/fb")).toBe("/fb");
    expect(safeRedirectPath("evil", "/fb")).toBe("/fb");
    expect(safeRedirectPath(null, "/fb")).toBe("/fb");
    expect(safeRedirectPath(undefined, "/fb")).toBe("/fb");
    expect(safeRedirectPath(42, "/fb")).toBe("/fb");
  });
});

// The sign-in server action + middleware both resolve their post-auth
// destination through this guard with a "/dashboard" fallback. These cases
// pin the auth-return contract the dashboard work depends on.
describe("post-auth destination contract (fallback = /dashboard)", () => {
  it("sends a normal sign-in (no redirect) to /dashboard", () => {
    expect(safeRedirectPath(undefined, "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("", "/dashboard")).toBe("/dashboard");
  });

  it("restores a valid in-flow QR wizard step", () => {
    expect(safeRedirectPath("/create?type=website&step=4", "/dashboard")).toBe(
      "/create?type=website&step=4",
    );
    expect(safeRedirectPath("/create?id=abc&step=2", "/dashboard")).toBe("/create?id=abc&step=2");
  });

  it("never honors a stale/hostile redirect — falls back to /dashboard", () => {
    expect(safeRedirectPath("https://evil.com/create", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com", "/dashboard")).toBe("/dashboard");
  });
});

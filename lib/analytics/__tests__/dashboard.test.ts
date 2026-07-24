import { describe, expect, it } from "vitest";
import { EMPTY_OVERVIEW, parseActivity, parseOverview } from "../dashboard";

describe("parseOverview", () => {
  it("returns the honest empty shape for junk", () => {
    expect(parseOverview(null)).toEqual(EMPTY_OVERVIEW);
    expect(parseOverview("nope")).toEqual(EMPTY_OVERVIEW);
    expect(parseOverview(undefined)).toEqual(EMPTY_OVERVIEW);
  });

  it("parses a full upgraded overview incl. unique visitors + rich top QR", () => {
    const o = parseOverview({
      total_scans: 42,
      unique_visitors: 30,
      scans_30d: 12,
      active_count: 2,
      most_scanned: {
        id: "abc",
        name: "Menu",
        type: "menu",
        scans: 20,
        unique: 15,
        last_scanned: "2026-07-01T00:00:00Z",
      },
    });
    expect(o.totalScans).toBe(42);
    expect(o.uniqueVisitors).toBe(30);
    expect(o.scans30d).toBe(12);
    expect(o.activeCount).toBe(2);
    expect(o.mostScanned).toEqual({
      id: "abc",
      name: "Menu",
      type: "menu",
      scans: 20,
      unique: 15,
      lastScanned: "2026-07-01T00:00:00Z",
    });
  });

  it("keeps unique unknown (null) when the pre-0003 RPC omits it — never fakes a 0", () => {
    const o = parseOverview({ total_scans: 5, scans_30d: 5, active_count: 1, most_scanned: null });
    expect(o.uniqueVisitors).toBeNull();
    expect(o.mostScanned).toBeNull();
  });

  it("distinguishes a real 0 unique from an absent field", () => {
    expect(parseOverview({ unique_visitors: 0 }).uniqueVisitors).toBe(0);
  });

  it("tolerates a legacy most_scanned lacking the new fields", () => {
    const o = parseOverview({ most_scanned: { id: "x", name: "Old", scans: 3 } });
    expect(o.mostScanned).toEqual({
      id: "x",
      name: "Old",
      type: null,
      scans: 3,
      unique: null,
      lastScanned: null,
    });
  });
});

describe("parseActivity", () => {
  it("returns zeros + empty series for junk", () => {
    expect(parseActivity(null)).toEqual({ total: 0, unique: 0, daily: [] });
  });

  it("parses totals + daily points (count + unique)", () => {
    const a = parseActivity({
      total: 9,
      unique: 6,
      daily: [
        { date: "2026-07-01", count: 4, unique: 3 },
        { date: "2026-07-02", count: 5, unique: 3 },
      ],
    });
    expect(a.total).toBe(9);
    expect(a.unique).toBe(6);
    expect(a.daily).toHaveLength(2);
    expect(a.daily[0]).toEqual({ date: "2026-07-01", count: 4, unique: 3 });
  });

  it("coerces missing daily fields to 0 without dropping the point", () => {
    const a = parseActivity({ daily: [{ date: "2026-07-03" }] });
    expect(a.daily[0]).toEqual({ date: "2026-07-03", count: 0, unique: 0 });
  });
});

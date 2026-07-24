import { describe, expect, it } from "vitest";
import {
  isTrackable,
  scanDisplay,
  statusBadge,
  trackingDescription,
} from "../status-display";

describe("isTrackable", () => {
  it("only hosted + redirect route through our server", () => {
    expect(isTrackable("hosted")).toBe(true);
    expect(isTrackable("redirect")).toBe(true);
    expect(isTrackable("direct")).toBe(false);
    expect(isTrackable("native")).toBe(false);
  });
});

describe("scanDisplay — honest scan labels", () => {
  it("native WiFi/vCard codes are called out as untrackable, never '0 scans'", () => {
    const d = scanDisplay("native", 0);
    expect(d.kind).toBe("native");
    expect(d.label).toBe("Native QR — not trackable");
  });

  it("a direct-URL QR with tracking off says so — not '0 scans'", () => {
    const d = scanDisplay("direct", 0);
    expect(d.kind).toBe("disabled");
    expect(d.label).toBe("Tracking disabled");
  });

  it("a trackable QR with no events yet says 'No scans yet'", () => {
    const d = scanDisplay("hosted", 0);
    expect(d).toEqual({ kind: "none", label: "No scans yet", scans: 0 });
    expect(scanDisplay("redirect", 0).kind).toBe("none");
  });

  it("counts real scans, with singular/plural + thousands grouping", () => {
    expect(scanDisplay("hosted", 1)).toEqual({ kind: "count", label: "1 scan", scans: 1 });
    expect(scanDisplay("redirect", 128).label).toBe("128 scans");
    expect(scanDisplay("hosted", 1234).label).toBe("1,234 scans");
  });

  it("never treats null/negative as verified scans", () => {
    expect(scanDisplay("hosted", null).kind).toBe("none");
    expect(scanDisplay("hosted", undefined).kind).toBe("none");
    expect(scanDisplay("hosted", -5).kind).toBe("none");
  });
});

describe("statusBadge", () => {
  it("maps the three real schema states", () => {
    expect(statusBadge("published")).toEqual({ label: "Published", tone: "published" });
    expect(statusBadge("draft")).toEqual({ label: "Draft", tone: "draft" });
    expect(statusBadge("archived")).toEqual({ label: "Archived", tone: "archived" });
  });

  it("treats anything unknown as a draft (never 'Active')", () => {
    expect(statusBadge("weird").label).toBe("Draft");
  });
});

describe("trackingDescription", () => {
  it("is honest about whether analytics exist", () => {
    expect(trackingDescription("hosted")).toMatch(/Tracked through/);
    expect(trackingDescription("redirect")).toMatch(/Tracked through/);
    expect(trackingDescription("direct")).toMatch(/no analytics/i);
    expect(trackingDescription("native")).toMatch(/unavailable/i);
  });
});

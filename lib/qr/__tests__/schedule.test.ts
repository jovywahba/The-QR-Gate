import { describe, expect, it } from "vitest";
import { isScheduleOpen, scheduleState } from "../schedule";

const T = (iso: string) => Date.parse(iso);
const NOW = T("2026-07-24T12:00:00Z");

describe("scheduleState (server-time authority)", () => {
  it("is 'none' when neither bound is set", () => {
    expect(scheduleState(null, null, NOW)).toBe("none");
  });

  it("is 'scheduled' before the start", () => {
    expect(scheduleState("2026-07-25T00:00:00Z", null, NOW)).toBe("scheduled");
  });

  it("is 'active' between start and end", () => {
    expect(scheduleState("2026-07-24T00:00:00Z", "2026-07-25T00:00:00Z", NOW)).toBe("active");
  });

  it("is 'expired' at or after the end", () => {
    expect(scheduleState(null, "2026-07-24T12:00:00Z", NOW)).toBe("expired");
    expect(scheduleState(null, "2026-07-24T11:59:59Z", NOW)).toBe("expired");
  });

  it("is 'active' after a start with no end", () => {
    expect(scheduleState("2026-07-24T00:00:00Z", null, NOW)).toBe("active");
  });

  it("ignores invalid dates", () => {
    expect(scheduleState("not-a-date", null, NOW)).toBe("none");
  });
});

describe("isScheduleOpen", () => {
  it("resolves only when none/active", () => {
    expect(isScheduleOpen(null, null, NOW)).toBe(true);
    expect(isScheduleOpen("2026-07-24T00:00:00Z", "2026-07-25T00:00:00Z", NOW)).toBe(true);
    expect(isScheduleOpen("2026-07-25T00:00:00Z", null, NOW)).toBe(false); // scheduled
    expect(isScheduleOpen(null, "2026-07-24T00:00:00Z", NOW)).toBe(false); // expired
  });
});

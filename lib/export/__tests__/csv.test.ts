import { describe, expect, it } from "vitest";
import { csvCell, csvFilename, toCsv } from "../csv";

describe("csvCell — injection safety + RFC-4180", () => {
  it("neutralizes formula-trigger prefixes with a leading quote", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\ttab")).toBe("'\ttab");
  });

  it("quotes + escapes commas, quotes, and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("a formula cell that also needs quoting gets both treatments", () => {
    // leading '=' → prefixed to '=...; then it contains a comma → quoted.
    expect(csvCell("=1,2")).toBe("\"'=1,2\"");
  });

  it("passes safe values through untouched", () => {
    expect(csvCell("Menu QR")).toBe("Menu QR");
    expect(csvCell(128)).toBe("128");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(true)).toBe("true");
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and cells with commas", () => {
    const csv = toCsv([
      ["Date", "Name", "Scans"],
      ["2026-07-01", "My QR", 5],
    ]);
    expect(csv).toBe("Date,Name,Scans\r\n2026-07-01,My QR,5");
  });

  it("keeps a malicious header/name from becoming a formula", () => {
    const csv = toCsv([["=HYPERLINK(\"http://evil\")", "ok"]]);
    expect(csv.startsWith("\"'=HYPERLINK")).toBe(true);
  });
});

describe("csvFilename", () => {
  it("slugifies to safe ascii + stamps", () => {
    expect(csvFilename("My Menu QR!", "2026-07-24")).toBe("my-menu-qr-2026-07-24.csv");
    expect(csvFilename("", "2026-07-24")).toBe("export-2026-07-24.csv");
    expect(csvFilename("###", "2026-07-24")).toBe("export-2026-07-24.csv");
  });
});

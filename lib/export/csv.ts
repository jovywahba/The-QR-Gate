/**
 * ───────────────────────────────────────────────────────────────
 * Minimal, dependency-free, INJECTION-SAFE CSV encoding (unit-tested).
 *
 * Spreadsheet apps execute a cell that begins with = + - @ (or a
 * leading tab/CR) as a formula — a classic CSV-injection vector when
 * exporting user-controlled data (QR names, referrers). We neutralize
 * those by prefixing a single quote, then apply normal RFC-4180 quoting.
 * ───────────────────────────────────────────────────────────────
 */

export type CsvValue = string | number | boolean | null | undefined;

/** Encode one cell: neutralize formula triggers, then RFC-4180 quote. */
export function csvCell(value: CsvValue): string {
  let s = value == null ? "" : String(value);
  // Formula-injection guard (also catches a leading tab / carriage return).
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** Join a matrix of rows into a CSV string (CRLF line endings, RFC-4180). */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<CsvValue>>): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** A safe, ASCII, timestamped download filename from an arbitrary label. */
export function csvFilename(label: string, stampYmd: string): string {
  const base = (label || "export")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "export";
  return `${base}-${stampYmd}.csv`;
}

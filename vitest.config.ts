import { defineConfig } from "vitest/config";
import path from "node:path";

// App-local test harness (same pattern as deadbolt — NOT added to _template).
// `node` env is enough: the QR engine (payload builders, validation,
// persistence redaction) is pure logic with no DOM dependency.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  // NOTE: tests stay .ts-only (tsconfig uses jsx: "preserve" for Next,
  // which this Vite version won't transform for imported .tsx modules).
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});

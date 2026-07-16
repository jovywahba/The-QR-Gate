import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: `${site.name} system status.`,
};

// Static starting point. Wire to a real probe / status provider when you have one.
const SERVICES = [
  { name: "App", status: "Operational" },
  { name: "API", status: "Operational" },
  { name: "Database", status: "Operational" },
  { name: "Payments", status: "Operational" },
];

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">Status</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">All systems operational</h1>

      <div className="mt-8 overflow-hidden rounded-xl border bg-card">
        {SERVICES.map((s, i) => (
          <div
            key={s.name}
            className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t" : ""}`}
          >
            <span className="text-sm font-medium">{s.name}</span>
            <span className="inline-flex items-center gap-2 text-sm" style={{ color: "#1B8A5B" }}>
              <span className="size-1.5 rounded-full" style={{ background: "#1B8A5B" }} />
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

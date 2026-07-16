import { cn } from "@/lib/utils";

type Delta = { value: string; direction: "up" | "down" | "flat" };

// Halfstack signature pattern: flat metric card — mono eyebrow label, mono numeric,
// optional delta. Status colors per design system (paid green / destructive).
export function StatCard({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: string;
  delta?: Delta;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-5", className)}>
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2.5 font-mono text-2xl font-medium tabular-nums">{value}</div>
      {delta ? (
        <div
          className={cn(
            "mt-1 font-mono text-xs",
            delta.direction === "up" && "text-[#1B8A5B]",
            delta.direction === "down" && "text-destructive",
            delta.direction === "flat" && "text-muted-foreground",
          )}
        >
          {delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "→"} {delta.value}
        </div>
      ) : null}
    </div>
  );
}

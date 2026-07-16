import { Badge } from "@/components/ui/badge";
import { site, type ComparisonRow } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The signature Halfstack pattern: Incumbent (struck through) → Halfstack → You save.
 * This is the money shot on landing + pricing + alternative pages.
 */
export function ComparisonTable({
  rows = site.comparison.rows,
  incumbentName = site.incumbent.name,
  className,
}: {
  rows?: readonly ComparisonRow[];
  incumbentName?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="border-b px-8 py-6">
        <div className="text-xl font-semibold tracking-tight">
          What you’d pay, and what you pay.
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Same capabilities. {site.name} bills half.
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr_1fr_0.9fr] gap-5 px-8 py-3.5 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <div />
        <div>{incumbentName}</div>
        <div className="text-foreground">{site.name}</div>
        <div className="text-right">You save</div>
      </div>

      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[1.5fr_1fr_1fr_0.9fr] items-center gap-5 border-t px-8 py-4"
        >
          <div className="text-sm font-medium">{row.label}</div>
          <div className="font-mono text-base text-muted-foreground line-through">
            {row.incumbent}
          </div>
          <div className="font-mono text-lg font-medium">{row.halfstack}</div>
          <div className="text-right">
            {row.save ? (
              <Badge variant="accent" className="font-mono">
                {row.save}
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

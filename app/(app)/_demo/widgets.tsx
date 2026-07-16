import { Phone, Mail, Calendar, StickyNote, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  STAGE_META,
  CONTACT_STATUS_META,
  HEALTH_META,
  type DealStage,
  type ContactStatus,
  type Health,
  type ActivityKind,
  type Priority,
} from "./data";

/* Small shared presentational bits for the demo CRM pages. Presentational only —
   no state — so they drop into server or client pages alike. */

export function Dot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-1.5 shrink-0 rounded-full", className)}
      style={{ background: color }}
    />
  );
}

export function StageBadge({ stage }: { stage: DealStage }) {
  const m = STAGE_META[stage];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <Dot color={m.dot} />
      {m.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  const m = CONTACT_STATUS_META[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <Dot color={m.dot} />
      {m.label}
    </Badge>
  );
}

export function HealthBadge({ health }: { health: Health }) {
  const m = HEALTH_META[health];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Dot color={m.dot} />
      {m.label}
    </span>
  );
}

const PRIORITY: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "#C2392F" },
  medium: { label: "Medium", color: "#D9A21B" },
  low: { label: "Low", color: "#9A968A" },
};

export function PriorityFlag({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      <Dot color={p.color} />
      {p.label}
    </span>
  );
}

const ACTIVITY_ICON = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
  task: CheckSquare,
} as const;

export function ActivityIcon({ kind, className }: { kind: ActivityKind; className?: string }) {
  const Icon = ACTIVITY_ICON[kind];
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

export function Initials({
  initials,
  className,
  size = 7,
}: {
  initials: string;
  className?: string;
  size?: number;
}) {
  return (
    <Avatar className={cn(className)} style={{ width: size * 4, height: size * 4 }}>
      <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarStack({ people }: { people: string[] }) {
  return (
    <div className="flex -space-x-2">
      {people.map((p, i) => (
        <Avatar key={i} className="size-6 ring-2 ring-card">
          <AvatarFallback className="bg-secondary text-[9px] font-medium text-secondary-foreground">
            {p}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

/** Lightweight inline bar chart (demo visual — not a real chart component). */
export function BarChart({
  points,
  labels,
  className,
}: {
  points: number[];
  labels: string[];
  className?: string;
}) {
  const max = Math.max(...points, 1);
  const n = points.length;
  const gap = 3;
  const bw = (100 - gap * (n - 1)) / n;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-32 w-full">
        {points.map((v, i) => {
          const h = (v / max) * 36;
          const x = i * (bw + gap);
          const last = i === n - 1;
          return (
            <rect
              key={i}
              x={x}
              y={40 - h}
              width={bw}
              height={h}
              rx={1}
              className={last ? "fill-accent" : "fill-muted-foreground/25"}
            />
          );
        })}
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
        {labels.map((l) => (
          <span key={l} className="flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

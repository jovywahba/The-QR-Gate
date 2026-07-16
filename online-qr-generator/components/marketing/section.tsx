import { cn } from "@/lib/utils";

export function Section({
  id,
  paper = false,
  className,
  children,
}: {
  id?: string;
  paper?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn(paper ? "border-y bg-paper" : "", className)}>
      <div className="mx-auto max-w-6xl px-6 py-20">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow ? (
        <div className="font-mono text-xs uppercase tracking-wider text-accent">{eyebrow}</div>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {sub ? <p className="mt-3 text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

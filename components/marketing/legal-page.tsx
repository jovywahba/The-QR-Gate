import type { ReactNode } from "react";

/** Shared shell for Terms / Privacy (and any future legal page). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated: {updated}</p>

      {/* TEMPLATE NOTICE — delete once customized + reviewed by counsel. */}
      <div className="mt-6 rounded-lg border border-dashed bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">Template document.</strong> Boilerplate to
        adapt per product: replace the <code className="font-mono">[bracketed]</code> placeholders,
        confirm the data practices and subprocessors match this app, and have counsel review before
        launch. This is not legal advice.
      </div>

      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{heading}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-accent [&_a:hover]:underline [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

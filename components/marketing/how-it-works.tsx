import { Section, SectionHeading } from "./section";
import { landing } from "@/lib/landing";

export function HowItWorks() {
  return (
    <Section paper>
      <SectionHeading eyebrow="How it works" title="Switch in three steps." />
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {landing.steps.map((s, i) => (
          <div key={s.title} className="flex flex-col gap-3">
            <div className="font-mono text-sm text-accent">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

import { Section, SectionHeading } from "./section";
import { landing } from "@/lib/landing";

export function FeatureGrid() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Features"
        title="Everything you use. Nothing you don’t."
        sub="The core workflow, rebuilt clean — without the enterprise bloat or the enterprise price."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {landing.features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

import { Section, SectionHeading } from "./section";
import { landing } from "@/lib/landing";

// Native <details> accordion — accessible, zero JS, no extra deps.
export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading center eyebrow="FAQ" title="Questions, answered." />
      <div className="mx-auto mt-10 max-w-2xl divide-y overflow-hidden rounded-xl border bg-card">
        {landing.faqs.map((f) => (
          <details key={f.q} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
              {f.q}
              <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

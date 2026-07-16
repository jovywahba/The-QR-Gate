import { landing } from "@/lib/landing";

export function SocialProof() {
  if (!landing.socialProof) return null;
  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {landing.socialProof}
      </div>
    </div>
  );
}

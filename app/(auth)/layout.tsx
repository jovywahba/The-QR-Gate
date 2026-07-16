import Link from "next/link";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
        {site.name}
      </Link>
      <div className="w-full max-w-sm rounded-xl border bg-card p-8">{children}</div>
      <p className="mt-6 font-mono text-xs text-muted-foreground">{site.halfstack.label}</p>
    </div>
  );
}

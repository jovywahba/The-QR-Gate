import { Smartphone } from "lucide-react";
import type { AppsContent } from "@/lib/qr/types";
import { AppsStoreButtons } from "./apps-store-buttons";
import type { AssetResolver } from "./resolver";

export function AppsPublicPage({ data, resolveAsset }: { data: AppsContent; resolveAsset: AssetResolver }) {
  const iconUrl = resolveAsset(data.icon);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="size-20 rounded-xl border object-cover" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-xl border bg-muted/40">
            <Smartphone className="size-8 text-muted-foreground" aria-hidden />
          </span>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{data.appName.trim() || "App"}</h1>
          {data.description.trim() && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
          )}
        </div>
      </div>

      <AppsStoreButtons data={data} />
    </div>
  );
}

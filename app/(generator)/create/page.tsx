import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QRBuilder, type SavedQRRecord } from "@/components/qr-generator/qr-builder-layout";
import { isQRType } from "@/lib/qr/registry";
import type { QRContent, QRType, WizardStep } from "@/lib/qr/types";
import { createClient } from "@/lib/supabase/server";

/**
 * The wizard, driven by the URL: /create?type=website&step=2, or
 * /create?id={qrCodeId}&step=2 to reopen a saved QR. Ownership of
 * `id` is verified server-side (RLS: the select only ever returns
 * the signed-in user's row — changing the id can't open someone
 * else's editor).
 */
export const metadata: Metadata = {
  title: "Create a QR Code",
};

function parseStep(raw: string | undefined, type: QRType | null): WizardStep {
  if (!type) return 1;
  const n = Number(raw);
  return n === 2 || n === 3 || n === 4 ? (n as WizardStep) : 1;
}

async function loadSavedRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<{ record: SavedQRRecord; type: QRType } | null> {
  const { data: row } = await supabase
    .from("qr_codes")
    .select("id, type, status, slug, content, design, destination_url, tracking_mode")
    .eq("id", id)
    .maybeSingle();
  if (!row || !isQRType(row.type)) return null;

  const content = (row.content ?? null) as QRContent | null;
  return {
    type: row.type,
    record: {
      qrCodeId: row.id,
      content: content?.type === row.type ? content : null,
      design: row.design,
      slug: row.slug,
      publicUrl: row.destination_url,
      published: row.status === "published",
      trackingMode: (row.tracking_mode as string | null) ?? undefined,
    },
  };
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; step?: string; id?: string }>;
}) {
  const params = await searchParams;

  if (params.id && /^[0-9a-f-]{36}$/.test(params.id)) {
    // Auth check first — the redirect() must NOT be inside a try/catch
    // (it throws a NEXT_REDIRECT control-flow signal the framework needs).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/sign-in?redirect=${encodeURIComponent(`/create?id=${params.id}&step=${params.step ?? "2"}`)}`);
    }

    let loaded: Awaited<ReturnType<typeof loadSavedRecord>> = null;
    try {
      loaded = await loadSavedRecord(supabase, params.id);
    } catch {
      loaded = null;
    }
    if (!loaded) notFound();
    const step = parseStep(params.step ?? "2", loaded.type);
    return (
      <QRBuilder
        initialType={loaded.type}
        initialStep={step === 1 ? 2 : step}
        initialRecord={loaded.record}
      />
    );
  }

  const type = isQRType(params.type) ? params.type : null;
  const step = parseStep(params.step, type);

  return <QRBuilder initialType={type} initialStep={step} />;
}

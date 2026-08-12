import type { Metadata } from "next";
import { QRBuilder } from "@/components/qr-generator/qr-builder-layout";
import { getHeaderUser } from "@/lib/auth/current-user";
import { site } from "@/lib/site";

/**
 * The homepage IS the generator — Step 1, Select QR Type.
 * No separate marketing homepage before the product (deliberate).
 */
export const metadata: Metadata = {
  title: `${site.name} — Free QR Code Generator`,
  description: site.description,
};

export default async function HomePage() {
  const initialUser = await getHeaderUser();
  return <QRBuilder initialUser={initialUser} />;
}

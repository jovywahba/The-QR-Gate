"use client";

import { AudioPublicPage } from "@/components/qr-public/audio-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { MP3Content } from "@/lib/qr/types";

export function AudioPreview({ data }: { data: MP3Content }) {
  return <AudioPublicPage data={data} resolveAsset={previewResolver} />;
}

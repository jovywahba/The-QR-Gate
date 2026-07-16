"use client";

import { previewResolver } from "@/components/qr-public/resolver";
import { VideoPublicPage } from "@/components/qr-public/video-public-page";
import type { VideoContent } from "@/lib/qr/types";

export function VideoPreview({ data }: { data: VideoContent }) {
  return <VideoPublicPage data={data} resolveAsset={previewResolver} />;
}

import { NextResponse } from "next/server";
import { appleAppId } from "@/lib/qr/preview-ssrf";

/**
 * Real Apple App Store metadata via the public iTunes Lookup API
 * (official, no key). Returns the app's real name, icon, average
 * rating, and description — only what Apple actually returns. Google
 * Play has no equivalent public API, so those keep the user's entered
 * values + the real store link (never fabricated).
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  const id = url ? appleAppId(url) : null;
  if (!id) return NextResponse.json({ found: false }, { status: 200 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const body = (await res.json()) as {
      results?: Array<{
        trackName?: string;
        artworkUrl100?: string;
        averageUserRating?: number;
        userRatingCount?: number;
        description?: string;
        primaryGenreName?: string;
      }>;
    };
    const app = body.results?.[0];
    if (!app) return NextResponse.json({ found: false }, { status: 200 });

    return NextResponse.json(
      {
        found: true,
        name: app.trackName ?? null,
        icon: app.artworkUrl100 ?? null,
        rating: typeof app.averageUserRating === "number" ? Number(app.averageUserRating.toFixed(1)) : null,
        ratingCount: app.userRatingCount ?? null,
        genre: app.primaryGenreName ?? null,
        description: app.description ?? null,
      },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  } finally {
    clearTimeout(timer);
  }
}

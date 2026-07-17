import { NextResponse } from "next/server";
import { isBlockedHost } from "@/lib/qr/preview-ssrf";

/**
 * Real URL metadata for the Website/Menu preview cards. Fetches the
 * PUBLIC page server-side, returns its title / description / OG image
 * / favicon and whether it permits framing (X-Frame-Options / CSP
 * frame-ancestors). SSRF-guarded: https(+http) only, no localhost /
 * private ranges, capped size + timeout, no HTML executed. This reads
 * standard public metadata only — it never scrapes protected content.
 */

export const runtime = "nodejs";

function attr(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

function abs(base: URL, href: string | null): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url." }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "Only http(s) URLs." }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: "Blocked host." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "TheQRGate-LinkPreview/1.0", Accept: "text/html,*/*" },
    });

    // Framing policy from response headers.
    const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") ?? "").toLowerCase();
    const framingBlocked =
      xfo.includes("deny") ||
      xfo.includes("sameorigin") ||
      /frame-ancestors\s+('none'|[^;]*\bself\b)/.test(csp);

    const contentType = res.headers.get("content-type") ?? "";
    let title: string | null = null;
    let description: string | null = null;
    let image: string | null = null;
    let favicon: string | null = null;

    if (contentType.includes("text/html")) {
      // Read at most ~200 KB of the head.
      const reader = res.body?.getReader();
      let html = "";
      if (reader) {
        const decoder = new TextDecoder();
        for (let read = 0; read < 200_000; ) {
          const { done, value } = await reader.read();
          if (done) break;
          html += decoder.decode(value, { stream: true });
          read += value.byteLength;
          if (html.includes("</head>")) break;
        }
        await reader.cancel().catch(() => undefined);
      }
      title =
        attr(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        attr(html, /<title[^>]*>([^<]+)<\/title>/i);
      description =
        attr(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
        attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      image = abs(target, attr(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i));
      favicon =
        abs(target, attr(html, /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)) ??
        abs(target, "/favicon.ico");
    }

    return NextResponse.json(
      {
        url: target.toString(),
        domain: target.hostname.replace(/^www\./, ""),
        title,
        description,
        image,
        favicon,
        embeddable: !framingBlocked,
      },
      { headers: { "Cache-Control": "public, max-age=600" } },
    );
  } catch {
    return NextResponse.json(
      { url: target.toString(), domain: target.hostname.replace(/^www\./, ""), title: null, embeddable: false, error: "unreachable" },
      { status: 200 },
    );
  } finally {
    clearTimeout(timer);
  }
}

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function parseMeta(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']*)["'][^>]*>/i);
  return {
    title: (ogTitleMatch?.[1] || titleMatch?.[1] || "").trim(),
    description: (ogDescMatch?.[1] || descMatch?.[1] || "").trim(),
    icon: iconMatch?.[1] || null,
  };
}

function isEmbedAllowed(headers: Headers) {
  const xfo = headers.get("x-frame-options")?.toLowerCase() || "";
  if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
  const csp = headers.get("content-security-policy") || "";
  const fa = csp.split(";").find((d) => d.trim().toLowerCase().startsWith("frame-ancestors"));
  if (fa) {
    const value = fa.split(/\s+/).slice(1).join(" ").toLowerCase();
    if (value.includes("'none'")) return false;
    if (value.includes("'self'")) return false; // conservative default for third-party embeds
  }
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  try {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    const allowEmbed = isEmbedAllowed(res.headers);
    let meta = { title: "", description: "", icon: null as string | null };
    let iconUrl: string | null = null;
    try {
      const text = await res.text();
      meta = parseMeta(text);
      if (meta.icon) {
        const u = new URL(url);
        iconUrl = new URL(meta.icon, u.origin).toString();
      }
    } catch {}
    return NextResponse.json({ allowEmbed, title: meta.title, description: meta.description, iconUrl, url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FNABot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();

    const get = (property: string): string | null => {
      // Try og: tags first, then standard meta
      const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
        ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'));
      if (ogMatch) return ogMatch[1];

      if (property === 'title') {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch?.[1] ?? null;
      }
      if (property === 'description') {
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        return descMatch?.[1] ?? null;
      }
      return null;
    };

    const favicon = (() => {
      const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)
        ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
      if (!iconMatch) return `${parsed.origin}/favicon.ico`;
      const href = iconMatch[1];
      if (href.startsWith('http')) return href;
      if (href.startsWith('//')) return `${parsed.protocol}${href}`;
      return `${parsed.origin}${href.startsWith('/') ? '' : '/'}${href}`;
    })();

    return NextResponse.json({
      title: get('title') ?? parsed.hostname,
      description: get('description') ?? null,
      image: get('image') ?? null,
      siteName: get('site_name') ?? parsed.hostname,
      favicon,
      url: parsed.href,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

function detectRatio(width: number, height: number): AspectRatio {
  const r = width / height;
  if (r > 2.3) return '21:9';
  if (r > 1.7) return '16:9';
  if (r > 1.3) return '4:3';
  if (r > 0.9) return '1:1';
  return '9:16';
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_KEY;

  if (!libraryId || !apiKey) {
    return NextResponse.json({ error: 'Bunny credentials not configured' }, { status: 500 });
  }

  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    { headers: { AccessKey: apiKey } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: `Bunny API error: ${res.status}` }, { status: res.status });
  }

  const data = await res.json() as { width?: number; height?: number };
  const width = data.width ?? 0;
  const height = data.height ?? 0;

  if (!width || !height) {
    return NextResponse.json({ error: 'Video dimensions not available yet (still processing?)' }, { status: 422 });
  }

  return NextResponse.json({ width, height, aspectRatio: detectRatio(width, height) });
}

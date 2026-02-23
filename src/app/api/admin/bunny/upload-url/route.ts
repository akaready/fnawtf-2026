import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, collectionId } = await request.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_KEY;

  if (!libraryId || !apiKey) {
    return NextResponse.json({ error: 'Bunny CDN not configured' }, { status: 500 });
  }

  const body: Record<string, string> = { title };
  if (collectionId) body.collectionId = collectionId;

  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Bunny error: ${text}` }, { status: res.status });
  }

  const bunnyVideo = await res.json();

  return NextResponse.json({
    videoId: bunnyVideo.guid as string,
    uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideo.guid as string}`,
    apiKey,
  });
}

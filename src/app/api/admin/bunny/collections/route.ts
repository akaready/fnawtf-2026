import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_KEY;

  if (!libraryId || !apiKey) {
    return NextResponse.json({ error: 'Bunny CDN not configured' }, { status: 500 });
  }

  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/collections?page=1&itemsPerPage=100`,
    { headers: { AccessKey: apiKey } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.items ?? []);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'thumbnails';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') || '';

  if (contentType !== 'image/jpeg') {
    return NextResponse.json({ error: 'Content-Type must be image/jpeg' }, { status: 400 });
  }

  const videoId = request.headers.get('x-video-id');
  if (!videoId) {
    return NextResponse.json({ error: 'x-video-id header required' }, { status: 400 });
  }

  const imageBuffer = await request.arrayBuffer();
  const path = `${videoId}.jpg`;

  // Upload to Supabase Storage (upsert replaces existing)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the admin preview refreshes immediately
  const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ success: true, thumbnailUrl });
}

-- Video frame snapshots extracted from Bunny CDN at evenly-spaced intervals
CREATE TABLE IF NOT EXISTS public.project_video_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.project_videos(id) ON DELETE CASCADE,
  timestamp_seconds integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(video_id, timestamp_seconds)
);

ALTER TABLE public.project_video_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage video frames"
  ON public.project_video_frames FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access to video frames"
  ON public.project_video_frames FOR SELECT TO anon USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-frames', 'video-frames', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read video frames"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'video-frames');

CREATE POLICY "Authenticated users can upload video frames"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-frames');

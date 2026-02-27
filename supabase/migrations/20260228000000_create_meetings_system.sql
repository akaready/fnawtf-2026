-- ── Meetings config (iCal feed URL + sync state) ─────────────────────────
CREATE TABLE meetings_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ical_url TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Meetings ──────────────────────────────────────────────────────────────
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ical_uid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Meeting',
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  location TEXT,
  organizer_email TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'bot_scheduled', 'in_progress', 'completed', 'failed', 'no_video_link', 'cancelled')),
  recall_bot_id TEXT,
  recall_bot_status TEXT,
  transcript_status TEXT NOT NULL DEFAULT 'none'
    CHECK (transcript_status IN ('none', 'pending', 'ready', 'failed')),
  raw_event JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meetings_start_time ON meetings (start_time DESC);
CREATE INDEX idx_meetings_status ON meetings (status);
CREATE INDEX idx_meetings_ical_uid ON meetings (ical_uid);

-- ── Meeting attendees ─────────────────────────────────────────────────────
CREATE TABLE meeting_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  response_status TEXT,
  is_organizer BOOLEAN DEFAULT false,
  UNIQUE (meeting_id, email)
);

CREATE INDEX idx_meeting_attendees_email ON meeting_attendees (email);
CREATE INDEX idx_meeting_attendees_meeting ON meeting_attendees (meeting_id);

-- ── Meeting transcripts ───────────────────────────────────────────────────
CREATE TABLE meeting_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  raw_transcript JSONB NOT NULL,
  formatted_text TEXT,
  duration_seconds INTEGER,
  word_count INTEGER,
  speaker_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Meeting <-> Company/Contact relationships ─────────────────────────────
CREATE TABLE meeting_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  matched_email TEXT,
  match_type TEXT NOT NULL DEFAULT 'auto'
    CHECK (match_type IN ('auto', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meeting_relationships_client ON meeting_relationships (client_id);
CREATE INDEX idx_meeting_relationships_contact ON meeting_relationships (contact_id);
CREATE INDEX idx_meeting_relationships_meeting ON meeting_relationships (meeting_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE meetings_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_meetings_config" ON meetings_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_meetings" ON meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_meeting_attendees" ON meeting_attendees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_meeting_transcripts" ON meeting_transcripts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_meeting_relationships" ON meeting_relationships FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role needs access for webhook handler (implicit bypass for service_role)

export type MeetingStatus =
  | 'upcoming'
  | 'bot_scheduled'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_video_link'
  | 'cancelled';

export type TranscriptStatus = 'none' | 'pending' | 'ready' | 'failed';
export type MatchType = 'auto' | 'manual';

export interface MeetingRow {
  id: string;
  ical_uid: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  meeting_url: string | null;
  location: string | null;
  organizer_email: string | null;
  status: MeetingStatus;
  recall_bot_id: string | null;
  recall_bot_status: string | null;
  transcript_status: TranscriptStatus;
  raw_event: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendeeRow {
  id: string;
  meeting_id: string;
  email: string;
  display_name: string | null;
  response_status: string | null;
  is_organizer: boolean;
}

export interface TranscriptWord {
  text: string;
  start_time: number;
  end_time: number;
}

export interface TranscriptSegment {
  speaker: string;
  words: TranscriptWord[];
}

export interface MeetingTranscriptRow {
  id: string;
  meeting_id: string;
  raw_transcript: TranscriptSegment[];
  formatted_text: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  speaker_count: number | null;
  created_at: string;
}

export interface MeetingRelationshipRow {
  id: string;
  meeting_id: string;
  client_id: string | null;
  contact_id: string | null;
  matched_email: string | null;
  match_type: MatchType;
  created_at: string;
}

export interface MeetingsConfigRow {
  id: string;
  ical_url: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Joined type for the meetings list UI */
export interface MeetingWithRelations extends MeetingRow {
  meeting_attendees: MeetingAttendeeRow[];
  meeting_relationships: (MeetingRelationshipRow & {
    clients: { id: string; name: string; logo_url: string | null } | null;
    contacts: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
    } | null;
  })[];
  meeting_transcripts: MeetingTranscriptRow | null;
}

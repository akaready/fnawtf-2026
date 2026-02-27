# Google OAuth + Calendar API Migration

## Context

The admin currently uses email/password auth and an iCal feed for calendar sync. We're upgrading to:
- **Google OAuth as the sole admin login** (replaces email/password)
- **Google Calendar API v3** for richer event data, multi-calendar support, and incremental sync (replaces iCal feed)
- Keep all existing meetings UI, Recall.AI integration, and attendee matching unchanged

---

## Manual Prerequisites (before code)

### Google Cloud Console
1. Create/select project at console.cloud.google.com
2. Enable **Google Calendar API** (APIs & Services → Library)
3. Configure **OAuth consent screen** (External, app name "Friends 'n Allies Admin", add scope `calendar.readonly`)
4. Add test users while in "Testing" status
5. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URI: `https://ipzfnpjkslormhbkkiys.supabase.co/auth/v1/callback`
   - Copy Client ID + Client Secret

### Supabase Dashboard
1. Authentication → Providers → Google → Enable
2. Paste Client ID and Client Secret
3. Authorized redirect URL is auto-managed by Supabase

### Env Vars (`.env.local` + Vercel)
```
GOOGLE_CLIENT_ID=<from cloud console>
GOOGLE_CLIENT_SECRET=<from cloud console>
```

---

## Step 1: DB Migration

**File**: `supabase/migrations/YYYYMMDD_google_oauth_calendar.sql`

```sql
-- Token storage (service-role only, no RLS policies)
create table public.google_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_tokens_user_id_key unique (user_id)
);
alter table public.google_tokens enable row level security;

-- Extend meetings_config for Google sync
alter table public.meetings_config
  add column if not exists sync_source text not null default 'ical',
  add column if not exists google_sync_token text,
  add column if not exists google_calendar_ids text[] default '{}',
  add column if not exists user_id uuid references auth.users(id),
  alter column ical_url drop not null;

-- Extend meetings for Google event IDs
alter table public.meetings
  add column if not exists google_event_id text,
  add column if not exists google_calendar_id text,
  add column if not exists conference_url text,
  alter column ical_uid drop not null;

create unique index if not exists meetings_google_event_calendar_idx
  on public.meetings (google_event_id, google_calendar_id)
  where google_event_id is not null;
```

**Types to update**: `src/types/meetings.ts` — add `google_event_id`, `google_calendar_id`, `conference_url` to `MeetingRow`; update `MeetingsConfigRow` with new fields. Also update `src/types/database.types.ts`.

---

## Step 2: Auth Callback Route

**New file**: `src/app/auth/callback/route.ts`

- Reads `code` query param from Supabase OAuth redirect
- Calls `supabase.auth.exchangeCodeForSession(code)`
- Extracts `session.provider_token` and `session.provider_refresh_token` — **this is the only chance to capture them**
- Stores both in `google_tokens` table via service client (upsert on `user_id`)
- Redirects to `/admin/meetings`

---

## Step 3: Login Page — Google Only

**Modify**: `src/app/admin/login/page.tsx`

- Remove the email/password form entirely
- Single "Sign in with Google" button (`btn-primary` style)
- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, scopes: 'https://www.googleapis.com/auth/calendar.readonly', queryParams: { access_type: 'offline', prompt: 'consent' } } })`
- `prompt: 'consent'` + `access_type: 'offline'` are required to get a refresh token

---

## Step 4: Token Management

**New file**: `src/lib/google-tokens.ts`

- `getValidAccessToken(userId)` — fetches from `google_tokens` table, checks `expires_at`, refreshes via Google's token endpoint if <5min remaining, stores new token
- Uses `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars for refresh
- Handles refresh failures gracefully (token revoked, etc.)

---

## Step 5: Google Calendar API Client

**New file**: `src/lib/google-calendar.ts`

Raw `fetch()` against Google Calendar REST API (no npm dependency needed):

- `listCalendars(accessToken)` — `GET /users/me/calendarList` → returns all user calendars
- `listEvents(accessToken, calendarId, { syncToken?, timeMin?, timeMax? })` — `GET /calendars/{id}/events` with pagination support + incremental `syncToken`
- Handles `410 Gone` (sync token expired → caller must full-sync)
- Types: `GoogleCalendarEvent`, `CalendarListEntry`

Key improvements over iCal:
- `conferenceData.entryPoints[].uri` gives Meet/Zoom URLs directly (no regex)
- `attendees[]` with `responseStatus`, `displayName`, `email` are structured
- `syncToken` means we only fetch changes, not all events every time

---

## Step 6: Rewrite Sync Logic

**Modify**: `src/app/admin/actions.ts` — `triggerCalendarSync()`

New flow:
1. `requireAuth()` → get `userId`
2. `getValidAccessToken(userId)` → get fresh Google token
3. Load `meetings_config` → get `google_calendar_ids` and `google_sync_token`
4. For each calendar, call `listEvents()` with sync token (incremental) or full sync
5. Map Google events to meetings table (upsert on `google_event_id + google_calendar_id`)
6. Extract `conferenceData` for meeting URLs
7. Schedule Recall bots for future meetings with video links (same as current)
8. Run attendee matching (same as current)
9. Store returned `nextSyncToken` in `meetings_config`

Also update `saveMeetingsConfig()` for the new Google-based config.

**Modify**: `src/app/api/admin/meetings/sync/route.ts` — share the same sync core function.

---

## Step 7: MeetingsManager Setup Screen

**Modify**: `src/app/admin/_components/MeetingsManager.tsx`

Replace the iCal URL input setup screen with:
- If no Google tokens found → show "Sign in with Google to connect your calendar" (redirect to login)
- If tokens exist but no calendars selected → show calendar picker (checkboxes for each calendar from `listCalendars()`)
- If configured → show current behavior (table, tabs, sync button)

The connected state header subtitle changes from "Auto-syncs hourly" to show which calendars are synced.

---

## Step 8: Middleware (Recommended)

**New file**: `src/middleware.ts`

Standard Supabase session refresh middleware — refreshes auth cookies on every `/admin/*` request. Prevents stale sessions.

---

## Files Summary

**New files:**
- `src/app/auth/callback/route.ts` — OAuth callback
- `src/lib/google-calendar.ts` — Google Calendar API client
- `src/lib/google-tokens.ts` — Token refresh helper
- `src/middleware.ts` — Session refresh middleware
- `supabase/migrations/YYYYMMDD_google_oauth_calendar.sql`

**Modified files:**
- `src/app/admin/login/page.tsx` — Google-only login
- `src/app/admin/actions.ts` — rewrite `triggerCalendarSync` + `saveMeetingsConfig`
- `src/app/admin/_components/MeetingsManager.tsx` — calendar picker setup screen
- `src/app/api/admin/meetings/sync/route.ts` — use new sync logic
- `src/types/meetings.ts` — new fields
- `src/types/database.types.ts` — new table + column types

**Kept unchanged:**
- `src/lib/recall.ts` — Recall.AI integration
- `src/lib/meetings/matchAttendees.ts` — attendee matching
- `src/app/api/webhooks/recall/route.ts` — Recall webhooks
- `src/app/admin/_components/MeetingPanel.tsx` — detail panel
- `src/app/admin/_components/TranscriptViewer.tsx`
- `src/app/admin/layout.tsx` — layout auth check works for OAuth too

**Deprecated (keep for now, remove later):**
- `src/lib/calendar.ts` — iCal parser (replaced by `google-calendar.ts`)

---

## Implementation Order

1. Migration + types
2. Auth callback route
3. Login page (Google only)
4. Token management (`google-tokens.ts`)
5. Google Calendar client (`google-calendar.ts`)
6. Sync logic rewrite (`actions.ts`)
7. MeetingsManager setup screen (calendar picker)
8. Middleware
9. Sync API route update

---

## Verification

1. **Login**: Visit /admin/login → click "Sign in with Google" → consent screen → redirects back to admin with session
2. **Token storage**: Check `google_tokens` table has `access_token` + `refresh_token` for the user
3. **Calendar list**: MeetingsManager setup shows all user calendars
4. **Event sync**: Select calendars → Sync Now → events appear in table with titles, times, attendees, Meet links
5. **Incremental sync**: Second sync should use `syncToken` and be faster
6. **Recall bots**: Future meetings with video links get bots scheduled (check Recall dashboard)
7. **Token refresh**: Wait >1 hour, sync again → should auto-refresh token and succeed
8. **Attendee matching**: Events with known contact emails auto-link in relationships

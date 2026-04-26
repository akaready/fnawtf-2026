# Supabase Backups

Daily full backups (DB + Storage objects) run via GitHub Actions and stick around for 90 days. There's also a weekly restore drill that proves the latest backup actually restores.

## What runs when

| Workflow | Schedule | What it does |
| --- | --- | --- |
| `Daily Supabase Backup` | 03:15 UTC daily | Dumps DB (schema/data/roles via `supabase db dump`), syncs every Storage bucket via rclone, tars + uploads as a 90-day artifact |
| `Weekly Backup Restore Drill` | Mondays 06:00 UTC | Pulls the latest backup, restores into a throwaway Postgres, asserts row counts on `proposals`/`contracts`/`companies`/`contacts`, verifies the Storage tarball is non-empty |

Trigger either manually:

```bash
gh workflow run "Daily Supabase Backup"
gh workflow run "Weekly Backup Restore Drill"
gh run watch
```

`video-frames` bucket is skipped (regeneratable). To change the skip list, edit `SKIP_BUCKETS` in [backup-supabase.yml](../.github/workflows/backup-supabase.yml).

## Restoring from a backup

### 1. Find the run you want

```bash
gh run list --workflow=backup-supabase.yml --limit 90
gh run download <run-id> --dir ./restore/
cd ./restore/supabase-backup-<id>/
```

### 2. Restore the database

```bash
gunzip db/schema.sql.gz db/data.sql.gz db/roles.sql.gz

# Against a fresh/throwaway target — DON'T point this at production unless you mean it
psql "$TARGET_DB_URL" -f db/roles.sql
psql "$TARGET_DB_URL" -f db/schema.sql
psql "$TARGET_DB_URL" -f db/data.sql
```

### 3. Restore Storage objects

```bash
tar -xzf storage.tar.gz -C ./storage-restore/
# Configure 'target' in your local rclone.conf as the destination Supabase S3 endpoint
for b in ./storage-restore/*/; do
  bucket=$(basename "$b")
  rclone copy "$b" "target:$bucket" --progress
done
```

## Required GitHub secrets

| Secret | Where to find it |
| --- | --- |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → **Direct connection** (port 5432) |
| `SUPABASE_PROJECT_REF` | Project ref (in dashboard URL: `app.supabase.com/project/<ref>`) |
| `SUPABASE_S3_ENDPOINT` | Project Settings → Storage → S3 Connection → "Endpoint" |
| `SUPABASE_S3_REGION` | Same panel — "Region" |
| `SUPABASE_S3_ACCESS_KEY_ID` | Same panel → "New access key" → save the access key ID |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | Same — secret only shown once; copy immediately |

## Caveats

- **Logical dumps, not WAL PITR**: recovery granularity is 24 hours, not seconds. Daily snapshots, 90 days back.
- **Bunny CDN videos** are out of scope — they live on Bunny, not Supabase.
- **Artifact size cap**: GitHub free-tier private repos get 2 GB of artifact storage. If we blow past that, the fix is to push `storage.tar.gz` to Backblaze B2 (10 GB free) instead of uploading as an artifact — one-step swap in the workflow.
- **Sensitivity**: artifacts include `auth.users` (bcrypt hashes) and PII. Repo is private, GitHub encrypts at rest.

## Porting to another Supabase project

1. Copy `.github/workflows/backup-supabase.yml` and `.github/workflows/backup-restore-drill.yml` into the new repo.
2. Set the six secrets above (use the new project's values).
3. Edit `SKIP_BUCKETS` in `backup-supabase.yml` and the `for t in ...` table list in `backup-restore-drill.yml` to match the new project's tables.
4. Run both workflows manually once to verify.

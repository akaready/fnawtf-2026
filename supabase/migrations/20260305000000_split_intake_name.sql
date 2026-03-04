-- Split intake_submissions.name into first_name, last_name + add nickname

-- Add new columns (nullable first for migration)
alter table public.intake_submissions
  add column first_name text,
  add column last_name text,
  add column nickname text;

-- Migrate existing data: split name on first space
update public.intake_submissions
set
  first_name = case
    when position(' ' in name) > 0 then left(name, position(' ' in name) - 1)
    else name
  end,
  last_name = case
    when position(' ' in name) > 0 then substring(name from position(' ' in name) + 1)
    else ''
  end
where name is not null;

-- Set defaults for any nulls
update public.intake_submissions
set first_name = '' where first_name is null;

update public.intake_submissions
set last_name = '' where last_name is null;

-- Now enforce NOT NULL
alter table public.intake_submissions
  alter column first_name set not null,
  alter column first_name set default '',
  alter column last_name set not null,
  alter column last_name set default '';

-- Drop old column
alter table public.intake_submissions drop column name;

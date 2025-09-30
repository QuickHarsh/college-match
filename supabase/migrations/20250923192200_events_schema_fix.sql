-- Align events schema with frontend expectations and admin pages
-- Add missing columns if they don't exist and index by start_time

-- Ensure events table exists (noop if it does)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  location text null,
  banner_image_url text null,
  start_time timestamptz null,
  end_time timestamptz null
);

-- Add columns if they are missing (for older schema that used event_date, etc.)
alter table public.events add column if not exists banner_image_url text;
alter table public.events add column if not exists start_time timestamptz;
alter table public.events add column if not exists end_time timestamptz;
alter table public.events add column if not exists location text;

-- Optional: keep legacy event_date; if exists and start_time is null, you may want to backfill later
-- Example backfill (commented):
-- update public.events set start_time = coalesce(start_time, event_date) where start_time is null and event_date is not null;

-- Index for ordering/filtering by time
create index if not exists events_start_time_idx on public.events (start_time);

-- RLS: ensure select for all authenticated users (if not already)
alter table public.events enable row level security;
DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "events read" ON public.events;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "events read" ON public.events FOR SELECT TO authenticated USING (true);
END $$;

-- Optionally, allow admins to write (covered by existing admin policy in another migration),
-- but we add a permissive insert/update for admins here too to avoid conflicts across environments.
DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "events admin write" ON public.events;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "events admin write" ON public.events
    FOR ALL TO authenticated
    USING (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
    WITH CHECK (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
END $$;

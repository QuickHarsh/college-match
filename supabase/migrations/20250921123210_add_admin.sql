-- Add is_admin to profiles
alter table if exists public.profiles
  add column if not exists is_admin boolean not null default false;

-- Optional: simple helper policy suggestions (adjust if you already manage RLS)
-- Ensure only admins can insert/update/delete events and interest_clubs
-- Uncomment if needed and if RLS is enabled for these tables
--
-- drop policy if exists "events admin write" on public.events;
-- create policy "events admin write" on public.events
--   for all
--   using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
--   with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
--
-- drop policy if exists "clubs admin write" on public.interest_clubs;
-- create policy "clubs admin write" on public.interest_clubs
--   for all
--   using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
--   with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

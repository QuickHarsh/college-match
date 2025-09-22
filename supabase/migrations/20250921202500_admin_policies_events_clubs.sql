-- Enable RLS and enforce admin-only writes on events and interest_clubs

-- Ensure tables exist (no-op if they already exist)
-- Note: adjust columns if your schema differs
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  location text null,
  banner_image_url text null,
  start_time timestamptz null,
  end_time timestamptz null
);

create table if not exists public.interest_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  icon text null,
  category text null
);

-- Enable RLS
alter table public.events enable row level security;
alter table public.interest_clubs enable row level security;

-- Public can read
do $$
begin
  begin
    drop policy if exists "events read" on public.events;
  exception when undefined_object then null; end;
  create policy "events read" on public.events for select using (true);
end $$;

do $$
begin
  begin
    drop policy if exists "clubs read" on public.interest_clubs;
  exception when undefined_object then null; end;
  create policy "clubs read" on public.interest_clubs for select using (true);
end $$;

-- Admin-only write
do $$
begin
  begin
    drop policy if exists "events admin write" on public.events;
  exception when undefined_object then null; end;
  create policy "events admin write" on public.events
    for all
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
    with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
end $$;

do $$
begin
  begin
    drop policy if exists "clubs admin write" on public.interest_clubs;
  exception when undefined_object then null; end;
  create policy "clubs admin write" on public.interest_clubs
    for all
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
    with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
end $$;

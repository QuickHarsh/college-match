-- Create announcements table
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid null
);

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- Enable RLS
alter table public.announcements enable row level security;

-- Policies
-- Everyone can read active announcements
do $$
begin
  begin
    drop policy if exists "announcements read active" on public.announcements;
  exception when undefined_object then
    null;
  end;
  create policy "announcements read active" on public.announcements
    for select
    using (active = true);
end $$;

-- Admins can read all announcements
do $$
begin
  begin
    drop policy if exists "announcements read admin" on public.announcements;
  exception when undefined_object then
    null;
  end;
  create policy "announcements read admin" on public.announcements
    for select
    using (exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
    ));
end $$;

-- Only admins can insert/update/delete
do $$
begin
  begin
    drop policy if exists "announcements admin write" on public.announcements;
  exception when undefined_object then
    null;
  end;
  create policy "announcements admin write" on public.announcements
    for all
    using (exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    ))
    with check (exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    ));
end $$;

-- Helpful index
create index if not exists idx_announcements_active_created_at on public.announcements (active, created_at desc);

-- Trigger to auto-populate created_by from auth.uid() if null
create or replace function public.set_created_by_from_auth()
returns trigger as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_announcements_created_by on public.announcements;
create trigger trg_announcements_created_by
before insert on public.announcements
for each row
execute function public.set_created_by_from_auth();

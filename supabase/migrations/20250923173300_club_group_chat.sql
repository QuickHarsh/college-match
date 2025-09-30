-- Club Group Chat: messages + RLS and leave-club policy

-- Create club_messages table
create table if not exists public.club_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.interest_clubs(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.club_messages enable row level security;

-- Policies: only club members can read & write
-- Select messages if user is a member of the club
do $$
begin
  begin
    drop policy if exists "club messages readable by members" on public.club_messages;
  exception when undefined_object then null; end;
  create policy "club messages readable by members" on public.club_messages for select to authenticated
  using (exists (
    select 1 from public.club_members cm
    where cm.club_id = club_id and cm.user_id = auth.uid()
  ));
end $$;

-- Insert messages only if user is member and sender matches auth
do $$
begin
  begin
    drop policy if exists "club messages insert by members" on public.club_messages;
  exception when undefined_object then null; end;
  create policy "club messages insert by members" on public.club_messages for insert to authenticated
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_id and cm.user_id = auth.uid()
    )
  );
end $$;

-- Optional: prevent updates/deletes by users (allow admins only)
-- If you have an is_admin flag on profiles, you can enable the following:
-- do $$
-- begin
--   begin
--     drop policy if exists "club messages admin write" on public.club_messages;
--   exception when undefined_object then null; end;
--   create policy "club messages admin write" on public.club_messages for all to authenticated
--   using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
--   with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
-- end $$;

-- Ensure users can leave clubs: add delete policy on club_members
-- (Join policy exists; add leave policy explicitly)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_members;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
END $$;

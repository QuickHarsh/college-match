-- Announcements table + RLS + admin policy

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Everyone authenticated can read
DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "announcements read" ON public.announcements;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "announcements read" ON public.announcements FOR SELECT TO authenticated USING (true);
END $$;

-- Admin write (create/update/delete)
DO $$ BEGIN
  BEGIN
    DROP POLICY IF EXISTS "announcements admin write" ON public.announcements;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "announcements admin write" ON public.announcements
    FOR ALL TO authenticated
    USING (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true))
    WITH CHECK (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true));
END $$;

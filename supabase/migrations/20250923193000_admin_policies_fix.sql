-- Fix admin policies to reference profiles.user_id instead of profiles.id

DO $$ BEGIN
  -- events admin write
  BEGIN
    DROP POLICY IF EXISTS "events admin write" ON public.events;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "events admin write" ON public.events
    FOR ALL TO authenticated
    USING (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true))
    WITH CHECK (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true));
END $$;

DO $$ BEGIN
  -- clubs admin write
  BEGIN
    DROP POLICY IF EXISTS "clubs admin write" ON public.interest_clubs;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  CREATE POLICY "clubs admin write" ON public.interest_clubs
    FOR ALL TO authenticated
    USING (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true))
    WITH CHECK (exists (select 1 from public.profiles p where p.user_id = auth.uid() and coalesce(p.is_admin, false) = true));
END $$;

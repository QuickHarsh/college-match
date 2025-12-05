-- Create banners bucket
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Policy: Anyone can view banners
create policy "Banners are public"
  on storage.objects for select
  using ( bucket_id = 'banners' );

-- Policy: Authenticated users can upload banners (for now, restrict to admin in UI)
create policy "Authenticated users can upload banners"
  on storage.objects for insert
  with check ( bucket_id = 'banners' and auth.role() = 'authenticated' );

-- Policy: Users can update/delete their own uploads (or admins)
create policy "Users can update own banners"
  on storage.objects for update
  using ( bucket_id = 'banners' and auth.uid() = owner );

create policy "Users can delete own banners"
  on storage.objects for delete
  using ( bucket_id = 'banners' and auth.uid() = owner );

-- Create user_gallery table
create table if not exists public.user_gallery (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  image_url text not null,
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_gallery enable row level security;

-- Policies
create policy "Public gallery images are viewable by everyone"
  on public.user_gallery for select
  using ( (is_private = false) or (auth.uid() = user_id) );

create policy "Users can insert their own gallery images"
  on public.user_gallery for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own gallery images"
  on public.user_gallery for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own gallery images"
  on public.user_gallery for delete
  using ( auth.uid() = user_id );

-- Storage bucket for gallery (if not exists)
insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

create policy "Gallery images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'gallery-images' );

create policy "Users can upload gallery images"
  on storage.objects for insert
  with check ( bucket_id = 'gallery-images' and auth.uid() = owner );

create policy "Users can update their gallery images"
  on storage.objects for update
  using ( bucket_id = 'gallery-images' and auth.uid() = owner );

create policy "Users can delete their gallery images"
  on storage.objects for delete
  using ( bucket_id = 'gallery-images' and auth.uid() = owner );

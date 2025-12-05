-- Add banner_image_url to interest_clubs
alter table public.interest_clubs
add column if not exists banner_image_url text;

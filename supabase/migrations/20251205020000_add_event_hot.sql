-- Add is_hot to events
alter table public.events
add column if not exists is_hot boolean default false;

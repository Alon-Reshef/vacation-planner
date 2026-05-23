-- Vacation Plan — run this in Supabase Dashboard → SQL Editor → Run

-- Trips (one trip per project is typical)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  trip_name text not null default 'My Tropical Getaway',
  page_titles jsonb not null default '{"home":"Vacation Plan","hotels":"Hotels","admin":"Admin"}'::jsonb,
  created_at timestamptz not null default now()
);

-- User profiles (linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  display_name text not null,
  email text not null default '',
  role text not null check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null default '',
  address text not null default '',
  check_in date,
  check_out date,
  confirmation text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.travel_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  hotel_id uuid references public.hotels (id) on delete set null,
  activities text not null default '',
  travel_to_next text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_hotels_trip on public.hotels (trip_id);
create index if not exists idx_travel_days_trip on public.travel_days (trip_id);
create index if not exists idx_profiles_trip on public.profiles (trip_id);

-- Helpers for RLS
create or replace function public.current_trip_id ()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select trip_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role ()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.trips enable row level security;
alter table public.profiles enable row level security;
alter table public.hotels enable row level security;
alter table public.travel_days enable row level security;

-- Trips: anyone can read (guest view); admin can update
drop policy if exists "trips_select_all" on public.trips;
create policy "trips_select_all" on public.trips
  for select using (true);

drop policy if exists "trips_insert_auth" on public.trips;
create policy "trips_insert_auth" on public.trips
  for insert to authenticated with check (true);

drop policy if exists "trips_update_admin" on public.trips;
create policy "trips_update_admin" on public.trips
  for update to authenticated
  using (id = public.current_trip_id() and public.current_role() = 'admin');

-- Profiles: team members visible to same trip; admin manages invites
drop policy if exists "profiles_select_team" on public.profiles;
create policy "profiles_select_team" on public.profiles
  for select to authenticated
  using (trip_id = public.current_trip_id());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (trip_id = public.current_trip_id() and public.current_role() = 'admin');

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (
    trip_id = public.current_trip_id()
    and public.current_role() = 'admin'
    and role <> 'admin'
  );

-- Hotels
drop policy if exists "hotels_select_all" on public.hotels;
create policy "hotels_select_all" on public.hotels
  for select using (true);

drop policy if exists "hotels_insert_editors" on public.hotels;
create policy "hotels_insert_editors" on public.hotels
  for insert to authenticated
  with check (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

drop policy if exists "hotels_update_editors" on public.hotels;
create policy "hotels_update_editors" on public.hotels
  for update to authenticated
  using (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

drop policy if exists "hotels_delete_editors" on public.hotels;
create policy "hotels_delete_editors" on public.hotels
  for delete to authenticated
  using (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

-- Travel days
drop policy if exists "travel_days_select_all" on public.travel_days;
create policy "travel_days_select_all" on public.travel_days
  for select using (true);

drop policy if exists "travel_days_insert_editors" on public.travel_days;
create policy "travel_days_insert_editors" on public.travel_days
  for insert to authenticated
  with check (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

drop policy if exists "travel_days_update_editors" on public.travel_days;
create policy "travel_days_update_editors" on public.travel_days
  for update to authenticated
  using (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

drop policy if exists "travel_days_delete_editors" on public.travel_days;
create policy "travel_days_delete_editors" on public.travel_days
  for delete to authenticated
  using (
    trip_id = public.current_trip_id()
    and public.current_role() in ('admin', 'editor')
  );

-- Allow first admin to create their profile after signup
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Realtime (optional — enable in Database → Replication if needed)
-- alter publication supabase_realtime add table public.hotels;
-- alter publication supabase_realtime add table public.travel_days;
-- alter publication supabase_realtime add table public.trips;

-- Public table columns, defaults and constraints supplied on 2026-09-08.
-- auth.users is a minimal local stub, not Supabase Auth. The actual
-- handle_new_user() function body has not yet been supplied.
create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role text default 'client' check(role in ('client','staff','admin','owner')), phone text,
  created_at timestamptz not null default timezone('utc', now()), birthdate date, gender text,
  country text, province text, municipality text, house_number text,
  street_name text, subdivision_purok text, barangay text, zipcode text,
  username text unique, avatar_url text, region text
);
create table public.services (
  id uuid primary key default gen_random_uuid(), name text not null,
  description text, price numeric, created_at timestamptz not null default timezone('utc', now())
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null, time_slot text not null,
  status text default 'pending' check(status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default timezone('utc', now()), cancellation_reason text
);

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
grant select,insert,update,delete on public.profiles,public.services,public.appointments to anon,authenticated;
create policy "Public profiles are viewable by everyone" on public.profiles for select using(true);
create policy "Users can update own profile" on public.profiles for update using(auth.uid()=id);
create policy "Admins can update all profiles" on public.profiles for update using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')));
create policy "Allow staff admins and owners to delete profiles" on public.profiles for delete using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('staff','admin','owner')));
create policy "Services are viewable by everyone" on public.services for select using(true);
create policy "Clients can insert own appointments" on public.appointments for insert with check(auth.uid()=patient_id);
create policy "Clients can view own appointments" on public.appointments for select using(auth.uid()=patient_id);
create policy "Staff can update all appointments" on public.appointments for update using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('staff','admin','owner')));
create policy "Staff can view all appointments" on public.appointments for select using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('staff','admin','owner')));
create table public.clinic_gallery (
  id uuid primary key default gen_random_uuid(), title text, image_url text not null,
  category text, created_at timestamptz not null default now()
);

create policy "Gallery is viewable by everyone" on public.clinic_gallery for select using(true);

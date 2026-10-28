-- BEKIUZ BUILD project storage and read-only material catalog.
-- Apply only to a dedicated BEKIUZ BUILD Supabase project.
-- The browser can only access a user's own projects through Supabase Auth + RLS.

create extension if not exists pgcrypto;

create table if not exists public.house_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Mening uyim'
    check (char_length(title) between 1 and 120),
  plot_width numeric(7,2) not null check (plot_width between 6 and 100),
  plot_length numeric(7,2) not null check (plot_length between 8 and 200),
  house_width numeric(7,2) not null check (house_width between 4 and 30),
  house_length numeric(7,2) not null check (house_length between 4 and 40),
  floors smallint not null check (floors between 1 and 2),
  rooms smallint not null check (rooms between 2 and 5),
  roof_type text not null check (roof_type in ('gable', 'hip', 'flat')),
  project_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint house_project_fits_land check (
    house_width <= plot_width and house_length <= plot_length
  )
);

create index if not exists house_projects_user_updated_idx
  on public.house_projects (user_id, updated_at desc);

alter table public.house_projects enable row level security;

create policy "Users can read their own house projects"
  on public.house_projects for select
  using (auth.uid() = user_id);

create policy "Users can create their own house projects"
  on public.house_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own house projects"
  on public.house_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own house projects"
  on public.house_projects for delete
  using (auth.uid() = user_id);

create table if not exists public.material_catalog (
  id uuid primary key default gen_random_uuid(),
  material_code text not null unique,
  name_uz text not null,
  unit text not null,
  price_uzs bigint not null check (price_uzs >= 0),
  region text not null default 'O‘zbekiston',
  source_name text,
  source_url text,
  verified_at date,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_catalog_region_code_idx
  on public.material_catalog (region, material_code);

alter table public.material_catalog enable row level security;

create policy "Material catalogue is readable"
  on public.material_catalog for select
  using (true);

-- Intentionally no browser-facing INSERT/UPDATE/DELETE policies on material_catalog.
-- Only a trusted server/service role should update regional prices and their sources.

create or replace function public.bekiuz_build_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists house_projects_touch_updated_at on public.house_projects;
create trigger house_projects_touch_updated_at
  before update on public.house_projects
  for each row execute function public.bekiuz_build_touch_updated_at();

drop trigger if exists material_catalog_touch_updated_at on public.material_catalog;
create trigger material_catalog_touch_updated_at
  before update on public.material_catalog
  for each row execute function public.bekiuz_build_touch_updated_at();

comment on table public.house_projects is
  'BEKIUZ BUILD user-owned home-planning projects. Estimates in project_data are not construction approvals.';

comment on table public.material_catalog is
  'BEKIUZ BUILD material prices; source and verification date should be recorded for non-demo prices.';

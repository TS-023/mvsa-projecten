-- ============================================================
--  MVSA · Database setup voor Supabase
--  Plak dit in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Projecten tabel
create table if not exists public.projects (
  id                      uuid default gen_random_uuid() primary key,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),

  -- Naam
  projectnummer           text unique,
  projectnaam             text not null,
  alternatieve_naam       text,

  -- Algemeen
  opgave                  text,
  project_type            text,
  functie                 text,
  verkregen_dmv           text,
  fase                    text,

  -- Link
  projectmap              text,

  -- Locatie
  land                    text default 'Nederland',
  provincie               text,
  stad                    text,
  straat                  text,
  huisnummer              text,
  postcode                text,

  -- Opdrachtgever
  opdrachtgever           text,
  gedelegeerd_opdrachtgever text,
  contactpersoon          text,
  telefoon                text,
  email                   text,

  -- Metrage
  totaal_bvo              numeric,
  m_wonen                 numeric,
  m_kantoor               numeric,
  m_commercieel           numeric,
  m_shortstay             numeric,
  m_publiek               numeric,
  m_onderwijs             numeric,

  -- Mobiliteit
  autoparkeren            numeric,
  fietsparkeren           numeric,
  ratio_wonen             text,

  -- Duurzaamheid
  npg_score               text,
  daktuin                 numeric,
  zonnepanelen            numeric,
  duurzaamheidslabel      text,

  -- Bouw & erkenning
  bouwhoogte              numeric,
  tevredenheid            numeric,
  awards                  numeric
);

-- Werknemers tabel
create table if not exists public.employees (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  naam        text not null,
  rol         text,
  score       numeric default 0,
  projecten   numeric default 0,
  awards      numeric default 0
);

-- RLS (Row Level Security) — iedereen kan lezen, ingelogde users schrijven
-- Voor nu: volledig open (je kunt dit later aanscherpen met auth)
alter table public.projects  enable row level security;
alter table public.employees enable row level security;

create policy "Iedereen kan lezen"       on public.projects  for select using (true);
create policy "Iedereen kan schrijven"   on public.projects  for all    using (true);
create policy "Iedereen kan lezen emp"   on public.employees for select using (true);
create policy "Iedereen kan schrijven emp" on public.employees for all  using (true);

-- Testdata: 3 voorbeeldwerknemers
insert into public.employees (naam, rol, score, projecten, awards) values
  ('Sophie van Dam',    'Architect',          47, 12, 3),
  ('Joris Bakker',      'Stedenbouwkundige',  41,  9, 2),
  ('Femke de Vries',    'Interieur Designer', 38,  7, 1)
on conflict do nothing;

-- Testproject
insert into public.projects (projectnummer, projectnaam, stad, fase, opgave, totaal_bvo) values
  ('24375', 'Galgenwaard', 'Utrecht', 'VO', 'Architectuur', 45000)
on conflict (projectnummer) do nothing;

-- Opleverdatum toevoegen (voer dit uit als je de tabel al hebt aangemaakt)
alter table public.projects add column if not exists opleverdatum date;

-- ============================================================
--  AUTHENTICATIE & GEBRUIKERS
--  Voer dit uit in Supabase SQL Editor
-- ============================================================

-- Gebruikersprofiel tabel (gekoppeld aan Supabase Auth)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  created_at  timestamptz default now(),
  naam        text not null,
  email       text not null,
  rol         text default 'medewerker',
  team        text default 'Ontwerp',
  status      text default 'pending', -- pending | approved | rejected
  employee_id uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  approved_by text
);

-- RLS voor profiles
alter table public.profiles enable row level security;

-- Iedereen mag zijn eigen profiel lezen
create policy "Eigen profiel lezen"
  on public.profiles for select
  using (auth.uid() = id);

-- Beheerder mag alles lezen
create policy "Beheerder leest alles"
  on public.profiles for select
  using (true);

-- Gebruiker mag eigen profiel aanmaken bij registratie
create policy "Profiel aanmaken bij registratie"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Beheerder mag profielen updaten (goedkeuren/afkeuren)
create policy "Beheerder mag updaten"
  on public.profiles for update
  using (true);

-- Voeg created_by toe aan projects tabel
alter table public.projects
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Index voor snelle lookup
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists projects_created_by_idx on public.projects(created_by);

-- Fix RLS: zorg dat profiles insert altijd werkt ook zonder email confirmatie
-- Voer dit uit als de registratie nog steeds problemen geeft
drop policy if exists "Profiel aanmaken bij registratie" on public.profiles;
create policy "Profiel aanmaken bij registratie"
  on public.profiles for insert
  with check (true);

-- Zorg dat eigen profiel altijd gelezen kan worden
drop policy if exists "Eigen profiel lezen" on public.profiles;
create policy "Eigen profiel lezen"
  on public.profiles for select
  using (true);

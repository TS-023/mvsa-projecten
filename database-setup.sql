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
  awards                  numeric,

  -- Datum
  opleverdatum            date,

  -- Aangemaakte door
  created_by              uuid references auth.users(id) on delete set null
);

-- Werknemers tabel
create table if not exists public.employees (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  naam        text not null,
  rol         text,
  team        text,
  score       numeric default 0,
  projecten   numeric default 0,
  awards      numeric default 0
);

-- Gebruikersprofiel tabel (gekoppeld aan Supabase Auth)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  created_at  timestamptz default now(),
  naam        text not null,
  email       text not null,
  rol         text default 'medewerker',
  team        text default 'Ontwerp',
  status      text default 'pending', -- pending | approved | rejected
  is_admin    boolean default false,  -- beheerder-vlag
  employee_id uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  approved_by text
);

-- ============================================================
--  RLS — Row Level Security
-- ============================================================

-- Projects: iedereen leest, alleen ingelogde goedgekeurde gebruikers schrijven
alter table public.projects enable row level security;

drop policy if exists "Iedereen kan lezen"     on public.projects;
drop policy if exists "Iedereen kan schrijven" on public.projects;

create policy "Projecten lezen"
  on public.projects for select
  using (true);

create policy "Projecten schrijven"
  on public.projects for insert
  with check (auth.uid() is not null);

create policy "Projecten updaten"
  on public.projects for update
  using (auth.uid() is not null);

create policy "Projecten verwijderen"
  on public.projects for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Employees: iedereen leest, alleen ingelogden schrijven, alleen admins verwijderen
alter table public.employees enable row level security;

drop policy if exists "Iedereen kan lezen emp"     on public.employees;
drop policy if exists "Iedereen kan schrijven emp" on public.employees;

create policy "Werknemers lezen"
  on public.employees for select
  using (true);

create policy "Werknemers aanmaken"
  on public.employees for insert
  with check (auth.uid() is not null);

create policy "Werknemers updaten"
  on public.employees for update
  using (auth.uid() is not null);

create policy "Werknemers verwijderen"
  on public.employees for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Profiles: eigen profiel lezen/aanmaken, admins lezen/updaten alles
alter table public.profiles enable row level security;

drop policy if exists "Eigen profiel lezen"              on public.profiles;
drop policy if exists "Beheerder leest alles"            on public.profiles;
drop policy if exists "Profiel aanmaken bij registratie" on public.profiles;
drop policy if exists "Beheerder mag updaten"            on public.profiles;

-- Iedereen mag zijn eigen profiel lezen; admins mogen alles lezen
create policy "Profielen lezen"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- Registratie: altijd toegestaan (ook vóór email-bevestiging)
create policy "Profiel aanmaken bij registratie"
  on public.profiles for insert
  with check (true);

-- Eigen profiel updaten (naam, team, etc.); admins mogen alles updaten
create policy "Profielen updaten"
  on public.profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- Alleen admins mogen profielen verwijderen
create policy "Profielen verwijderen"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- ============================================================
--  INDEXES
-- ============================================================
create index if not exists profiles_status_idx   on public.profiles(status);
create index if not exists profiles_admin_idx    on public.profiles(is_admin);
create index if not exists projects_created_idx  on public.projects(created_by);

-- ============================================================
--  TESTDATA (sla over als tabellen al gevuld zijn)
-- ============================================================
insert into public.employees (naam, rol, score, projecten, awards) values
  ('Sophie van Dam',    'Architect',          47, 12, 3),
  ('Joris Bakker',      'Stedenbouwkundige',  41,  9, 2),
  ('Femke de Vries',    'Interieur Designer', 38,  7, 1)
on conflict do nothing;

insert into public.projects (projectnummer, projectnaam, stad, fase, opgave, totaal_bvo) values
  ('24375', 'Galgenwaard', 'Utrecht', 'VO', 'Architectuur', 45000)
on conflict (projectnummer) do nothing;

-- ============================================================
--  BESTAANDE DATABASE MIGRATIE
--  Voer dit uit als je de tabel al had zonder is_admin kolom
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean default false;

-- Stel jezelf in als beheerder (vervang het e-mailadres):
-- update public.profiles set is_admin = true where email = 'jouw@email.nl';

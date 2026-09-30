-- Acreditación de planteles por link de DT
-- Ejecutar en Supabase → SQL Editor
-- Nota: la foto del DNI NO se guarda; solo se usa en el celular para OCR/autocompletar.

create table if not exists accreditation_portals (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  name text not null,
  logo_path text,
  created_at timestamptz not null default now()
);

create table if not exists accreditation_portal_teams (
  portal_id uuid not null references accreditation_portals(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  primary key (portal_id, team_id)
);

create table if not exists accreditation_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dni text not null,
  birth_date date not null,
  jersey_number int not null check (jersey_number >= 1 and jersey_number <= 99),
  dni_photo_path text,
  created_at timestamptz not null default now(),
  unique (team_id, dni),
  unique (team_id, jersey_number)
);

create table if not exists accreditation_staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  role text not null default 'dt' check (role in ('dt', 'ayudante', 'delegado', 'medico', 'otro')),
  first_name text not null,
  last_name text not null,
  dni text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  unique (team_id, role)
);

create index if not exists accreditation_players_team_idx on accreditation_players(team_id);
create index if not exists accreditation_staff_team_idx on accreditation_staff(team_id);
create index if not exists accreditation_portals_token_idx on accreditation_portals(token);

alter table accreditation_portals enable row level security;
alter table accreditation_portal_teams enable row level security;
alter table accreditation_players enable row level security;
alter table accreditation_staff enable row level security;

-- Coordinador autenticado: CRUD completo
create policy "Coordinador lee portales"
  on accreditation_portals for select
  using (auth.role() = 'authenticated');
create policy "Coordinador escribe portales"
  on accreditation_portals for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Coordinador lee portal_teams"
  on accreditation_portal_teams for select
  using (auth.role() = 'authenticated');
create policy "Coordinador escribe portal_teams"
  on accreditation_portal_teams for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Coordinador lee jugadores"
  on accreditation_players for select
  using (auth.role() = 'authenticated');
create policy "Coordinador escribe jugadores"
  on accreditation_players for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Coordinador lee staff"
  on accreditation_staff for select
  using (auth.role() = 'authenticated');
create policy "Coordinador escribe staff"
  on accreditation_staff for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- No hace falta bucket de fotos de DNI (solo se guardan datos de texto).

-- Ejecutar en Supabase → SQL Editor
-- Luego crear usuario en Authentication → Users (email + contraseña del coordinador)

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists site_documents (
  key text primary key,
  storage_path text not null,
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null check (category in ('masculino', 'femenino')),
  year_label text not null,
  group_name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (slug, category, year_label)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('masculino', 'femenino')),
  year_label text not null,
  phase text not null check (phase in ('grupos', 'cruces')),
  round_label text,
  home_team_id uuid not null references teams(id) on delete restrict,
  away_team_id uuid not null references teams(id) on delete restrict,
  home_score int,
  away_score int,
  kickoff_at timestamptz not null,
  court text not null default 'Cancha 1',
  status text not null default 'programado' check (status in ('programado', 'en_juego', 'finalizado')),
  created_at timestamptz not null default now()
);

alter table gallery_photos enable row level security;
alter table site_documents enable row level security;
alter table teams enable row level security;
alter table matches enable row level security;

create policy "Lectura pública galería"
  on gallery_photos for select
  using (true);

create policy "Coordinador escribe galería"
  on gallery_photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Lectura pública documentos"
  on site_documents for select
  using (true);

create policy "Coordinador escribe documentos"
  on site_documents for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Lectura pública equipos"
  on teams for select
  using (true);

create policy "Coordinador escribe equipos"
  on teams for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Lectura pública partidos"
  on matches for select
  using (true);

create policy "Coordinador escribe partidos"
  on matches for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Equipos de prueba — categoría masculino 2015
insert into teams (name, slug, category, year_label, group_name, sort_order) values
  ('ATLETICO CERES A', 'atletico-ceres-a', 'masculino', '2015', 'A', 1),
  ('CENTRAL ARGENTINO A', 'central-argentino-a', 'masculino', '2015', 'A', 2),
  ('CLUB ATLETICO TOSTADO A', 'club-atletico-tostado-a', 'masculino', '2015', 'A', 3),
  ('UNION Y JUVENTUD DE BANDERA A', 'union-juventud-bandera-a', 'masculino', '2015', 'A', 4),
  ('ATLETICO CERES B', 'atletico-ceres-b', 'masculino', '2015', 'B', 5),
  ('CENTRAL ARGENTINO B', 'central-argentino-b', 'masculino', '2015', 'B', 6),
  ('CLUB ATLETICO TOSTADO B', 'club-atletico-tostado-b', 'masculino', '2015', 'B', 7),
  ('UNION Y JUVENTUD DE BANDERA B', 'union-juventud-bandera-b', 'masculino', '2015', 'B', 8),
  ('SAN LORENZO DE TOSTADO A', 'san-lorenzo-tostado-a', 'masculino', '2015', 'C', 9),
  ('LEONCITAS', 'leoncitas', 'masculino', '2015', 'C', 10),
  ('CLUB ATLETICO CERES', 'club-atletico-ceres', 'masculino', '2015', 'C', 11)
on conflict (slug, category, year_label) do nothing;

-- Storage → New bucket: reglamento (public)
-- Storage → New bucket: galeria (public)
-- Policies en cada bucket:
--   SELECT: public
--   INSERT/UPDATE/DELETE: authenticated

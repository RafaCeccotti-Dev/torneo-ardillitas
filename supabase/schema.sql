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

alter table gallery_photos enable row level security;
alter table site_documents enable row level security;

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

-- Storage → New bucket: reglamento (public)
-- Storage → New bucket: galeria (public)
-- Policies en cada bucket:
--   SELECT: public
--   INSERT/UPDATE/DELETE: authenticated

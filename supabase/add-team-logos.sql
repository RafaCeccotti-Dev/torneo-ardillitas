-- Ejecutar en Supabase → SQL Editor
-- Agrega escudo a equipos y crea el bucket de storage

alter table teams
  add column if not exists logo_path text;

-- Storage → New bucket: escudos (public)
-- Policies en el bucket escudos:
--   SELECT: public (o policy: true)
--   INSERT/UPDATE/DELETE: authenticated

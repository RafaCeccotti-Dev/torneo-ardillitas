-- Límites de acreditación: hasta 15 jugadores y hasta 2 profes/delegados por equipo.
-- Ejecutar en Supabase → SQL Editor.
-- Se quita unique(team_id, role) para permitir 2 roles distintos (o el mismo) sin pisarse.

alter table accreditation_staff
  drop constraint if exists accreditation_staff_team_id_role_key;

-- Si el nombre del constraint difiere en tu DB, listá con:
-- select conname from pg_constraint where conrelid = 'accreditation_staff'::regclass;

-- Bloqueo por categoría: cuando el club envía la acreditación al coordinador,
-- esa categoría queda cerrada (no se puede agregar ni borrar jugadores/staff).
-- Los mismos DNI pueden repetirse en OTRAS categorías del mismo club.

create table if not exists accreditation_submissions (
  team_id uuid primary key references teams(id) on delete cascade,
  portal_id uuid not null references accreditation_portals(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  player_count int not null default 0,
  staff_count int not null default 0
);

create index if not exists accreditation_submissions_portal_idx
  on accreditation_submissions(portal_id);

alter table accreditation_submissions enable row level security;

drop policy if exists "Coordinador lee submissions" on accreditation_submissions;
create policy "Coordinador lee submissions"
  on accreditation_submissions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Coordinador escribe submissions" on accreditation_submissions;
create policy "Coordinador escribe submissions"
  on accreditation_submissions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

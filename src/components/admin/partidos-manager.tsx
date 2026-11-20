"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { standingsConfig, tournamentCategories } from "@/lib/tournament-categories";
import { formatKickoff, splitKickoff } from "@/lib/kickoff";
import { splitRoundAndPens } from "@/lib/penalties";

type TeamRow = {
  id: string;
  name: string;
  group_name: string;
};

type MatchRow = {
  id: string;
  category: string;
  year_label: string;
  phase: "grupos" | "cruces";
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
  court: string;
  status: "programado" | "en_juego" | "finalizado";
  home_team?: { id: string; name: string; group_name: string } | { id: string; name: string; group_name: string }[] | null;
  away_team?: { id: string; name: string; group_name: string } | { id: string; name: string; group_name: string }[] | null;
};

function unwrapTeam(
  value: MatchRow["home_team"],
): { id: string; name: string; group_name: string } | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const emptyForm = {
  category: "masculino",
  yearLabel: "2015",
  phase: "grupos" as "grupos" | "cruces",
  roundLabel: "",
  homeTeamId: "",
  awayTeamId: "",
  kickoffDate: "",
  kickoffTime: "",
  court: "Cancha 1",
  status: "programado" as "programado" | "en_juego" | "finalizado",
  homeScore: "",
  awayScore: "",
  homePenalties: "",
  awayPenalties: "",
};

export function PartidosManager() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const yearOptions = useMemo(
    () => standingsConfig[form.category as keyof typeof standingsConfig].map((item) => item.label),
    [form.category],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        fetch("/api/admin/partidos"),
        fetch(`/api/admin/equipos?category=${form.category}&yearLabel=${form.yearLabel}`),
      ]);

      const matchesJson = await matchesRes.json();
      const teamsJson = await teamsRes.json();

      if (!matchesRes.ok) throw new Error(matchesJson.error ?? "No se pudieron cargar los partidos");
      if (!teamsRes.ok) throw new Error(teamsJson.error ?? "No se pudieron cargar los equipos");

      setMatches(matchesJson.matches ?? []);
      setTeams(teamsJson.teams ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [form.category, form.yearLabel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(match: MatchRow) {
    const { kickoffDate, kickoffTime } = splitKickoff(match.kickoff_at);
    const pens = splitRoundAndPens(match.round_label);
    setEditingId(match.id);
    setForm({
      category: match.category,
      yearLabel: match.year_label,
      phase: match.phase,
      roundLabel: pens.roundLabel ?? "",
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      kickoffDate,
      kickoffTime,
      court: match.court,
      status: match.status,
      homeScore: match.home_score?.toString() ?? "",
      awayScore: match.away_score?.toString() ?? "",
      homePenalties: pens.homePenalties?.toString() ?? "",
      awayPenalties: pens.awayPenalties?.toString() ?? "",
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      category: form.category,
      yearLabel: form.yearLabel,
      phase: form.phase,
      roundLabel: form.roundLabel,
      homeTeamId: form.homeTeamId,
      awayTeamId: form.awayTeamId,
      kickoffDate: form.kickoffDate,
      kickoffTime: form.kickoffTime,
      court: form.court,
      status:
        form.homeScore !== "" && form.awayScore !== "" ? "finalizado" : form.status,
      homeScore: form.homeScore === "" ? null : Number(form.homeScore),
      awayScore: form.awayScore === "" ? null : Number(form.awayScore),
      homePenalties: form.homePenalties === "" ? null : Number(form.homePenalties),
      awayPenalties: form.awayPenalties === "" ? null : Number(form.awayPenalties),
    };

    try {
      const response = await fetch(editingId ? `/api/admin/partidos/${editingId}` : "/api/admin/partidos", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "No se pudo guardar");

      resetForm();
      await loadData();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este partido?")) return;
    setError(null);
    const response = await fetch(`/api/admin/partidos/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "No se pudo eliminar");
      return;
    }
    if (editingId === id) resetForm();
    await loadData();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-yellow-400/15 bg-white/5 p-6">
        <h2 className="font-display text-lg font-bold uppercase text-white">
          {editingId ? "Editar partido" : "Nuevo partido"}
        </h2>

        <p className="mt-2 text-sm text-white/60">
          Si cargás goles de ambos equipos, el partido pasa a finalizado y la tabla se actualiza sola.
          En cruces, si empatan aparecen los penales: sin ganador de penales el cruce no avanza.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-white/80">
            Categoría
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                  yearLabel: standingsConfig[event.target.value as keyof typeof standingsConfig][0]?.label ?? "",
                  homeTeamId: "",
                  awayTeamId: "",
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              {tournamentCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Año
            <select
              value={form.yearLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  yearLabel: event.target.value,
                  homeTeamId: "",
                  awayTeamId: "",
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Fase
            <select
              value={form.phase}
              onChange={(event) =>
                setForm((current) => ({ ...current, phase: event.target.value as "grupos" | "cruces" }))
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              <option value="grupos">Grupos</option>
              <option value="cruces">Cruces</option>
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Instancia (opcional)
            <input
              value={form.roundLabel}
              onChange={(event) => setForm((current) => ({ ...current, roundLabel: event.target.value }))}
              placeholder="Semifinal, final..."
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm text-white/80">
            Local
            <select
              required
              value={form.homeTeamId}
              onChange={(event) => setForm((current) => ({ ...current, homeTeamId: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              <option value="">Elegir equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.group_name ? `Grupo ${team.group_name}` : "Sin grupo"})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Visitante
            <select
              required
              value={form.awayTeamId}
              onChange={(event) => setForm((current) => ({ ...current, awayTeamId: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              <option value="">Elegir equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.group_name ? `Grupo ${team.group_name}` : "Sin grupo"})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Fecha
            <input
              required
              type="date"
              value={form.kickoffDate}
              onChange={(event) => setForm((current) => ({ ...current, kickoffDate: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm text-white/80">
            Hora
            <input
              required
              type="time"
              value={form.kickoffTime}
              onChange={(event) => setForm((current) => ({ ...current, kickoffTime: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm text-white/80">
            Cancha
            <input
              required
              value={form.court}
              onChange={(event) => setForm((current) => ({ ...current, court: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm text-white/80">
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as "programado" | "en_juego" | "finalizado",
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            >
              <option value="programado">Programado</option>
              <option value="en_juego">En juego</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>

          <label className="block text-sm text-white/80">
            Goles local
            <input
              type="number"
              min="0"
              value={form.homeScore}
              onChange={(event) =>
                setForm((current) => {
                  const homeScore = event.target.value;
                  const draw =
                    current.phase === "cruces" &&
                    homeScore !== "" &&
                    current.awayScore !== "" &&
                    homeScore === current.awayScore;
                  return {
                    ...current,
                    homeScore,
                    homePenalties: draw ? current.homePenalties : "",
                    awayPenalties: draw ? current.awayPenalties : "",
                  };
                })
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm text-white/80">
            Goles visitante
            <input
              type="number"
              min="0"
              value={form.awayScore}
              onChange={(event) =>
                setForm((current) => {
                  const awayScore = event.target.value;
                  const draw =
                    current.phase === "cruces" &&
                    current.homeScore !== "" &&
                    awayScore !== "" &&
                    current.homeScore === awayScore;
                  return {
                    ...current,
                    awayScore,
                    homePenalties: draw ? current.homePenalties : "",
                    awayPenalties: draw ? current.awayPenalties : "",
                  };
                })
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
            />
          </label>

          {form.phase === "cruces" &&
          form.homeScore !== "" &&
          form.awayScore !== "" &&
          form.homeScore === form.awayScore ? (
            <>
              <label className="block text-sm text-yellow-200">
                Penales local
                <input
                  required
                  type="number"
                  min="0"
                  value={form.homePenalties}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, homePenalties: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-yellow-400/40 bg-black px-3 py-2 text-white"
                />
              </label>
              <label className="block text-sm text-yellow-200">
                Penales visitante
                <input
                  required
                  type="number"
                  min="0"
                  value={form.awayPenalties}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, awayPenalties: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-yellow-400/40 bg-black px-3 py-2 text-white"
                />
              </label>
              <p className="md:col-span-2 text-sm text-yellow-200/80">
                Empate en cruces: masculino serie de 5, femenino serie de 3. Tiene que haber un ganador.
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear partido"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="font-display mb-4 text-lg font-bold uppercase text-white">Partidos cargados</h2>
        {loading ? (
          <p className="text-white/60">Cargando...</p>
        ) : matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-yellow-400/25 p-6 text-white/60">
            Todavía no hay partidos. Creá el primero arriba.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const home = unwrapTeam(match.home_team);
              const away = unwrapTeam(match.away_team);
              return (
                <article
                  key={match.id}
                  className="rounded-2xl border border-yellow-400/15 bg-black/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-yellow-400">
                        {match.category} · {match.year_label} · {match.phase}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {home?.name ?? "Local"} vs {away?.name ?? "Visitante"}
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        {formatKickoff(match.kickoff_at)} · {match.court}
                      </p>
                      {match.status === "finalizado" ? (
                        <p className="mt-1 text-sm font-medium text-yellow-300">
                          Resultado: {match.home_score ?? 0} - {match.away_score ?? 0}
                          {(() => {
                            const pens = splitRoundAndPens(match.round_label);
                            if (pens.homePenalties == null || pens.awayPenalties == null) return null;
                            return `  ·  pen. ${pens.homePenalties}-${pens.awayPenalties}`;
                          })()}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(match)}
                        className="rounded-full border border-white/20 px-4 py-2 text-sm text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(match.id)}
                        className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

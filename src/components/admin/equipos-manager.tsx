"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { standingsConfig, tournamentCategories } from "@/lib/tournament-categories";

type TeamRow = {
  id: string;
  name: string;
  category: string;
  yearLabel: string;
  groupName: string;
  logoUrl: string | null;
};

const emptyForm = {
  category: "masculino",
  yearLabel: "2015",
  groupName: "A",
  customGroup: "",
  name: "",
};

export function EquiposManager() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [useCustomGroup, setUseCustomGroup] = useState(false);

  const yearOptions = useMemo(
    () => standingsConfig[form.category as keyof typeof standingsConfig] ?? [],
    [form.category],
  );

  const groupOptions = useMemo(() => {
    const configured =
      yearOptions.find((item) => item.label === form.yearLabel)?.groups ?? ["A", "B", "C"];
    const fromTeams = teams
      .filter((team) => team.category === form.category && team.yearLabel === form.yearLabel)
      .map((team) => team.groupName);
    return Array.from(new Set([...configured, ...fromTeams])).sort();
  }, [yearOptions, form.yearLabel, form.category, teams]);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/equipos?category=${form.category}&yearLabel=${encodeURIComponent(form.yearLabel)}`,
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "No se pudieron cargar los equipos");
      setTeams(
        (json.teams ?? []).map(
          (team: {
            id: string;
            name: string;
            category: string;
            yearLabel?: string;
            year_label?: string;
            groupName?: string;
            group_name?: string;
            logoUrl?: string | null;
          }) => ({
            id: team.id,
            name: team.name,
            category: team.category,
            yearLabel: team.yearLabel ?? team.year_label ?? "",
            groupName: team.groupName ?? team.group_name ?? "",
            logoUrl: team.logoUrl ?? null,
          }),
        ),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [form.category, form.yearLabel]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!yearOptions.some((item) => item.label === form.yearLabel)) {
      setForm((prev) => ({ ...prev, yearLabel: yearOptions[0]?.label ?? "" }));
    }
  }, [yearOptions, form.yearLabel]);

  function resetForm() {
    setForm((prev) => ({
      ...emptyForm,
      category: prev.category,
      yearLabel: prev.yearLabel,
      groupName: groupOptions[0] ?? "A",
    }));
    setLogoFile(null);
    setEditingId(null);
    setUseCustomGroup(false);
  }

function startEdit(team: TeamRow) {
    const knownGroups =
      standingsConfig[team.category as keyof typeof standingsConfig]
        ?.find((item) => item.label === team.yearLabel)
        ?.groups ?? [];
    const isCustom = !knownGroups.includes(team.groupName);

    setEditingId(team.id);
    setUseCustomGroup(isCustom);
    setForm({
      category: team.category,
      yearLabel: team.yearLabel,
      groupName: isCustom ? knownGroups[0] ?? "A" : team.groupName,
      customGroup: isCustom ? team.groupName : "",
      name: team.name,
    });
    setLogoFile(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const groupName = useCustomGroup ? form.customGroup.trim().toUpperCase() : form.groupName;
    if (!groupName) {
      setError("Indicá el grupo (A, B, C…).");
      setSaving(false);
      return;
    }

    const body = new FormData();
    body.set("name", form.name.trim());
    body.set("category", form.category);
    body.set("yearLabel", form.yearLabel);
    body.set("groupName", groupName);
    if (editingId) body.set("id", editingId);
    if (logoFile) body.set("logo", logoFile);

    try {
      const response = await fetch("/api/admin/equipos", {
        method: editingId ? "PATCH" : "POST",
        body,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "No se pudo guardar el equipo");

      setMessage(editingId ? "Equipo actualizado." : "Equipo creado.");
      resetForm();
      await loadTeams();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function removeTeam(id: string) {
    if (!confirm("¿Eliminar este equipo?")) return;
    setError(null);
    const response = await fetch(`/api/admin/equipos?id=${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "No se pudo eliminar");
      return;
    }
    if (editingId === id) resetForm();
    await loadTeams();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TeamRow[]>();
    for (const team of teams) {
      const list = map.get(team.groupName) ?? [];
      list.push(team);
      map.set(team.groupName, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [teams]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid max-w-3xl gap-4 rounded-2xl border border-yellow-400/15 bg-white/5 p-5 sm:grid-cols-2"
      >
        <label className="space-y-1 text-sm text-white/80">
          <span>Fútbol</span>
          <select
            value={form.category}
            onChange={(event) => {
              const category = event.target.value;
              const years = standingsConfig[category as keyof typeof standingsConfig];
              setForm((prev) => ({
                ...prev,
                category,
                yearLabel: years[0]?.label ?? "",
                groupName: years[0]?.groups[0] ?? "A",
              }));
            }}
            className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white outline-none focus:border-yellow-400"
          >
            {tournamentCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-white/80">
          <span>Categoría (año)</span>
          <select
            value={form.yearLabel}
            onChange={(event) => {
              const yearLabel = event.target.value;
              const groups =
                yearOptions.find((item) => item.label === yearLabel)?.groups ?? ["A"];
              setForm((prev) => ({
                ...prev,
                yearLabel,
                groupName: groups[0] ?? "A",
              }));
            }}
            className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white outline-none focus:border-yellow-400"
          >
            {yearOptions.map((year) => (
              <option key={year.label} value={year.label}>
                {year.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1 text-sm text-white/80">
          <span>Grupo</span>
          {!useCustomGroup ? (
            <select
              value={form.groupName}
              onChange={(event) => {
                if (event.target.value === "__custom") {
                  setUseCustomGroup(true);
                  setForm((prev) => ({ ...prev, customGroup: "" }));
                  return;
                }
                setForm((prev) => ({ ...prev, groupName: event.target.value }));
              }}
              className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white outline-none focus:border-yellow-400"
            >
              {groupOptions.map((group) => (
                <option key={group} value={group}>
                  Grupo {group}
                </option>
              ))}
              <option value="__custom">Crear otro grupo…</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                value={form.customGroup}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    customGroup: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Ej: D"
                maxLength={4}
                className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 uppercase text-white outline-none focus:border-yellow-400"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setUseCustomGroup(false);
                  setForm((prev) => ({ ...prev, groupName: groupOptions[0] ?? "A" }));
                }}
                className="rounded-xl border border-white/20 px-3 text-xs text-white/70 hover:bg-white/10"
              >
                Listado
              </button>
            </div>
          )}
        </div>

        <label className="space-y-1 text-sm text-white/80">
          <span>Nombre del equipo</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Ej: Atlético Ceres A"
            required
            className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white outline-none focus:border-yellow-400"
          />
        </label>

        <label className="space-y-1 text-sm text-white/80 sm:col-span-2">
          <span>Escudo (JPG o PNG){editingId ? " — opcional al editar" : ""}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
        </label>

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="font-display rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar equipo"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/20 px-5 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400 sm:col-span-2">{error}</p> : null}
        {message ? <p className="text-sm text-yellow-300 sm:col-span-2">{message}</p> : null}
      </form>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400">
          Equipos cargados · {form.category} {form.yearLabel}
        </h2>
        {loading ? (
          <p className="text-sm text-white/60">Cargando equipos…</p>
        ) : teams.length === 0 ? (
          <p className="rounded-xl border border-dashed border-yellow-400/25 p-5 text-sm text-white/65">
            Todavía no hay equipos en esta categoría. Agregá el primero con el formulario.
          </p>
        ) : (
          grouped.map(([group, groupTeams]) => (
            <div
              key={group}
              className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-black/40"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <h3 className="font-semibold text-white">Grupo {group}</h3>
              </div>
              <ul className="divide-y divide-white/10">
                {groupTeams.map((team) => (
                  <li
                    key={team.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-yellow-400/30 bg-black/50">
                        {team.logoUrl ? (
                          <Image
                            src={team.logoUrl}
                            alt={team.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-yellow-400">
                            {team.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-white">{team.name}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(team)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeTeam(team.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

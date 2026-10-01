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
  /** Solo al editar: cada equipo pertenece a una única categoría. */
  yearLabel: "2015",
  /** Al agregar: se crea una copia del equipo por cada categoría elegida. */
  yearLabels: [] as string[],
  groupName: "",
  customGroup: "",
  name: "",
};

function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

export function EquiposManager() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewYear, setViewYear] = useState(emptyForm.yearLabel);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [useCustomGroup, setUseCustomGroup] = useState(false);

  const yearOptions = useMemo(
    () => standingsConfig[form.category as keyof typeof standingsConfig] ?? [],
    [form.category],
  );

  const groupYear = editingId
    ? form.yearLabel
    : form.yearLabels.length === 1
      ? form.yearLabels[0]
      : null;

  const groupOptions = useMemo(() => {
    if (!groupYear) return [];
    const configured =
      yearOptions.find((item) => item.label === groupYear)?.groups ?? ["A", "B", "C"];
    const fromTeams = teams
      .filter((team) => team.category === form.category && team.yearLabel === groupYear)
      .map((team) => team.groupName)
      .filter(Boolean);
    return Array.from(new Set([...configured, ...fromTeams])).sort();
  }, [yearOptions, groupYear, form.category, teams]);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/equipos?category=${form.category}`);
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
  }, [form.category]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!yearOptions.some((item) => item.label === form.yearLabel)) {
      setForm((prev) => ({ ...prev, yearLabel: yearOptions[0]?.label ?? "" }));
    }
    if (!yearOptions.some((item) => item.label === viewYear)) {
      setViewYear(yearOptions[0]?.label ?? "");
    }
  }, [yearOptions, form.yearLabel, viewYear]);

  function resetForm() {
    setForm((prev) => ({
      ...emptyForm,
      category: prev.category,
      yearLabel: prev.yearLabel,
      yearLabels: prev.yearLabels,
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
    const isCustom = Boolean(team.groupName) && !knownGroups.includes(team.groupName);

    setEditingId(team.id);
    setUseCustomGroup(isCustom);
    setForm((prev) => ({
      category: team.category,
      yearLabel: team.yearLabel,
      yearLabels: prev.yearLabels,
      groupName: isCustom ? "" : team.groupName,
      customGroup: isCustom ? team.groupName : "",
      name: team.name,
    }));
    setLogoFile(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!editingId && form.yearLabels.length === 0) {
      setError("Elegí al menos una categoría (año).");
      setSaving(false);
      return;
    }

    const groupName = !groupYear
      ? ""
      : useCustomGroup
        ? form.customGroup.trim().toUpperCase()
        : form.groupName;
    if (groupYear && useCustomGroup && !groupName) {
      setError("Escribí el nombre del grupo nuevo o volvé al listado.");
      setSaving(false);
      return;
    }

    const body = new FormData();
    body.set("name", form.name.trim());
    body.set("category", form.category);
    if (editingId) {
      body.set("yearLabel", form.yearLabel);
    } else {
      for (const yearLabel of form.yearLabels) body.append("yearLabel", yearLabel);
    }
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

      if (editingId) {
        setMessage("Equipo actualizado.");
      } else {
        const created: string[] = json.created ?? form.yearLabels;
        const skipped: string[] = json.skipped ?? [];
        setMessage(
          `"${form.name.trim()}" cargado en ${joinLabels(created)}.` +
            (skipped.length ? ` Ya estaba en ${joinLabels(skipped)}, no se duplicó.` : ""),
        );
        if (created.length && !created.includes(viewYear)) setViewYear(created[0]);
      }
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

  const countsByYear = useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of teams) counts.set(team.yearLabel, (counts.get(team.yearLabel) ?? 0) + 1);
    return counts;
  }, [teams]);

  const grouped = useMemo(() => {
    const map = new Map<string, TeamRow[]>();
    for (const team of teams.filter((item) => item.yearLabel === viewYear)) {
      const list = map.get(team.groupName) ?? [];
      list.push(team);
      map.set(team.groupName, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      !a ? -1 : !b ? 1 : a.localeCompare(b),
    );
  }, [teams, viewYear]);

  function toggleYear(yearLabel: string) {
    setForm((prev) => {
      const selected = prev.yearLabels.includes(yearLabel)
        ? prev.yearLabels.filter((item) => item !== yearLabel)
        : [...prev.yearLabels, yearLabel];
      return {
        ...prev,
        yearLabels: yearOptions.map((item) => item.label).filter((label) => selected.includes(label)),
        groupName: "",
      };
    });
    setUseCustomGroup(false);
  }

  const allYearsSelected =
    yearOptions.length > 0 && yearOptions.every((item) => form.yearLabels.includes(item.label));

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
                yearLabels: [],
                groupName: "",
              }));
              setViewYear(years[0]?.label ?? "");
              setUseCustomGroup(false);
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
          <span>Nombre del equipo</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Ej: Atlético Ceres A"
            required
            className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white outline-none focus:border-yellow-400"
          />
        </label>

        {editingId ? (
          <label className="space-y-1 text-sm text-white/80">
            <span>Categoría (año)</span>
            <select
              value={form.yearLabel}
              onChange={(event) => {
                const yearLabel = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  yearLabel,
                  groupName: "",
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
        ) : (
          <fieldset className="space-y-2 text-sm text-white/80 sm:col-span-2">
            <legend className="mb-1">
              Categorías (año) <span className="text-white/50">— podés elegir varias</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {yearOptions.map((year) => {
                const checked = form.yearLabels.includes(year.label);
                return (
                  <label
                    key={year.label}
                    className={`flex cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${
                      checked
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-yellow-400/30 bg-black text-white hover:border-yellow-400/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleYear(year.label)}
                      className="sr-only"
                    />
                    <span aria-hidden>{checked ? "✓" : "+"}</span>
                    {year.label}
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    yearLabels: allYearsSelected ? [] : yearOptions.map((item) => item.label),
                    groupName: "",
                  }));
                  setUseCustomGroup(false);
                }}
                className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
              >
                {allYearsSelected ? "Quitar todas" : "Todas"}
              </button>
            </div>
          </fieldset>
        )}

        <div className="space-y-1 text-sm text-white/80">
          <span>Grupo (opcional)</span>
          {!groupYear ? (
            <p className="rounded-xl border border-dashed border-yellow-400/20 px-3 py-2.5 text-xs leading-relaxed text-white/55">
              {form.yearLabels.length > 1
                ? "Con varias categorías el grupo se asigna después, desde “Editar” en cada una."
                : "Elegí una categoría para ver los grupos."}
            </p>
          ) : !useCustomGroup ? (
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
              <option value="">Sin grupo (se define después)</option>
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
                  setForm((prev) => ({ ...prev, groupName: "" }));
                }}
                className="rounded-xl border border-white/20 px-3 text-xs text-white/70 hover:bg-white/10"
              >
                Listado
              </button>
            </div>
          )}
        </div>
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
          Equipos cargados · {form.category} {viewYear}
        </h2>
        <div className="flex flex-wrap gap-2">
          {yearOptions.map((year) => (
            <button
              key={year.label}
              type="button"
              onClick={() => setViewYear(year.label)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                viewYear === year.label
                  ? "border-yellow-400 bg-yellow-400/15 font-semibold text-yellow-300"
                  : "border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {year.label}
              <span className="ml-1.5 text-xs opacity-70">({countsByYear.get(year.label) ?? 0})</span>
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-white/60">Cargando equipos…</p>
        ) : grouped.length === 0 ? (
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
                <h3 className="font-semibold text-white">
                  {group ? `Grupo ${group}` : "Sin grupo asignado"}
                </h3>
                {!group ? (
                  <p className="mt-0.5 text-xs text-white/50">
                    Tocá “Editar” para asignarles el grupo cuando se armen.
                  </p>
                ) : null}
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

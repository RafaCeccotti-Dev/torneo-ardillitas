"use client";

import { Check, ChevronDown, Copy, Link2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ClubOption = {
  name: string;
  inscriptions: number;
  categories: string[];
};

type PortalRow = {
  id: string;
  token: string;
  name: string;
  url: string;
  teams: { id: string; name: string; yearLabel: string; category: string; groupName: string }[];
};

export function AcreditacionManager() {
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/acreditacion");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudieron cargar los links");
      setPortals(json.portals ?? []);
      setClubs(json.clubs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedClub = useMemo(
    () => clubs.find((club) => club.name === clubName) ?? null,
    [clubs, clubName],
  );

  const clubsWithoutLink = useMemo(() => {
    const linked = new Set(portals.map((p) => p.name));
    return clubs.filter((club) => !linked.has(club.name));
  }, [clubs, portals]);

  async function createPortal() {
    if (!clubName) {
      setError("Elegí un club");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/acreditacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clubName }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 409) throw new Error(json.error ?? "No se pudo crear");
      if (res.status === 409) {
        setMessage(`Ese club ya tiene link. Copialo de la lista.`);
      } else {
        setMessage(
          `Link creado para ${json.portal.name} (${json.portal.categories} categoría${json.portal.categories === 1 ? "" : "s"})`,
        );
      }
      setClubName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function removePortal(id: string) {
    if (
      !confirm(
        "¿Borrar este link? El DT ya no va a poder entrar. Los jugadores cargados quedan en el sistema.",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/acreditacion?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo borrar");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(portal: PortalRow) {
    const absolute = portal.url.startsWith("http")
      ? portal.url
      : `${window.location.origin}/acreditar/${portal.token}`;
    await navigator.clipboard.writeText(absolute);
    setCopiedId(portal.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-yellow-400/20 bg-white/5 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Link2 className="h-5 w-5 text-yellow-400" />
          Nuevo link para un DT
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Solo elegís el <strong className="text-white">club</strong>. El DT, con su link, va a ver
          automáticamente todas las categorías en las que ese club esté inscripto y carga jugadores
          ahí adentro.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">Club</span>
            <div className="relative">
              <select
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/15 bg-black/40 px-3 pr-10 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Elegí un club…</option>
                {clubsWithoutLink.map((club) => (
                  <option key={club.name} value={club.name}>
                    {club.name} ({club.inscriptions} categoría
                    {club.inscriptions === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </div>
          </label>

          {selectedClub ? (
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
              <p className="font-medium text-white">{selectedClub.name}</p>
              <p className="mt-1 text-xs text-white/45">
                El DT va a poder cargar en: {selectedClub.categories.join(" · ")}
              </p>
            </div>
          ) : null}

          {clubsWithoutLink.length === 0 && !loading ? (
            <p className="text-sm text-white/50">
              Todos los clubs con equipos ya tienen link, o todavía no hay equipos cargados.
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving || !clubName}
            onClick={() => void createPortal()}
            className="h-12 rounded-xl bg-yellow-400 px-5 font-bold text-black hover:bg-yellow-300 disabled:opacity-40"
          >
            {saving ? "Creando…" : "Crear link del DT"}
          </button>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Links activos</h2>
        {loading ? (
          <p className="text-white/50">Cargando…</p>
        ) : portals.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-white/50">
            Todavía no hay links de acreditación.
          </p>
        ) : (
          <ul className="space-y-3">
            {portals.map((portal) => (
              <li key={portal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-bold uppercase text-white">
                      {portal.name}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {portal.teams.length
                        ? portal.teams
                            .map(
                              (t) =>
                                `${t.yearLabel}${t.category === "femenino" ? " Fem" : ""}${t.groupName ? ` (G${t.groupName})` : ""}`,
                            )
                            .join(" · ")
                        : "Sin categorías inscriptas todavía"}
                    </p>
                    <p className="mt-2 break-all text-xs text-yellow-400/80">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/acreditar/${portal.token}`
                        : portal.url}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyLink(portal)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
                    >
                      {copiedId === portal.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedId === portal.id ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePortal(portal.id)}
                      className="rounded-full border border-red-400/30 p-2 text-red-300 hover:bg-red-500/10"
                      aria-label="Borrar link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

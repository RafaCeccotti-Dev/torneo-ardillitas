"use client";

import Image from "next/image";
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import {
  MAX_PLAYERS_PER_CATEGORY,
  STAFF_ROLES,
  type StaffRole,
} from "@/lib/accreditation";
import { parseArgentineDniOcr } from "@/lib/dni-ocr";
import { downloadPdfBase64, sendPdfViaFormSubmitFromBrowser } from "@/lib/send-email-client";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

type Team = {
  id: string;
  name: string;
  category: string;
  yearLabel: string;
  groupName: string;
  logoUrl: string | null;
  playerCount: number;
};

type Player = {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  birthDateDisplay?: string;
  jerseyNumber: number;
  dniPhotoUrl: string | null;
};

type Staff = {
  id: string;
  teamId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
};

type PanelData = {
  portal: { id: string; name: string; logoUrl: string | null };
  teams: Team[];
  players: Player[];
  staff: Staff[];
  maxPlayers: number;
};

export function AccreditationPanel({ token }: { token: string }) {
  const [data, setData] = useState<PanelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string>("");
  const [view, setView] = useState<"home" | "add-player" | "staff">("home");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/acreditar/${token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cargar");
      setData(json);
      setTeamId((prev) => prev || json.teams[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const team = useMemo(
    () => data?.teams.find((item) => item.id === teamId) ?? null,
    [data, teamId],
  );

  const players = useMemo(
    () => (data?.players ?? []).filter((p) => p.teamId === teamId),
    [data, teamId],
  );

  const staff = useMemo(
    () => (data?.staff ?? []).filter((s) => s.teamId === teamId),
    [data, teamId],
  );

  const usedJerseys = useMemo(() => new Set(players.map((p) => p.jerseyNumber)), [players]);
  const maxPlayers = data?.maxPlayers ?? MAX_PLAYERS_PER_CATEGORY;
  const totalPlayers = data?.players.length ?? 0;

  async function addPlayer(form: FormData) {
    setBusy(true);
    setFormError(null);
    form.set("teamId", teamId);
    form.delete("dniPhoto"); // la foto solo sirve para OCR en el celular
    try {
      const res = await fetch(`/api/acreditar/${token}/players`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo agregar");
      await load();
      setView("home");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function removePlayer(id: string) {
    if (!confirm("¿Sacar este jugador de la lista?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/acreditar/${token}/players?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo borrar");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveStaff(form: FormData) {
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/acreditar/${token}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          role: form.get("role"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          dni: form.get("dni"),
          phone: form.get("phone"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
      await load();
      setView("home");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function sendInscription() {
    if (!teamId) return;
    if (
      !confirm(
        "¿Enviar el PDF de esta categoría al correo del coordinador (torneoardillitas@gmail.com)?",
      )
    ) {
      return;
    }
    setBusy(true);
    setSendMsg(null);
    try {
      const res = await fetch(`/api/acreditar/${token}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo enviar");

      if (json.needsClientSend && json.pdfBase64) {
        downloadPdfBase64(json.pdfBase64, json.filename);
        await sendPdfViaFormSubmitFromBrowser({
          to: json.to,
          subject: json.subject,
          text: json.text,
          pdfBase64: json.pdfBase64,
          filename: json.filename,
        });
        setSendMsg(
          `Se descargó el PDF en este celular. No pudimos confirmar el envío por mail: mandáselo al coordinador (${json.to}) por WhatsApp o mail.`,
        );
      } else {
        setSendMsg(`Listo: PDF enviado a ${json.to} (${json.players} jugadores).`);
      }
    } catch (err) {
      setSendMsg(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/60">
        Cargando plantel…
      </div>
    );
  }

  if (error || !data || !team) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
        <p className="text-lg font-semibold text-white">No se pudo abrir el link</p>
        <p className="mt-2 text-sm text-white/60">{error ?? "Link inválido"}</p>
      </div>
    );
  }

  if (view === "add-player") {
    return (
      <AddPlayerForm
        busy={busy}
        error={formError}
        usedJerseys={usedJerseys}
        onClose={() => {
          setFormError(null);
          setView("home");
        }}
        onSubmit={(form) => void addPlayer(form)}
      />
    );
  }

  if (view === "staff") {
    return (
      <StaffForm
        busy={busy}
        error={formError}
        existing={staff}
        onClose={() => {
          setFormError(null);
          setView("home");
        }}
        onSubmit={(form) => void saveStaff(form)}
      />
    );
  }

  const editionLabel = `ARDILLITAS ${siteConfig.tournamentDates.slice(-4) || "2026"}`;

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-10 pt-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
          {data.portal.logoUrl || team.logoUrl ? (
            <Image
              src={data.portal.logoUrl || team.logoUrl || ""}
              alt={data.portal.name}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          ) : (
            <Image
              src={siteConfig.logos.header}
              alt="Ardillitas"
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          )}
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-yellow-400">
          {editionLabel}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-wide text-white">
          {data.portal.name}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {totalPlayers} jugador{totalPlayers === 1 ? "" : "es"} cargado
          {totalPlayers === 1 ? "" : "s"}
        </p>
      </div>

      <label className="mt-8 block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          Categoría
        </span>
        <div className="relative mt-2">
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-zinc-900 px-4 pr-10 text-base font-medium text-white outline-none focus:border-yellow-400"
          >
            {data.teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.yearLabel}
                {item.category === "femenino" ? " · Femenino" : " · Masculino"}
                {item.groupName ? ` · Grupo ${item.groupName}` : ""} · {item.playerCount}/
                {maxPlayers}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        </div>
      </label>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white">Jugadores</h2>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70">
            {players.length}/{maxPlayers}
          </span>
        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-white/35" />
            <p className="mt-3 text-sm text-white/55">
              Todavía no cargaste ningún jugador en esta categoría.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-3 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-sm font-bold text-yellow-400">
                  {player.jerseyNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-white/45">
                    DNI {player.dni}
                    {player.birthDateDisplay ? ` · ${player.birthDateDisplay}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removePlayer(player.id)}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-red-400"
                  aria-label="Eliminar jugador"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={busy || players.length >= maxPlayers}
          onClick={() => setView("add-player")}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-base font-bold text-black transition hover:bg-yellow-300 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
          Agregar jugador
        </button>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white">
          Cuerpo técnico
        </h2>
        {staff.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-8 text-center">
            <UserCog className="mx-auto h-8 w-8 text-white/35" />
            <p className="mt-3 text-sm text-white/55">
              Todavía no cargaste el profe de esta categoría.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {staff.map((member) => (
              <li
                key={member.id}
                className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                  {STAFF_ROLES.find((r) => r.value === member.role)?.label ?? member.role}
                </p>
                <p className="mt-1 font-semibold text-white">
                  {member.firstName} {member.lastName}
                </p>
                {(member.dni || member.phone) && (
                  <p className="mt-0.5 text-xs text-white/45">
                    {[member.dni && `DNI ${member.dni}`, member.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => setView("staff")}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-base font-bold text-black transition hover:bg-yellow-300 disabled:opacity-40"
        >
          <Pencil className="h-5 w-5" />
          Cargar cuerpo técnico
        </button>
      </section>

      <section className="mt-10">
        <button
          type="button"
          disabled={busy || players.length === 0}
          onClick={() => void sendInscription()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-yellow-400 bg-black text-base font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
          Enviar inscripción (PDF)
        </button>
        <p className="mt-2 text-center text-xs text-white/40">
          Manda el plantel de esta categoría a {siteConfig.coordinatorEmail}
        </p>
        {sendMsg ? (
          <p className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
            {sendMsg}
          </p>
        ) : null}
      </section>

      <PaymentSection clubName={data.portal.name} />
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

function PaymentSection({ clubName }: { clubName: string }) {
  const { payment, whatsapp } = siteConfig;
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const cashUrl = whatsappUrl(
    whatsapp.number,
    `Hola, me comunico desde el club ${clubName} para coordinar el pago en efectivo de la inscripción al Torneo Ardillitas.`,
  );

  async function copyAlias() {
    const ok = await copyText(payment.alias);
    setCopied(ok);
    setNotice(
      ok
        ? `Alias copiado: ${payment.alias}. Pegalo en tu app de banco o billetera para transferir.`
        : `No se pudo copiar. El alias es: ${payment.alias}`,
    );
    if (ok) window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white">
        Pago de la inscripción
      </h2>
      <div className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-sm">
        <dl className="space-y-2">
          {[
            ["Titular", payment.holder],
            ["Alias", payment.alias],
            ["CBU", payment.cbu],
            ["Banco", payment.bank],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</dt>
              <dd className="break-all text-right font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => void copyAlias()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-base font-bold text-black transition hover:bg-yellow-300"
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          {copied ? "Alias copiado" : "Copiar datos bancarios"}
        </button>
        {cashUrl ? (
          <a
            href={cashUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] text-base font-bold text-black transition hover:brightness-110"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Coordinar pago en efectivo
          </a>
        ) : null}
      </div>
      {notice ? (
        <p className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

function AddPlayerForm({
  busy,
  error,
  usedJerseys,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  usedJerseys: Set<number>;
  onClose: () => void;
  onSubmit: (form: FormData) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");

  async function readDniPhoto(file: File) {
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanHint("Leyendo el DNI…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseArgentineDniOcr(text);
      if (parsed.firstName) setFirstName(parsed.firstName);
      if (parsed.lastName) setLastName(parsed.lastName);
      if (parsed.dni) setDni(parsed.dni);
      if (parsed.birthDate) setBirthDate(parsed.birthDate);

      const filled = [parsed.firstName, parsed.lastName, parsed.dni, parsed.birthDate].filter(
        Boolean,
      ).length;
      setScanHint(
        filled >= 2
          ? "Listo: revisá los datos y elegí el número de camiseta."
          : "No se pudo leer bien. Completá a mano o sacá otra foto más nítida.",
      );
    } catch {
      setScanHint("No se pudo leer la foto. Completá los datos a mano.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-10 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-white/70 hover:bg-white/5"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Agregar jugador</h1>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-yellow-400/50 bg-zinc-900 px-4 py-8 text-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={scanning || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readDniPhoto(file);
              else {
                setPreview(null);
                setScanHint(null);
              }
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa DNI" className="mb-3 max-h-40 rounded-xl object-contain" />
          ) : (
            <Camera className="mb-3 h-10 w-10 text-yellow-400" />
          )}
          <p className="font-semibold text-white">
            {scanning ? "Leyendo DNI…" : "Sacale una foto al DNI"}
          </p>
          <p className="mt-1 text-sm text-white/50">para autocompletar los datos</p>
          <p className="mt-3 text-xs text-white/35">
            La foto no se guarda: solo se lee en tu celular y se descarta.
          </p>
          {scanHint ? (
            <p className="mt-3 text-xs font-medium text-yellow-300">{scanHint}</p>
          ) : null}
        </label>

        <Field label="Nombre">
          <input
            name="firstName"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
            autoComplete="given-name"
          />
        </Field>
        <Field label="Apellido">
          <input
            name="lastName"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
            autoComplete="family-name"
          />
        </Field>
        <Field label="Documento">
          <input
            name="dni"
            required
            inputMode="numeric"
            placeholder="Sin puntos"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>
        <Field label="Fecha de nacimiento">
          <input
            name="birthDate"
            required
            placeholder="dd/mm/aaaa"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>
        <Field label="N.º de camiseta">
          <select
            name="jerseyNumber"
            required
            defaultValue=""
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          >
            <option value="" disabled>
              Elegí…
            </option>
            {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} disabled={usedJerseys.has(n)}>
                {n}
                {usedJerseys.has(n) ? " (usado)" : ""}
              </option>
            ))}
          </select>
        </Field>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-white/40">
          Al agregarlo confirmás que la madre, el padre o el tutor autoriza la participación del
          menor en el torneo.
        </p>

        <button
          type="submit"
          disabled={busy || scanning}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-yellow-400 text-base font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Agregar jugador"}
        </button>
      </form>
    </div>
  );
}

function StaffForm({
  busy,
  error,
  existing,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  existing: Staff[];
  onClose: () => void;
  onSubmit: (form: FormData) => void;
}) {
  const dt = existing.find((s) => s.role === "dt");

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-10 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-white/70 hover:bg-white/5"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Cuerpo técnico</h1>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Rol">
          <select
            name="role"
            defaultValue={dt?.role ?? "dt"}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
            required
          >
            {STAFF_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre">
          <input
            name="firstName"
            required
            defaultValue={dt?.firstName ?? ""}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>
        <Field label="Apellido">
          <input
            name="lastName"
            required
            defaultValue={dt?.lastName ?? ""}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>
        <Field label="Documento (opcional)">
          <input
            name="dni"
            inputMode="numeric"
            placeholder="Sin puntos"
            defaultValue={dt?.dni ?? ""}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>
        <Field label="Teléfono (opcional)">
          <input
            name="phone"
            defaultValue={dt?.phone ?? ""}
            className="h-14 w-full rounded-[0.9rem] border border-white/10 bg-zinc-900 px-4 text-white outline-none focus:border-yellow-400"
          />
        </Field>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-yellow-400 text-base font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

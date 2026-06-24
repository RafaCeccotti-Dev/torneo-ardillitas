"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReglamentoUpload({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/reglamento", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "No se pudo subir el PDF.");
      return;
    }

    setMessage("Reglamento actualizado correctamente.");
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-4">
      {currentUrl ? (
        <p className="text-sm text-white/70">
          PDF actual:{" "}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:underline"
          >
            Ver reglamento
          </a>
        </p>
      ) : (
        <p className="text-sm text-white/60">Todavía no hay PDF cargado.</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-display rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? "Subiendo..." : "Subir PDF"}
        </button>
      </form>
      {message ? <p className="text-sm text-yellow-300">{message}</p> : null}
    </div>
  );
}

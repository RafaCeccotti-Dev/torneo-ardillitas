"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPhoto = {
  id: string;
  src: string;
  caption: string;
};

export function FotosUpload({ photos }: { photos: AdminPhoto[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/fotos", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setMessage(body.error ?? "No se pudo subir la foto.");
      return;
    }

    setMessage("Foto publicada.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function removePhoto(id: string) {
    if (!confirm("¿Eliminar esta foto de la galería?")) return;

    const response = await fetch(`/api/admin/fotos?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("No se pudo eliminar la foto.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
        />
        <input
          type="text"
          name="caption"
          placeholder="Descripción (opcional)"
          className="w-full rounded-xl border border-yellow-400/20 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-display rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? "Subiendo..." : "Publicar foto"}
        </button>
        {message ? <p className="text-sm text-yellow-300">{message}</p> : null}
      </form>

      {photos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-black/50"
            >
              <div className="relative aspect-[4/3]">
                <Image src={photo.src} alt={photo.caption} fill className="object-cover" sizes="33vw" />
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3 text-sm text-white/80">
                <span>{photo.caption || "Sin descripción"}</span>
                <button
                  type="button"
                  onClick={() => void removePhoto(photo.id)}
                  className="shrink-0 text-red-400 hover:text-red-300"
                >
                  Eliminar
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/60">Todavía no hay fotos en la galería pública.</p>
      )}
    </div>
  );
}

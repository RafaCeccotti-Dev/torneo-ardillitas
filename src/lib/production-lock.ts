import { NextResponse } from "next/server";

/** Endpoints de una sola vez (seed, reenvío, health por token) no corren en prod. */
export function isProductionLocked() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function productionLockedResponse() {
  return NextResponse.json({ error: "No disponible" }, { status: 404 });
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOST = "gendmwgzxtqxpntthlvc.supabase.co";
const ALLOWED_PREFIX = "/storage/v1/object/public/escudos/";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || target.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: "host" }, { status: 400 });
  }
  if (!target.pathname.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "path" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), { cache: "force-cache" });
  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const input = Buffer.from(await upstream.arrayBuffer());
  let body = input;
  let type = upstream.headers.get("content-type") || "image/png";

  try {
    const sharp = (await import("sharp")).default;
    body = await sharp(input)
      .resize(160, 160, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    type = "image/png";
  } catch {
    body = input;
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}

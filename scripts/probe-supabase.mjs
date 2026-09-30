import fs from "fs";

const path = "D:/Proyectos/torneo-ardillitas/.env.vercel.local";
const text = fs.readFileSync(path, "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log(
  JSON.stringify({
    hasUrl: Boolean(url),
    urlLen: url ? url.length : 0,
    hasAnon: Boolean(anon),
    anonLen: anon ? anon.length : 0,
  }),
);

const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
for (const p of [
  "accreditation_portals?select=id&limit=1",
  "teams?select=id,name&limit=1",
]) {
  const res = await fetch(`${url}/rest/v1/${p}`, { headers });
  const body = await res.text();
  console.log(p.split("?")[0], res.status, body.slice(0, 200));
}

import fs from "fs";

const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const res = await fetch(
  `${url}/rest/v1/teams?select=name,category,year_label,group_name,logo_path&order=year_label,name`,
  { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
);
const teams = await res.json();
if (!Array.isArray(teams)) {
  console.log("not array", res.status);
  process.exit(1);
}

const real = teams.filter((t) => t.group_name !== "PEND");
const missing = real.filter((t) => !t.logo_path);
const withLogo = real.filter((t) => t.logo_path);
console.log("total real", real.length);
console.log("with logo_path", withLogo.length);
console.log("missing logo_path", missing.length);
for (const t of missing) {
  console.log("NOLOGO", t.category, t.year_label, t.name);
}

const broken = [];
for (const t of withLogo) {
  const pub = `${url}/storage/v1/object/public/escudos/${t.logo_path}`;
  const r = await fetch(pub, { method: "HEAD" });
  if (!r.ok) {
    broken.push({
      status: r.status,
      category: t.category,
      year: t.year_label,
      name: t.name,
      path: t.logo_path,
    });
  }
}
console.log("broken urls", broken.length);
for (const c of broken) {
  console.log("BROKEN", c.status, c.category, c.year, c.name, c.path);
}

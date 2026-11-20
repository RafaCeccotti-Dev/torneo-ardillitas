import fs from "fs";
import { execSync } from "child_process";
import path from "path";

const docx = process.argv[2];
const tmp = path.join(process.cwd(), ".tmp-fem-docx");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execSync(`tar -xf "${docx}" -C "${tmp}"`);
const xml = fs.readFileSync(path.join(tmp, "word", "document.xml"), "utf8");

function cellText(cellXml) {
  return cellXml
    .replace(/<\/w:p>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

const tables = [...xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)].map((m) => m[0]);
console.log(`TABLES: ${tables.length}`);
tables.forEach((table, ti) => {
  const rows = [...table.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
  console.log(`\n=== TABLE ${ti + 1} rows=${rows.length} ===`);
  for (const row of rows) {
    const cells = [...row.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map((m) => cellText(m[0]));
    console.log(cells.join(" | "));
  }
});
fs.rmSync(tmp, { recursive: true, force: true });

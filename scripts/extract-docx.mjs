import fs from "fs";
import { execSync } from "child_process";
import path from "path";

const docx = process.argv[2];
const tmp = path.join(process.cwd(), ".tmp-fem-docx");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execSync(`tar -xf "${docx}" -C "${tmp}"`);
const xml = fs.readFileSync(path.join(tmp, "word", "document.xml"), "utf8");
const text = xml
  .replace(/<\/w:p>/g, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&apos;/g, "'");
process.stdout.write(text);
fs.rmSync(tmp, { recursive: true, force: true });

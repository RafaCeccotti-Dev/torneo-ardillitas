import fs from "fs";
import path from "path";

import { assertAccreditationPdf } from "@/lib/accreditation-pdf-assert";
import { buildAccreditationPdf, normalizeRosterPlayers } from "@/lib/accreditation-pdf";

const players = Array.from({ length: 10 }, (_, index) => ({
  firstName: ["Theo", "Enzo", "Mirko", "Gino", "Ciro", "Ivan", "Franco", "Noah", "Felipe", "Benjamin"][index],
  lastName: ["Landriel", "Arevalo", "Almaraz", "Nievas", "Balbin", "Zapata", "Gonzalez", "Garcia", "Ruiz", "Gomez"][index],
  dni: String(54450000 + index),
  birthDate: "2015-03-12",
  jerseyNumber: index === 9 ? 13 : index + 1,
}));

const input = {
  clubName: "Sportivo Norte de Rafaela",
  categoryLabel: "2015 · Masculino · Grupo A",
  players,
  staff: [
    { role: "dt" as const, firstName: "Mariano", lastName: "Landriel", dni: "33722580", phone: "3492590966" },
    { role: "delegado" as const, firstName: "Daiana", lastName: "Villarruel", dni: "36887357", phone: "03492602283" },
  ],
};

async function main() {
  let failed = false;
  try {
    normalizeRosterPlayers([{ ...players[0], jerseyNumber: null }]);
    failed = true;
  } catch {
    // expected
  }
  if (failed) throw new Error("Debía rechazar plantel sin camiseta");

  const pdfBytes = await buildAccreditationPdf(input);
  const buf = Buffer.from(pdfBytes);
  if (buf.length < 50_000) {
    throw new Error(`PDF vacío o truncado (${buf.length} bytes)`);
  }
  await assertAccreditationPdf(buf, input);

  const outDir = path.join("tmp-pdf-work");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "selfcheck.pdf"), buf);
  console.log("ok", buf.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

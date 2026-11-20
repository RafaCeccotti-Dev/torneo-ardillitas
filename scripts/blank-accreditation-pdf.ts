import fs from "fs";
import path from "path";

import { buildBlankAccreditationPdf } from "../src/lib/accreditation-pdf";

async function main() {
  const bytes = Buffer.from(await buildBlankAccreditationPdf());
  const desktop = path.join("C:/Users/PC/Desktop/LISTA DE BUENA FE VACIA.pdf");
  fs.writeFileSync(desktop, bytes);
  console.log("ok", bytes.length, desktop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

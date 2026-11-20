import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, PDFString } from "pdf-lib";

const OUT = path.join(
  "C:/Users/PC/Desktop/Proyectos",
  "LINKS ACREDITACION FEMENINO ARDILLITAS 2026.pdf",
);

const CLUBS = [
  {
    name: "Central Argentino Olimpico",
    cats: "2011 y 2013",
    url: "https://torneo-ardillitas.vercel.app/plantel/28629a40c538eac633fb3981ba0d31c14730",
  },
  {
    name: "Las Pumas",
    cats: "2011 y 2013",
    url: "https://torneo-ardillitas.vercel.app/plantel/021278cc4f7375753f00766ceff4b881420c",
  },
  {
    name: "Warmis Unidas",
    cats: "2011 y 2013",
    url: "https://torneo-ardillitas.vercel.app/plantel/fc87e65cc1a8bf98dd6304afc60bdc4e82f0",
  },
  {
    name: "Colonia Alpina",
    cats: "2013",
    url: "https://torneo-ardillitas.vercel.app/plantel/6a4de2c35543857fe9c4be129d13a01688b8",
  },
  {
    name: "Esc. Raul Toloza",
    cats: "2013",
    url: "https://torneo-ardillitas.vercel.app/plantel/ff096caf0ddb6bc0c5c3cac69fc96fef6379",
  },
  {
    name: "Atletico Selva",
    cats: "2011",
    url: "https://torneo-ardillitas.vercel.app/plantel/2f79b3d02fa73f5fd2bccbe58c27ba697a13",
  },
  {
    name: "R. Sayana",
    cats: "2011",
    url: "https://torneo-ardillitas.vercel.app/plantel/10a85923790e1939ee4a154bc38424725425",
  },
  {
    name: "Talleres",
    cats: "2011",
    url: "https://torneo-ardillitas.vercel.app/plantel/24b885daf4920dd124784ef05b535bc33c84",
  },
];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ink = rgb(0.07, 0.07, 0.07);
const muted = rgb(0.38, 0.38, 0.38);
const gold = rgb(0.78, 0.62, 0.08);
const paper = rgb(1, 1, 1);
const band = rgb(0.08, 0.08, 0.08);
const card = rgb(0.97, 0.97, 0.95);
const line = rgb(0.85, 0.85, 0.82);

const doc = await PDFDocument.create();
const page = doc.addPage([PAGE_W, PAGE_H]);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const regular = await doc.embedFont(StandardFonts.Helvetica);

page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: paper });
page.drawRectangle({ x: 0, y: PAGE_H - 78, width: PAGE_W, height: 78, color: band });
page.drawRectangle({ x: 0, y: PAGE_H - 82, width: PAGE_W, height: 4, color: gold });

page.drawText("TORNEO ARDILLITAS XVII", {
  x: 36,
  y: PAGE_H - 36,
  size: 11,
  font: bold,
  color: gold,
});
page.drawText("Links de acreditacion · Futbol femenino", {
  x: 36,
  y: PAGE_H - 56,
  size: 16,
  font: bold,
  color: rgb(1, 1, 1),
});
page.drawText("Un link por club. Si juegan 2011 y 2013, cargan las dos categorias ahi.", {
  x: 36,
  y: PAGE_H - 108,
  size: 10,
  font: regular,
  color: muted,
});

const left = 36;
const width = PAGE_W - 72;
const rowH = 68;
let y = PAGE_H - 128;

for (const club of CLUBS) {
  const bottom = y - rowH;
  page.drawRectangle({
    x: left,
    y: bottom,
    width,
    height: rowH - 8,
    color: card,
    borderColor: line,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: left,
    y: bottom,
    width: 5,
    height: rowH - 8,
    color: gold,
  });

  page.drawText(club.name, {
    x: left + 18,
    y: y - 26,
    size: 13,
    font: bold,
    color: ink,
  });
  page.drawText(`Categoria ${club.cats}`, {
    x: left + 18,
    y: y - 42,
    size: 9,
    font: regular,
    color: muted,
  });

  const urlSize = 8.5;
  const urlY = y - 58;
  page.drawText(club.url, {
    x: left + 18,
    y: urlY,
    size: urlSize,
    font: regular,
    color: rgb(0.12, 0.28, 0.62),
  });

  const urlW = regular.widthOfTextAtSize(club.url, urlSize);
  const annot = page.doc.context.register(
    page.doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [left + 16, urlY - 3, left + 18 + urlW + 4, urlY + 12],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of(club.url),
      },
    }),
  );
  page.node.addAnnot(annot);

  y -= rowH;
}

page.drawText("Torneo Ardillitas · Club Central Argentino Olimpico · Ceres", {
  x: 36,
  y: 28,
  size: 8,
  font: regular,
  color: muted,
});

const bytes = await doc.save();
fs.writeFileSync(OUT, bytes);
console.log(OUT);
console.log(bytes.length);

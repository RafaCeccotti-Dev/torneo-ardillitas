import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const OUT = "C:/Users/PC/Desktop/CAPTURA ARDILLITAS";
const BASE = "https://torneo-ardillitas.vercel.app";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const shots = [
  { file: "01-inicio", path: "/", zoom: 0.86 },
  { file: "02-partidos", path: "/partidos/masculino/2016" },
  { file: "03-tabla", path: "/tabla/masculino/2015" },
  { file: "04-femenino", path: "/partidos/femenino/2015" },
  { file: "05-club", path: "/club" },
  { file: "06-ubicaciones", path: "/ubicaciones" },
];

async function hideChrome(page) {
  await page.evaluate(() => {
    document.querySelectorAll('a[aria-label*="WhatsApp"], a[href*="wa.me"]').forEach((el) => {
      el.style.setProperty("display", "none", "important");
    });
  });
}

async function waitReady(page) {
  await page.waitForNetworkIdle({ idleTime: 600, timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.all(
      imgs.map((img) =>
        img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; }),
      ),
    );
  });
  await new Promise((r) => setTimeout(r, 400));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: null,
    args: ["--hide-scrollbars", "--disable-gpu"],
  });

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 488, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await mobile.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  );

  for (const shot of shots) {
    await mobile.goto(BASE + shot.path, { waitUntil: "networkidle2", timeout: 60000 });
    await hideChrome(mobile);
    if (shot.zoom) {
      await mobile.evaluate((z) => {
        document.documentElement.style.zoom = String(z);
      }, shot.zoom);
    }
    await waitReady(mobile);
    await mobile.evaluate(() => window.scrollTo(0, 0));
    const dest = path.join(OUT, `${shot.file}.png`);
    await mobile.screenshot({ path: dest, type: "png" });
    console.log("ok", dest);
  }

  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  for (const shot of [
    { file: "07-inicio-desktop", path: "/" },
    { file: "08-partidos-desktop", path: "/partidos/masculino/2016" },
    { file: "09-tabla-desktop", path: "/tabla/masculino/2015" },
  ]) {
    await desktop.goto(BASE + shot.path, { waitUntil: "networkidle2", timeout: 60000 });
    await hideChrome(desktop);
    await waitReady(desktop);
    await desktop.evaluate(() => window.scrollTo(0, 0));
    const dest = path.join(OUT, `${shot.file}.png`);
    await desktop.screenshot({ path: dest, type: "png" });
    console.log("ok", dest);
  }

  await browser.close();
  console.log("done", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

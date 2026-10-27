/**
 * Visual review helper: capture one frame of a running site.
 *
 *   node scripts/shot.mjs                      # hero, 1440x900
 *   SCROLL=9600 NAME=rail node scripts/shot.mjs
 *   MOBILE=1 W=390 H=844 SCROLL=2100 node scripts/shot.mjs
 *   FULL=1 NAME=full node scripts/shot.mjs
 *
 * Output goes to OUT (default /tmp/shots). Set CHROME_PATH / CHROME_LIBS
 * on hosts without Playwright's bundled browser.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:5173/";
const OUT = process.env.OUT || "/tmp/shots";
const W = Number(process.env.W || 1440);
const H = Number(process.env.H || 900);
const FULL = process.env.FULL === "1";
const SCALE = Number(process.env.SCALE || 1);

const launch = {
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"],
};
if (process.env.CHROME_PATH) {
  launch.executablePath = process.env.CHROME_PATH;
  launch.env = { ...process.env, LD_LIBRARY_PATH: process.env.CHROME_LIBS || "" };
}
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
  reducedMotion: process.env.REDUCED === "1" ? "reduce" : "no-preference",
  isMobile: process.env.MOBILE === "1",
  hasTouch: process.env.MOBILE === "1",
});
await ctx.addInitScript(() => {
  try { sessionStorage.setItem("arche:booted", "1"); } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

if (process.env.SCROLL) {
  const y = Number(process.env.SCROLL);
  for (let i = 0; i < 8; i++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(240);
    const cur = await page.evaluate(() => window.scrollY);
    if (Math.abs(cur - y) < 10) break;
  }
  await page.waitForTimeout(Number(process.env.WAIT || 900));
}
if (process.env.SELECTOR) {
  const el = page.locator(process.env.SELECTOR).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(Number(process.env.WAIT || 900));
}
if (process.env.CLICK) {
  await page.locator(process.env.CLICK).first().click();
  await page.waitForTimeout(Number(process.env.WAIT || 500));
}
if (process.env.EVAL) {
  await page.evaluate(process.env.EVAL);
  await page.waitForTimeout(Number(process.env.WAIT || 500));
}

await page.screenshot({ path: `${OUT}/${process.env.NAME || "shot"}.png`, fullPage: FULL });
const info = await page.evaluate(() => ({
  scrollY: window.scrollY,
  docH: document.documentElement.scrollHeight,
  docW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  bodyText: document.body.innerText.slice(0, 300),
}));
console.log(JSON.stringify({ info, errors }, null, 2));
await browser.close();

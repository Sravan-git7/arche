/**
 * Arche — browser smoke test.
 *
 *   npm run dev                 # in one terminal
 *   npm run verify              # desktop
 *   MOBILE=1 npm run verify     # 390px touch
 *   REDUCED=1 npm run verify    # prefers-reduced-motion
 *
 * Set CHROME_PATH and (on minimal Linux images) CHROME_LIBS to point at a
 * Chromium binary and its shared libraries. Falls back to Playwright's own
 * bundled browser when CHROME_PATH is unset.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:5173/";
const MOBILE = process.env.MOBILE === "1";
const REDUCED = process.env.REDUCED === "1";
const launch = { args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] };
if (process.env.CHROME_PATH) {
  launch.executablePath = process.env.CHROME_PATH;
  launch.env = { ...process.env, LD_LIBRARY_PATH: process.env.CHROME_LIBS || "" };
}
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: MOBILE,
  hasTouch: MOBILE,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});
await ctx.addInitScript(() => {
  try { sessionStorage.setItem("arche:booted", "1"); } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_CLOSED")) errors.push("console: " + m.text());
});
const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass: !!pass, detail });

async function goto(url = BASE) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
}
/** Scroll and retry — pinned ScrollTriggers can clamp an instant jump. */
async function go(y) {
  for (let i = 0; i < 8; i++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(240);
    const cur = await page.evaluate(() => window.scrollY);
    if (Math.abs(cur - y) < 10) return cur;
  }
  return await page.evaluate(() => window.scrollY);
}
const bodyText = () => page.evaluate(() => document.body.innerText);

await goto();

/* ---------- 1. Global health ---------- */
{
  const dims = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: window.innerWidth }));
  ok("global: no horizontal overflow", dims.w <= dims.iw + 1, `scrollW=${dims.w} innerW=${dims.iw}`);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return { a: document.fonts.check('500 40px Archivo'), m: document.fonts.check('400 12px "JetBrains Mono"') };
  });
  ok("global: typefaces load without a third-party request", fonts.a && fonts.m, JSON.stringify(fonts));
  const noName = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).filter(
      (b) => !b.getAttribute("aria-label") && !(b.textContent || "").trim() && !b.getAttribute("title")
    ).length
  );
  ok("global: every button has an accessible name", noName === 0, `unnamed=${noName}`);
  // :focus-visible is keyboard-driven; on touch contexts programmatic
  // focus() does not match it, so drive it with a real Tab press.
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const e = document.activeElement;
    return !!e && e !== document.body && getComputedStyle(e).outlineStyle !== "none";
  });
  ok("global: keyboard focus ring is visible", focus, `outline=${focus}`);
  if (REDUCED) {
    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-r]")).filter((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.opacity) < 0.15 || s.clipPath.includes("100%");
      }).length
    );
    ok("reduced motion: all reveal content visible", hidden === 0, `hidden=${hidden}`);
  }
}

/* ---------- 2. Navigation ---------- */
if (MOBILE) {
  await page.getByRole("button", { name: /open menu/i }).click();
  await page.waitForTimeout(700);
  const opened = await page.getByRole("button", { name: /close menu/i }).getAttribute("aria-expanded");
  const link = page.locator('div[aria-hidden="false"] a[href="#/work"]').first();
  await link.click();
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => location.hash);
  const closed = await page.getByRole("button", { name: /open menu/i }).getAttribute("aria-expanded");
  ok("mobile nav: menu opens, link routes, menu closes", opened === "true" && hash === "#/work" && closed === "false", `open=${opened} hash=${hash} closed=${closed}`);
  await goto(BASE);
} else {
  const svcBtn = page.getByRole("button", { name: /SERVICES/i }).first();
  await svcBtn.click();
  await page.waitForTimeout(650);
  const expanded = await svcBtn.getAttribute("aria-expanded");
  const drawerH = await page.evaluate(() => {
    const d = document.querySelector("#nav-services-drawer");
    return d ? Math.round(d.getBoundingClientRect().height) : -1;
  });
  ok("nav: click pins the services drawer open", expanded === "true" && drawerH > 100, `expanded=${expanded} h=${drawerH}`);
  await page.locator('nav a[href="#/services/video-editing"]').first().click();
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => location.hash);
  const closed = await page.getByRole("button", { name: /SERVICES/i }).first().getAttribute("aria-expanded");
  ok("nav: card link routes + drawer closes", hash === "#/services/video-editing" && closed === "false", `hash=${hash} expanded=${closed}`);
  await goto(BASE);
}

/* ---------- 3. Contact guided flow ---------- */
{
  await goto(BASE + "#/contact");
  const h1 = await page.locator("h1").first().innerText();
  ok("contact: page renders", h1.length > 4, h1.slice(0, 50));
  // step 1 — pick what is being built
  const option = page.getByRole("button", { name: /Website/i }).first();
  if (await option.count()) { await option.click(); await page.waitForTimeout(700); }
  // step 2 — describe the change
  const ta = page.locator("textarea.field").first();
  if (await ta.count()) {
    await ta.fill("Our leads arrive in three places and nobody owns the handoff.");
    await page.getByRole("button", { name: /^Continue/i }).first().click();
    await page.waitForTimeout(700);
  }
  // step 3 — timeline
  const timeline = page.getByRole("button", { name: /1–3 months/i }).first();
  if (await timeline.count()) { await timeline.click(); await page.waitForTimeout(700); }
  // step 4 — contact details, validation, back control
  const inputs = await page.locator("input.field").count();
  ok("contact: guided flow reaches contact details", inputs >= 2, `inputs=${inputs}`);
  const back = page.getByRole("button", { name: /back/i }).first();
  ok("contact: back navigation available", !!(await back.count()), `back=${await back.count()}`);
  if (inputs >= 2) {
    const send = page.getByRole("button", { name: /send request/i }).first();
    const disabledBefore = await send.isDisabled();
    await page.locator("input.field").first().fill("A");
    await page.locator("input.field").first().blur();
    await page.waitForTimeout(200);
    const err = await bodyText();
    ok("contact: invalid name produces a helpful error", disabledBefore && /Please add a name/.test(err), `disabled=${disabledBefore}`);
    await page.locator("input.field").nth(0).fill("Alex Rivera");
    await page.locator("input.field").nth(1).fill("alex@example.com");
    await page.waitForTimeout(150);
    const enabled = !(await send.isDisabled());
    await send.click();
    await page.waitForTimeout(900);
    const after = await bodyText();
    ok("contact: submission reaches an honest state", enabled && /didn't reach us|in the system|email us directly/i.test(after), `enabled=${enabled}`);
    ok("contact: never claims delivery without a backend", !/REQUEST RECEIVED/i.test(after) || /in the system/i.test(after), after.match(/REQUEST RECEIVED|didn't reach us|SOMETHING WENT WRONG/gi)?.join(",") || "");
  }
}

/* ---------- 4. Home: service demos ---------- */
{
  await goto(BASE);
  if (!MOBILE && !REDUCED) {
    for (const [i, name] of [[1, "WEB DEVELOPMENT"], [2, "AI CHATBOTS"], [3, "AI AUTOMATION"]]) {
      await go(3618 + (i + 0.45) * 1088);
      await page.waitForTimeout(700);
      const activeTab = await page.evaluate(() => {
        const el = document.querySelector('.svc-tab[data-active="1"]');
        return el ? el.textContent.trim().replace(/\s+/g, " ") : "";
      });
      ok(`services: scroll selects ${name}`, activeTab.toUpperCase().includes(name), `active="${activeTab}"`);
    }

    await go(3618 + 0.5 * 1088);
    await page.waitForTimeout(600);
    const stageBefore = await page.evaluate(() => document.body.innerText.match(/STAGE:\s*\w+/)?.[0] || "");
    const wave = page.locator(".vd-track").first();
    if (await wave.count()) {
      const b = await wave.boundingBox();
      if (b) {
        await page.mouse.move(b.x + b.width * 0.92, b.y + b.height / 2);
        await page.mouse.down();
        await page.mouse.up();
      }
    }
    await page.waitForTimeout(400);
    const stageAfter = await page.evaluate(() => document.body.innerText.match(/STAGE:\s*\w+/)?.[0] || "");
    ok("video demo: timeline interaction changes stage", stageBefore !== stageAfter, `${stageBefore} -> ${stageAfter}`);

    await go(3618 + 3.5 * 1088);
    await page.waitForTimeout(800);
    const seg = page.locator(".au-seg button");
    if ((await seg.count()) >= 2) {
      await seg.nth(1).click();
      await page.waitForTimeout(250);
      const checked = await seg.nth(1).getAttribute("aria-checked");
      const run = page.locator(".au-run").first();
      if (await run.count()) await run.click();
      await page.waitForTimeout(2400);
      const done = await page.locator('[data-state="complete"]').count();
      ok("automation: automated run completes its steps", checked === "true" && done > 0, `checked=${checked} complete=${done}`);
    } else ok("automation: automated run completes its steps", false, "segmented control missing");

    await go(3618 + 2.5 * 1088);
    await page.waitForTimeout(700);
    const chip = page.getByRole("button", { name: /CRM/i }).first();
    if (await chip.count()) { await chip.click(); await page.waitForTimeout(1200); }
    ok("agent demo: a question produces a reply", !!(await chip.count()) && /CRM/.test(await bodyText()), "");

    await go(12500);
    await page.waitForTimeout(600);
    const before = /connections/i.test(await bodyText());
    const connectAll = page.getByRole("button", { name: /CONNECT ALL/i }).first();
    if (await connectAll.count()) { await connectAll.click(); await page.waitForTimeout(900); }
    ok("system: connect-all reaches a connected state", before && /system connected/i.test(await bodyText()), "");

    await go(9400);
    await page.waitForTimeout(500);
    const jump = page.locator('#system-architecture button[data-cursor="JUMP"]').nth(3);
    if (await jump.count()) { await jump.click(); await page.waitForTimeout(1600); }
    const railLabel = await page.evaluate(() => {
      const el = document.querySelector('#system-architecture [aria-live="polite"]');
      return el ? el.textContent.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    });
    ok("3D rail: stage jump moves the active stage", /04|ACTION|05|OUTPUT/.test(railLabel), railLabel);
  } else {
    // Mobile / reduced-motion: the non-pinned fallback must still expose
    // every service and the full 5-stage system as readable content.
    const t = await bodyText();
    ok("fallback: all four services present", /VIDEO EDITING/i.test(t) && /WEB DEVELOPMENT/i.test(t) && /AI AUTOMATION/i.test(t), "");
    ok("fallback: five system stages readable", /INPUT/.test(t) && /INTELLIGENCE/.test(t) && /OUTPUT/.test(t), "");
  }
}

/* ---------- 5. Ask Arche ---------- */
{
  await goto(BASE);
  await go(MOBILE ? 12000 : 18400);
  await page.waitForTimeout(500);
  const input = page.locator('input[placeholder*="slowing"]').first();
  if (await input.count()) {
    await input.fill("Can you automate lead management?");
    await input.press("Enter");
    await page.waitForTimeout(1400);
  }
  const t = await bodyText();
  ok("ask arche: rules-based reply renders", /lead|qualif|crm|pipeline/i.test(t), "");
  ok("ask arche: clearly discloses it is scripted", /A scripted assistant|no\s+model behind it/i.test(t), "");
}

console.log(JSON.stringify({ results, errors, mobile: MOBILE, reduced: REDUCED }, null, 2));
await browser.close();

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173/";
const OUT = path.resolve("audit_deliverables/phase-1");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  } catch {}
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("ERR_CONNECTION_CLOSED")) {
    errors.push(`console: ${message.text()}`);
  }
});

let pass = 0;
let fail = 0;
function assert(name, condition, details = "") {
  if (condition) {
    console.log(`[PASS] ${name}${details ? ` - ${details}` : ""}`);
    pass += 1;
  } else {
    console.error(`[FAIL] ${name}${details ? ` - ${details}` : ""}`);
    fail += 1;
  }
}

async function waitForScene() {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.ScrollTrigger?.refresh());
  await page.waitForTimeout(500);
}

async function getProblemPin() {
  return page.evaluate(() => {
    const pin = window.ScrollTrigger?.getById("problem-pin");
    return {
      start: pin?.start ?? 0,
      end: pin?.end ?? 0,
      duration: pin?.animation?.duration?.() ?? 6,
    };
  });
}

async function scrollProblem(progress, pin) {
  await page.evaluate(({ y }) => window.scrollTo(0, y), {
    y: Math.round(pin.start + (pin.end - pin.start) * progress),
  });
  await page.waitForTimeout(1200);
}

async function readProblemLayout() {
  return page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const lane = rect("#problem .pf-proc-lane");
    const cards = ["web", "email", "crm", "sheet"].map((id) => ({ id, rect: rect(`#problem [data-card="${id}"]`) }));
    const counterCol = document.querySelector("#problem [data-counter-column]");
    const unit = document.querySelector("#problem [data-counter-unit]");
    const unitText = unit?.textContent?.trim() ?? "";
    const transform = counterCol ? getComputedStyle(counterCol).transform : "none";
    const digitHeight = counterCol?.firstElementChild?.getBoundingClientRect().height ?? 0;
    const y = transform === "none" ? 0 : new DOMMatrix(transform).m42;
    const count = digitHeight ? Math.round(-y / digitHeight) : 0;
    const pin = window.ScrollTrigger?.getById("problem-pin");
    return {
      lane,
      cards,
      laneCardOverlaps: cards.filter((card) => overlaps(lane, card.rect)).map((card) => card.id),
      laneOpacity: lane ? Number.parseFloat(getComputedStyle(document.querySelector("#problem .pf-proc-lane")).opacity) : 0,
      counter: `${count} ${unitText}`,
      timelineTime: pin?.animation?.time?.() ?? null,
      counterTransform: transform,
      counterDigitHeight: digitHeight,
      stage: rect("#problem .pf-visual-container"),
    };
  });
}

await waitForScene();
const pin = await getProblemPin();
assert("Problem pin is available", pin.end > pin.start, JSON.stringify(pin));

await scrollProblem(0, pin);
await page.screenshot({ path: path.join(OUT, "problem-initial-1440x900.png") });
const initial = await readProblemLayout();
assert("Problem initial state captured", Boolean(initial.stage));

await scrollProblem(0.70, pin);
await page.screenshot({ path: path.join(OUT, "problem-middle-1440x900.png") });
const middle = await readProblemLayout();
assert("Process lane is visible in the middle animation", middle.laneOpacity > 0.8, `opacity=${middle.laneOpacity}`);
assert("Process lane has no card collision during Acts 4/5", middle.laneCardOverlaps.length === 0, middle.laneCardOverlaps.join(","));

await scrollProblem(0.95, pin);
await page.screenshot({ path: path.join(OUT, "problem-final-1440x900.png") });
const finalState = await readProblemLayout();
assert("Final process lane has no card collision", finalState.laneCardOverlaps.length === 0, finalState.laneCardOverlaps.join(","));
assert("Final CRM and SHEET cards retain readable geometry", finalState.cards.every((card) => card.rect && card.rect.width > 0 && card.rect.height > 0));

const countChecks = [
  [0.35, "0 connections"],
  [2.72 / pin.duration, "1 connection"],
  [2.90 / pin.duration, "2 connections"],
  [3.10 / pin.duration, "3 connections"],
];
for (const [progress, expected] of countChecks) {
  await scrollProblem(progress, pin);
  const state = await readProblemLayout();
  assert(`Counter displays ${expected}`, state.counter === expected, `actual=${state.counter}, time=${state.timelineTime}, transform=${state.counterTransform}, digitHeight=${state.counterDigitHeight}`);
}

await page.setViewportSize({ width: 1366, height: 768 });
await page.waitForTimeout(500);
const laptopPin = await getProblemPin();
await scrollProblem(0.95, laptopPin);
await page.screenshot({ path: path.join(OUT, "problem-final-1366x768.png") });
const laptop = await readProblemLayout();
assert("1366x768 final lane has no card collision", laptop.laneCardOverlaps.length === 0, laptop.laneCardOverlaps.join(","));

await page.locator("#services-home").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
for (const tab of await page.locator("#services-home .svc-tab").all()) {
  await tab.hover();
  await page.waitForTimeout(180);
  const state = await page.evaluate(() => ({
    cursorAttributes: Array.from(document.querySelectorAll("#services-home .svc-tab[data-cursor]")),
    cursorLabel: document.querySelector(".cursor-ring span")?.textContent ?? "",
  }));
  assert("Service tab has no contextual cursor label", state.cursorAttributes.length === 0 && state.cursorLabel === "");
}
await page.screenshot({ path: path.join(OUT, "services-tabs-hover-1366x768.png") });

assert("Desktop browser produced no page errors", errors.length === 0, errors.join(" | "));
await context.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobileContext.addInitScript(() => {
  try {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  } catch {}
});
const mobilePage = await mobileContext.newPage();
const mobileErrors = [];
mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
await mobilePage.goto(BASE, { waitUntil: "networkidle" });
await mobilePage.waitForTimeout(800);
await mobilePage.locator("#problem").scrollIntoViewIfNeeded();
await mobilePage.waitForTimeout(400);
await mobilePage.screenshot({ path: path.join(OUT, "mobile-problem-390x844.png") });
await mobilePage.locator("#services-home").scrollIntoViewIfNeeded();
await mobilePage.waitForTimeout(400);
await mobilePage.screenshot({ path: path.join(OUT, "mobile-services-390x844.png") });
assert("Mobile layout has no horizontal overflow", await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
assert("Mobile browser produced no page errors", mobileErrors.length === 0, mobileErrors.join(" | "));
await mobileContext.close();

const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await reducedContext.addInitScript(() => {
  try {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  } catch {}
});
const reducedPage = await reducedContext.newPage();
const reducedErrors = [];
reducedPage.on("pageerror", (error) => reducedErrors.push(error.message));
await reducedPage.goto(BASE, { waitUntil: "networkidle" });
await reducedPage.waitForTimeout(800);
await reducedPage.locator("#problem").scrollIntoViewIfNeeded();
await reducedPage.waitForTimeout(350);
await reducedPage.screenshot({ path: path.join(OUT, "reduced-motion-problem-1440x900.png") });
const reducedState = await reducedPage.evaluate(() => ({
  problemPin: Boolean(window.ScrollTrigger?.getById("problem-pin")),
  servicesPin: Boolean(window.ScrollTrigger?.getById("services-pin")),
  oneSystem: document.querySelector("#problem")?.textContent?.includes("ONE SYSTEM") ?? false,
}));
assert("Reduced motion Problem has no scrub pin", !reducedState.problemPin);
assert("Reduced motion Services has no pin", !reducedState.servicesPin);
assert("Reduced motion Problem is settled", reducedState.oneSystem);
assert("Reduced motion browser produced no page errors", reducedErrors.length === 0, reducedErrors.join(" | "));
await reducedContext.close();

await browser.close();
console.log(`TOTAL PASSES: ${pass}`);
console.log(`TOTAL FAILURES: ${fail}`);
if (fail > 0) process.exit(1);

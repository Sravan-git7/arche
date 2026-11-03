import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173/";
const OUT = path.resolve("audit_deliverables/problem-section-2");
fs.mkdirSync(OUT, { recursive: true });

async function run() {
  console.log("=== STARTING ARCHÉ PROBLEM SECTION 2.0 FULL VERIFICATION ===");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  let pass = 0;
  let fail = 0;
  function assert(name, condition, extra = "") {
    if (condition) {
      console.log(`[PASS] ${name}${extra ? " - " + extra : ""}`);
      pass++;
    } else {
      console.error(`[FAIL] ${name}${extra ? " - " + extra : ""}`);
      fail++;
    }
  }

  // ------------------------------------------------------------------
  // 1. DESKTOP 1440x900 CINEMATIC PROGRESSION
  // ------------------------------------------------------------------
  console.log("\n--- TEST SUITE 1: Desktop (1440x900) 5-Act Progression ---");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });

  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_CLOSED")) {
      errors.push("console: " + m.text());
    }
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.ScrollTrigger?.refresh());
  await page.waitForTimeout(400);

  // Measure triggers
  const pinData = await page.evaluate(() => {
    const st = window.ScrollTrigger?.getById("problem-pin");
    return {
      start: st ? st.start : 0,
      end: st ? st.end : 0,
      duration: st?.animation?.duration() ?? 6,
    };
  });
  console.log("Problem Pin Bounds:", pinData);
  assert("Problem pin exists and has positive scrub range", pinData.end > pinData.start);

  const scrollToP = async (p, waitMs = 500) => {
    const y = Math.round(pinData.start + (pinData.end - pinData.start) * p);
    await page.evaluate((targetY) => window.scrollTo(0, targetY), y);
    await page.waitForTimeout(waitMs);
  };

  // Checkpoint 0: Initial State (p = 0.00)
  await scrollToP(0.00);
  await page.screenshot({ path: path.join(OUT, "01_problem_initial_1440x900.png") });
  const p0Metrics = await page.evaluate(() => {
    const headline = document.querySelector("#problem .pf-head-line");
    const hRect = headline?.getBoundingClientRect();
    const stateEl = document.querySelector("#problem [data-problem-state]");
    const counter = document.querySelector("#problem [data-counter-unit]");
    return {
      headlineTop: hRect?.top,
      headlineHeight: hRect?.height,
      headlineVisible: hRect ? hRect.top >= 0 && hRect.bottom <= window.innerHeight : false,
      state: stateEl?.textContent?.trim(),
      counterUnit: counter?.textContent?.trim(),
    };
  });
  console.log("Initial state metrics:", p0Metrics);
  assert("Headline is visible and not clipped by top navigation", p0Metrics.headlineTop > 60);
  assert("Initial state is Disconnected", p0Metrics.state === "Disconnected");
  assert("Initial counter unit is connections", p0Metrics.counterUnit === "connections");

  // Checkpoint 1: Act 01 (p = 0.15) — Fragmented Ecosystem
  await scrollToP(0.15);
  await page.screenshot({ path: path.join(OUT, "02_problem_act01_fragmented_1440x900.png") });
  const act1Metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("#problem [data-card]"));
    const web = document.querySelector('#problem [data-card="web"]');
    return {
      cardCount: cards.length,
      webOpacity: web ? window.getComputedStyle(web).opacity : "0",
    };
  });
  assert("Act 01: All 4 distinct software cards mounted", act1Metrics.cardCount === 4);

  // Checkpoint 2: Act 02 (p = 0.35) — Connection Failure & Delay
  await scrollToP(0.35);
  await page.screenshot({ path: path.join(OUT, "03_problem_act02_failure_1440x900.png") });
  const act2Metrics = await page.evaluate(() => {
    const webValB = document.querySelector(".pf-web-val-b");
    const emailValB = document.querySelector(".pf-email-val-b");
    return {
      webValBOpacity: webValB ? window.getComputedStyle(webValB).opacity : "0",
      emailValBOpacity: emailValB ? window.getComputedStyle(emailValB).opacity : "0",
    };
  });
  console.log("Act 02 metrics:", act2Metrics);
  assert("Act 02: Website captured inquiry", parseFloat(act2Metrics.webValBOpacity) > 0.8);

  // Checkpoint 3: Act 03 (p = 0.55) — Reconnection & Fan-out
  await scrollToP(0.55);
  await page.screenshot({ path: path.join(OUT, "04_problem_act03_breakdown_1440x900.png") });
  const act3Metrics = await page.evaluate(() => {
    const solidConns = Array.from(document.querySelectorAll("#problem .pf-solid-conn"));
    const crmValB = document.querySelector(".pf-crm-val-b");
    return {
      connsCount: solidConns.length,
      crmValBOpacity: crmValB ? window.getComputedStyle(crmValB).opacity : "0",
    };
  });
  assert("Act 03: Solid connectors established", act3Metrics.connsCount === 3);

  // Checkpoint 4: Act 04 (p = 0.75) — Arché Connects the System
  await scrollToP(0.75);
  await page.screenshot({ path: path.join(OUT, "05_problem_act04_transformation_1440x900.png") });
  const act4Metrics = await page.evaluate(() => {
    const procLane = document.querySelector("#problem .pf-proc-lane");
    const procOpacity = procLane ? window.getComputedStyle(procLane).opacity : "0";
    const underline = document.querySelector("#problem .origin-left");
    return {
      procOpacity: parseFloat(procOpacity),
      underlineScale: underline ? window.getComputedStyle(underline).transform : "none",
    };
  });
  console.log("Act 04 metrics:", act4Metrics);
  assert("Act 04: Unified process lane revealed", act4Metrics.procOpacity > 0.8);

  // Checkpoint 5: Act 05 (p = 0.95) — One System Settled State
  await scrollToP(0.95);
  await page.screenshot({ path: path.join(OUT, "06_problem_act05_onesystem_1440x900.png") });
  const act5Metrics = await page.evaluate(() => {
    const stateEl = document.querySelector("#problem [data-problem-state]");
    const underline = document.querySelector("#problem .origin-left");
    const lineB = document.querySelector('#problem h2.transition-colors');
    const stage = document.querySelector("#problem .pf-visual-container")?.getBoundingClientRect();
    const lane = document.querySelector("#problem .pf-proc-lane")?.getBoundingClientRect();
    const cardWeb = document.querySelector('#problem [data-card="web"]')?.getBoundingClientRect();
    const cardCrm = document.querySelector('#problem [data-card="crm"]')?.getBoundingClientRect();

    const upperClearance = lane && cardWeb ? lane.top - cardWeb.bottom : 0;
    const lowerClearance = lane && cardCrm ? cardCrm.top - lane.bottom : 0;

    return {
      state: stateEl?.textContent?.trim(),
      lineBColor: lineB ? window.getComputedStyle(lineB).color : "",
      underlineTransform: underline ? window.getComputedStyle(underline).transform : "",
      upperClearance,
      lowerClearance,
      hasOverlap: lane && cardCrm ? (cardCrm.top < lane.bottom && cardCrm.bottom > lane.top) : false,
    };
  });
  console.log("Act 05 metrics:", act5Metrics);
  assert("Act 05: State is ONE SYSTEM", act5Metrics.state === "ONE SYSTEM");
  assert("Act 05: Upper clearance is generous (> 40px)", act5Metrics.upperClearance >= 40, `${act5Metrics.upperClearance.toFixed(1)}px`);
  assert("Act 05: Lower clearance is generous (> 40px)", act5Metrics.lowerClearance >= 40, `${act5Metrics.lowerClearance.toFixed(1)}px`);
  assert("Act 05: Zero card overlap with process lane", !act5Metrics.hasOverlap);

  // Checkpoint 6: Problem -> Services transition (pin end + 20px)
  await scrollToP(1.02);
  await page.screenshot({ path: path.join(OUT, "07_problem_to_services_transition.png") });
  const transitionState = await page.evaluate(() => {
    const sHome = document.querySelector("#services-home");
    const sRect = sHome?.getBoundingClientRect();
    return {
      servicesVisible: sRect ? sRect.top < window.innerHeight : false,
    };
  });
  assert("Clean transition: Services enters smoothly after Problem releases", transitionState.servicesVisible);

  // Checkpoint 7: Reverse scrub back to p = 0.00
  await scrollToP(0.00, 700);
  await page.screenshot({ path: path.join(OUT, "08_problem_reverse_idle.png") });
  const revMetrics = await page.evaluate(() => {
    const web = document.querySelector('#problem [data-card="web"]');
    const stateEl = document.querySelector("#problem [data-problem-state]");
    return {
      webTransform: web ? window.getComputedStyle(web).transform : "",
      state: stateEl?.textContent?.trim(),
    };
  });
  assert("Reversible scroll: Restores Disconnected state at p=0", revMetrics.state === "Disconnected");
  assert("Desktop browser produced zero errors", errors.length === 0, errors.join(" | "));
  await ctx.close();

  // ------------------------------------------------------------------
  // 2. LAPTOP 1366x768 BALANCED COMPOSITION
  // ------------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: Laptop (1366x768) Viewport ---");
  const laptopCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await laptopCtx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });
  const laptopPage = await laptopCtx.newPage();
  await laptopPage.goto(BASE, { waitUntil: "networkidle" });
  await laptopPage.waitForTimeout(800);

  const lPin = await laptopPage.evaluate(() => {
    const st = window.ScrollTrigger?.getById("problem-pin");
    return st ? { start: st.start, end: st.end } : null;
  });
  if (lPin) {
    const scrollY = Math.round(lPin.start + (lPin.end - lPin.start) * 0.95);
    await laptopPage.evaluate((y) => window.scrollTo(0, y), scrollY);
    await laptopPage.waitForTimeout(600);
    await laptopPage.screenshot({ path: path.join(OUT, "09_problem_laptop_1366x768_final.png") });

    const laptopMetrics = await laptopPage.evaluate(() => {
      const lane = document.querySelector("#problem .pf-proc-lane")?.getBoundingClientRect();
      const cardCrm = document.querySelector('#problem [data-card="crm"]')?.getBoundingClientRect();
      const cardWeb = document.querySelector('#problem [data-card="web"]')?.getBoundingClientRect();
      return {
        upperClearance: lane && cardWeb ? lane.top - cardWeb.bottom : 0,
        lowerClearance: lane && cardCrm ? cardCrm.top - lane.bottom : 0,
        overlap: lane && cardCrm ? (cardCrm.top < lane.bottom && cardCrm.bottom > lane.top) : false,
      };
    });
    console.log("Laptop metrics at 95%:", laptopMetrics);
    assert("Laptop 1366x768: Zero card collision", !laptopMetrics.overlap);
    assert("Laptop 1366x768: Upper clearance maintained (> 35px)", laptopMetrics.upperClearance >= 35, `${laptopMetrics.upperClearance.toFixed(1)}px`);
    assert("Laptop 1366x768: Lower clearance maintained (> 35px)", laptopMetrics.lowerClearance >= 35, `${laptopMetrics.lowerClearance.toFixed(1)}px`);
  }
  await laptopCtx.close();

  // ------------------------------------------------------------------
  // 3. MOBILE 390x844 VIEWPORT
  // ------------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: Mobile (390x844) Viewport ---");
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobileCtx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });
  const mobilePage = await mobileCtx.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", (e) => mobileErrors.push(e.message));

  await mobilePage.goto(BASE, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await mobilePage.locator("#problem").scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({ path: path.join(OUT, "10_problem_mobile_390x844.png") });
  const mobileMetrics = await mobilePage.evaluate(() => {
    const bodyW = document.body.scrollWidth;
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    const cards = Array.from(document.querySelectorAll("#problem [data-card]"));
    return {
      bodyW,
      docW,
      winW,
      hasOverflow: docW > winW + 1,
      cardCount: cards.length,
    };
  });
  console.log("Mobile metrics:", mobileMetrics);
  assert("Mobile 390x844: No horizontal overflow", !mobileMetrics.hasOverflow);
  assert("Mobile 390x844: All 4 miniature software cards rendered", mobileMetrics.cardCount === 4);
  assert("Mobile produced zero page errors", mobileErrors.length === 0, mobileErrors.join(" | "));
  await mobileCtx.close();

  // ------------------------------------------------------------------
  // 4. REDUCED MOTION PREFERENCE
  // ------------------------------------------------------------------
  console.log("\n--- TEST SUITE 4: Reduced Motion Preference ---");
  const rmCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await rmCtx.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    sessionStorage.setItem("arche:booted", "1");
  });
  const rmPage = await rmCtx.newPage();
  await rmPage.goto(BASE, { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(800);
  await rmPage.locator("#problem").scrollIntoViewIfNeeded();
  await rmPage.waitForTimeout(400);

  await rmPage.screenshot({ path: path.join(OUT, "11_problem_reduced_motion_1440x900.png") });
  const rmMetrics = await rmPage.evaluate(() => {
    const pin = window.ScrollTrigger?.getById("problem-pin");
    const text = document.querySelector("#problem")?.textContent || "";
    return {
      hasPin: Boolean(pin),
      showsOneSystem: text.includes("ONE SYSTEM"),
    };
  });
  console.log("Reduced motion metrics:", rmMetrics);
  assert("Reduced motion: Scrub pin disabled", !rmMetrics.hasPin);
  assert("Reduced motion: Settled immediately on ONE SYSTEM", rmMetrics.showsOneSystem);
  await rmCtx.close();

  await browser.close();

  console.log("\n==========================================");
  console.log(`TOTAL PASSES: ${pass}`);
  console.log(`TOTAL FAILURES: ${fail}`);
  console.log("==========================================");
  if (fail > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Verification suite failed:", e);
  process.exit(1);
});

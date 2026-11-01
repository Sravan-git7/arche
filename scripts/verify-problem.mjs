import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/9995fa9a-bb45-477a-8a4a-e1a76cac54e3";
const BASE = "http://localhost:5173/";

async function run() {
  console.log("Launching Chromium for Problem Scene verification...");
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Pre-set intro as completed so we test the Problem section smoothly
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("arche_intro", "1");
      sessionStorage.setItem("arche:booted", "1");
    } catch {}
  });

  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push("pageerror: " + err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push("console: " + msg.text());
  });

  console.log("Navigating to", BASE);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Ensure ScrollTriggers are refreshed and measure problem-pin
  await page.evaluate(() => window.ScrollTrigger?.refresh());
  await page.waitForTimeout(600);

  const pinData = await page.evaluate(() => {
    const st = window.ScrollTrigger?.getById("problem-pin");
    return {
      pinStart: st ? st.start : 681,
      pinEnd: st ? st.end : 681 + 2340,
      totalDist: st ? (st.end - st.start) : 2340,
    };
  });

  console.log("Problem pin data:", pinData);

  const scrollToP = async (p) => {
    const scrollY = Math.round(pinData.pinStart + pinData.totalDist * p);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(400);
    return scrollY;
  };

  // -------------------------------------------------------------
  // CHECKPOINT 1: p = 0.00 (IDLE)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 0.00 (IDLE) ---");
  await scrollToP(0.00);
  const p0Screenshot = path.join(ARTIFACT_DIR, "problem_p0_idle.png");
  await page.screenshot({ path: p0Screenshot });
  console.log("Saved p=0 screenshot:", p0Screenshot);

  const p0State = await page.evaluate(() => {
    const counter = document.querySelector("#problem .mono span")?.textContent || "";
    const disconnected = document.querySelector("#problem .transition-colors")?.textContent || "";
    const cardWeb = document.querySelector('#problem [data-card="web"]');
    const underline = document.querySelector("#problem .origin-left");
    return {
      counter,
      disconnected,
      cardWebBorder: cardWeb ? getComputedStyle(cardWeb).borderColor : "",
      underlineScale: underline ? getComputedStyle(underline).transform : "",
    };
  });
  console.log("p=0 evaluation:", p0State);

  // -------------------------------------------------------------
  // CHECKPOINT 2: p = 0.20 (SIGNAL LANDED, WEBSITE LIME)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 0.20 (WEBSITE LIME) ---");
  await scrollToP(0.20);
  const p20Screenshot = path.join(ARTIFACT_DIR, "problem_p20_website_active.png");
  await page.screenshot({ path: p20Screenshot });
  console.log("Saved p=0.20 screenshot:", p20Screenshot);

  const p20State = await page.evaluate(() => {
    const cardWeb = document.querySelector('#problem [data-card="web"]');
    return {
      cardWebBorder: cardWeb ? getComputedStyle(cardWeb).borderColor : "",
    };
  });
  console.log("p=0.20 evaluation:", p20State);

  // -------------------------------------------------------------
  // CHECKPOINT 3: p = 0.40 (LINE 1 DRAWN, EMAIL READ, COUNTER 1)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 0.40 (EMAIL READ) ---");
  await scrollToP(0.40);
  const p40Screenshot = path.join(ARTIFACT_DIR, "problem_p40_email_read.png");
  await page.screenshot({ path: p40Screenshot });
  console.log("Saved p=0.40 screenshot:", p40Screenshot);

  const p40State = await page.evaluate(() => {
    const emailRead = document.querySelector(".pf-email-val-b");
    const counterCol = document.querySelector("#problem span[style*='willChange']");
    return {
      emailReadOpacity: emailRead ? getComputedStyle(emailRead).opacity : "",
      counterColTransform: counterCol ? getComputedStyle(counterCol).transform : "",
    };
  });
  console.log("p=0.40 evaluation:", p40State);

  // -------------------------------------------------------------
  // CHECKPOINT 4: p = 0.60 (FAN-OUT DRAWN, CRM/SHEET LIME, COUNTER 3)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 0.60 (FAN-OUT COMPLETE) ---");
  await scrollToP(0.60);
  const p60Screenshot = path.join(ARTIFACT_DIR, "problem_p60_fanout.png");
  await page.screenshot({ path: p60Screenshot });
  console.log("Saved p=0.60 screenshot:", p60Screenshot);

  const p60State = await page.evaluate(() => {
    const crmValB = document.querySelector(".pf-crm-val-b");
    const sheetTag = document.querySelector('#problem [data-card="sheet"] .pf-tag');
    return {
      crmAssignedOpacity: crmValB ? getComputedStyle(crmValB).opacity : "",
      sheetTagColor: sheetTag ? getComputedStyle(sheetTag).color : "",
    };
  });
  console.log("p=0.60 evaluation:", p60State);

  // -------------------------------------------------------------
  // CHECKPOINT 5: p = 0.80 (CONNECTED TAG, UNISON PULSE, UNDERLINE)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 0.80 (CONNECTED & UNDERLINE) ---");
  await scrollToP(0.80);
  const p80Screenshot = path.join(ARTIFACT_DIR, "problem_p80_connected.png");
  await page.screenshot({ path: p80Screenshot });
  console.log("Saved p=0.80 screenshot:", p80Screenshot);

  const p80State = await page.evaluate(() => {
    const underline = document.querySelector("#problem .origin-left");
    const lineB = document.querySelector('#problem h2[style*="var(--faint)"], #problem h2.transition-colors');
    const stateEl = document.querySelector("#problem span.transition-colors");
    return {
      underlineTransform: underline ? getComputedStyle(underline).transform : "",
      lineBColor: lineB ? getComputedStyle(lineB).color : "",
      stateText: stateEl ? stateEl.textContent : "",
      stateColor: stateEl ? getComputedStyle(stateEl).color : "",
    };
  });
  console.log("p=0.80 evaluation:", p80State);

  // -------------------------------------------------------------
  // CHECKPOINT 6: p = 1.00 (COMPACT DIAGRAM MORPH & HOLD)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: p = 1.00 (COMPACT DIAGRAM) ---");
  await scrollToP(1.00);
  const p100Screenshot = path.join(ARTIFACT_DIR, "problem_p100_compact_diagram.png");
  await page.screenshot({ path: p100Screenshot });
  console.log("Saved p=1.00 screenshot:", p100Screenshot);

  const p100State = await page.evaluate(() => {
    const cardWeb = document.querySelector('#problem [data-card="web"]');
    const rowLine = document.querySelector("#problem .pf-row");
    const label0 = document.querySelector(".pf-target-label");
    return {
      cardWebOpacity: cardWeb ? getComputedStyle(cardWeb).opacity : "",
      cardWebScale: cardWeb ? getComputedStyle(cardWeb).transform : "",
      labelOpacity: label0 ? getComputedStyle(label0).opacity : "",
    };
  });
  console.log("p=1.00 evaluation:", p100State);

  // -------------------------------------------------------------
  // CHECKPOINT 7: SCRUB BACKWARD TO p = 0.00
  // -------------------------------------------------------------
  console.log("--- Checkpoint: Scrub backward to p = 0.00 ---");
  await scrollToP(0.00);
  await page.waitForTimeout(500);
  const pReverseScreenshot = path.join(ARTIFACT_DIR, "problem_reverse_idle.png");
  await page.screenshot({ path: pReverseScreenshot });
  console.log("Saved reverse p=0 screenshot:", pReverseScreenshot);

  const reverseState = await page.evaluate(() => {
    const cardWeb = document.querySelector('#problem [data-card="web"]');
    const emailRead = document.querySelector(".pf-email-val-b");
    const underline = document.querySelector("#problem .origin-left");
    return {
      cardWebOpacity: cardWeb ? getComputedStyle(cardWeb).opacity : "",
      cardWebTransform: cardWeb ? getComputedStyle(cardWeb).transform : "",
      emailReadOpacity: emailRead ? getComputedStyle(emailRead).opacity : "",
      underlineTransform: underline ? getComputedStyle(underline).transform : "",
    };
  });
  console.log("Reverse evaluation:", reverseState);

  // -------------------------------------------------------------
  // CHECKPOINT 8: RESIZE MID-SCENE (AT p = 0.50)
  // -------------------------------------------------------------
  console.log("--- Checkpoint: Resize mid-scene at p = 0.50 ---");
  await scrollToP(0.50);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  const resizeScreenshot = path.join(ARTIFACT_DIR, "problem_resize_midscene.png");
  await page.screenshot({ path: resizeScreenshot });
  console.log("Saved resize mid-scene screenshot:", resizeScreenshot);

  await page.close();
  await ctx.close();
  await browser.close();

  console.log("--- ALL PROBLEM SCENE TESTS COMPLETE ---");
  console.log("Page errors:", pageErrors);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

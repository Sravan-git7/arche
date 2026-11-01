import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/9995fa9a-bb45-477a-8a4a-e1a76cac54e3";
const BASE = process.env.BASE || "http://localhost:5173/";

async function run() {
  console.log("=== STARTING SERVICES PROMPT 05 VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  // Desktop context
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_CLOSED")) {
      errors.push("console: " + m.text());
    }
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Inspect ScrollTriggers and Pin calculations
  const stInfo = await page.evaluate(() => {
    // @ts-ignore
    const stList = window.ScrollTrigger ? window.ScrollTrigger.getAll() : [];
    return stList.map((st) => ({
      id: st.vars.id || st.trigger?.id || "unnamed",
      start: Math.round(st.start),
      end: Math.round(st.end),
      pin: !!st.pin,
    }));
  });
  console.log("ScrollTriggers registered:", JSON.stringify(stInfo, null, 2));

  const handoffSt = stInfo.find((s) => s.id === "problem-services-handoff");
  const servicesPin = stInfo.find((s) => s.id === "services-pin");

  console.log(`Handoff range: ${handoffSt?.start} -> ${handoffSt?.end} (delta: ${handoffSt ? handoffSt.end - handoffSt.start : 0}px)`);
  console.log(`Services pin range: ${servicesPin?.start} -> ${servicesPin?.end} (delta: ${servicesPin ? servicesPin.end - servicesPin.start : 0}px, 340vh = ${900 * 3.4}px)`);

  // Check 1: Hand-off 70vh range
  if (handoffSt) {
    // Start of handoff
    await page.evaluate((y) => window.scrollTo(0, y), handoffSt.start);
    await page.waitForTimeout(400);
    const handoffStartPic = path.join(ARTIFACT_DIR, "services_handoff_start.png");
    await page.screenshot({ path: handoffStartPic });
    console.log(`Saved screenshot: ${handoffStartPic}`);

    // Mid handoff (50%)
    const midY = handoffSt.start + (handoffSt.end - handoffSt.start) * 0.5;
    await page.evaluate((y) => window.scrollTo(0, y), midY);
    await page.waitForTimeout(400);
    const handoffMidPic = path.join(ARTIFACT_DIR, "services_handoff_mid.png");
    await page.screenshot({ path: handoffMidPic });
    console.log(`Saved screenshot: ${handoffMidPic}`);

    // End of handoff (100% / arrival at rail)
    await page.evaluate((y) => window.scrollTo(0, y), handoffSt.end);
    await page.waitForTimeout(400);
    const handoffArrPic = path.join(ARTIFACT_DIR, "services_handoff_arrival.png");
    await page.screenshot({ path: handoffArrPic });
    console.log(`Saved screenshot: ${handoffArrPic}`);
  }

  // Check 2: Services Pin Chapter (4 Services)
  if (servicesPin) {
    const pStart = servicesPin.start;
    const pLen = servicesPin.end - servicesPin.start;

    // Service 01: Video Editing (progress ~ 0.08)
    const y0 = pStart + pLen * 0.08;
    await page.evaluate((y) => window.scrollTo(0, y), y0);
    await page.waitForTimeout(1000); // allow demo autoplay 0.9s timer
    const pic01 = path.join(ARTIFACT_DIR, "services_01_video.png");
    await page.screenshot({ path: pic01 });
    console.log(`Saved screenshot: ${pic01}`);

    // Service 02: Web Development (progress ~ 0.35)
    const y1 = pStart + pLen * 0.35;
    await page.evaluate((y) => window.scrollTo(0, y), y1);
    await page.waitForTimeout(1000);
    const pic02 = path.join(ARTIFACT_DIR, "services_02_web.png");
    await page.screenshot({ path: pic02 });
    console.log(`Saved screenshot: ${pic02}`);

    // Service 03: AI Chatbots (progress ~ 0.60)
    const y2 = pStart + pLen * 0.60;
    await page.evaluate((y) => window.scrollTo(0, y), y2);
    await page.waitForTimeout(1000);
    const pic03 = path.join(ARTIFACT_DIR, "services_03_chatbots.png");
    await page.screenshot({ path: pic03 });
    console.log(`Saved screenshot: ${pic03}`);

    // Service 04: AI Automation (progress ~ 0.85)
    const y3 = pStart + pLen * 0.85;
    await page.evaluate((y) => window.scrollTo(0, y), y3);
    await page.waitForTimeout(1000);
    const pic04 = path.join(ARTIFACT_DIR, "services_04_automation.png");
    await page.screenshot({ path: pic04 });
    console.log(`Saved screenshot: ${pic04}`);

    // Check 3: Tab Clicks
    console.log("Testing tab click to Service 02 (Web Development)...");
    const tabWeb = page.locator('.svc-tab[data-i="1"]').first();
    await tabWeb.click();
    await page.waitForTimeout(1400); // 1.0s lenis scroll + settling
    const activeTabAfterClick = await page.evaluate(() => {
      const el = document.querySelector('.svc-tab[data-active="1"]');
      return el ? el.textContent.trim().replace(/\s+/g, " ") : "";
    });
    console.log("Active tab after clicking tab 1:", activeTabAfterClick);

    // Check 4: Rail Dot Clicks
    console.log("Testing rail dot click to Service 04 (AI Automation)...");
    const railDotAuto = page.locator('[data-rail-tab="ai-automation"] button').first();
    await railDotAuto.click();
    await page.waitForTimeout(1400);
    const activeTabAfterRailClick = await page.evaluate(() => {
      const el = document.querySelector('.svc-tab[data-active="1"]');
      return el ? el.textContent.trim().replace(/\s+/g, " ") : "";
    });
    console.log("Active tab after clicking rail dot automation:", activeTabAfterRailClick);

    const picTabClick = path.join(ARTIFACT_DIR, "services_tab_click.png");
    await page.screenshot({ path: picTabClick });
    console.log(`Saved screenshot: ${picTabClick}`);

    // Check 5: Reverse scroll through hand-off
    if (handoffSt) {
      console.log("Testing reverse scroll back into Problem-Services hand-off...");
      await page.evaluate((y) => window.scrollTo(0, y), handoffSt.start + 100);
      await page.waitForTimeout(400);
      const apertureReversed = await page.evaluate(() => {
        const stage = document.getElementById("services-stage");
        return stage ? stage.style.clipPath : "";
      });
      console.log("Arch aperture clipPath during reverse scroll:", apertureReversed);
    }
  }

  // Check 6: Mobile verification
  console.log("Testing mobile viewport (390x844)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileContext.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  // Scroll to services
  await mobilePage.evaluate(() => {
    const el = document.getElementById("services-home");
    el?.scrollIntoView();
  });
  await mobilePage.waitForTimeout(600);
  const picMobile = path.join(ARTIFACT_DIR, "services_mobile.png");
  await mobilePage.screenshot({ path: picMobile });
  console.log(`Saved screenshot: ${picMobile}`);

  const mobilePinned = await mobilePage.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger?.getById("services-pin");
    return !!st;
  });
  console.log("Mobile has services pin:", mobilePinned, "(expected: false)");

  // Check 7: Reduced motion verification
  console.log("Testing reduced motion...");
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await rmContext.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE, { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(1000);

  await rmPage.evaluate(() => {
    const el = document.getElementById("services-home");
    el?.scrollIntoView();
  });
  await rmPage.waitForTimeout(600);
  const picRM = path.join(ARTIFACT_DIR, "services_reduced_motion.png");
  await rmPage.screenshot({ path: picRM });
  console.log(`Saved screenshot: ${picRM}`);

  const rmPinned = await rmPage.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger?.getById("services-pin");
    return !!st;
  });
  console.log("Reduced motion has services pin:", rmPinned, "(expected: false)");

  await browser.close();
  console.log("=== SERVICES VERIFICATION COMPLETE ===");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

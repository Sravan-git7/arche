import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173/";
const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/b8718b67-e83f-46f3-a790-182bc6715e34";

async function run() {
  console.log("=== STARTING COMPREHENSIVE VERIFICATION OF PROBLEM & SERVICES FIXES ===");

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

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

  let passCount = 0;
  let failCount = 0;
  function assert(name, condition, extra = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${extra ? "- " + extra : ""}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? "- " + extra : ""}`);
      failCount++;
    }
  }

  // -------------------------------------------------------------
  // SCENARIO 1: Hard refresh at top -> scroll to Problem -> scroll into Services
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 1: Initial Entry into Services ---");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Measure triggers
  const triggers = await page.evaluate(() => {
    // @ts-ignore
    const stList = window.ScrollTrigger ? window.ScrollTrigger.getAll() : [];
    const pPin = stList.find((s) => s.vars?.id === "problem-pin");
    const sPin = stList.find((s) => s.vars?.id === "services-pin");
    return {
      pPinStart: pPin ? pPin.start : 0,
      pPinEnd: pPin ? pPin.end : 0,
      sPinStart: sPin ? sPin.start : 0,
      sPinEnd: sPin ? sPin.end : 0,
    };
  });
  console.log("Measured Triggers:", triggers);

  // Scroll to Problem
  await page.evaluate((y) => window.scrollTo(0, y), triggers.pPinStart + 200);
  await page.waitForTimeout(400);

  // Check no stray follower over Problem
  const cursorProblemState = await page.evaluate(() => {
    const ring = document.querySelector(".cursor-ring");
    const ringOpacity = ring ? window.getComputedStyle(ring).opacity : "0";
    const systemThread = document.querySelector(".tn-body");
    return {
      ringOpacity,
      hasSystemThread: !!systemThread,
    };
  });
  assert("No SystemThread element in DOM", !cursorProblemState.hasSystemThread);

  // Scroll into Services (at services-pin start)
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + 50);
  await page.waitForTimeout(800);

  const svcEntry = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const activeTab = document.querySelector(".svc-tab[data-active='1']");
    const counter = document.querySelector("#services-home .mono.flex-none span");
    const heading = document.querySelector("#services-home .d2");
    const desc = document.querySelector("#services-home .svc-desc");
    const tags = Array.from(document.querySelectorAll("#services-home .svc-tag-item"));
    const demo = document.querySelector("#services-stage [data-slab='monitor'], #services-stage [class*='raw']");

    return {
      stageSlug: stage ? stage.getAttribute("data-service") : null,
      tabIndex: activeTab ? activeTab.getAttribute("data-i") : null,
      tabText: activeTab ? activeTab.textContent?.replace(/\s+/g, " ").trim() : null,
      counter: counter ? counter.textContent?.trim() : null,
      headingText: heading ? heading.textContent?.replace(/\s+/g, " ").trim() : null,
      descVisible: !!desc,
      tagCount: tags.length,
      demoMounted: !!stage,
    };
  });
  console.log("Services Initial Entry State:", svcEntry);

  assert("Initial service is 01 Video Editing", svcEntry.stageSlug === "video-editing" && svcEntry.counter === "01");
  assert("Active indicator is index 0", svcEntry.tabIndex === "0");
  assert("Heading is Video Editing", svcEntry.headingText?.includes("Video Editing"));
  assert("Description is visible", svcEntry.descVisible);
  assert("Tags are visible", svcEntry.tagCount > 0);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_scen1_initial_services.png") });

  // -------------------------------------------------------------
  // SCENARIO 2: Continue scrolling -> Web Dev -> AI Chatbots -> AI Automation
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 2: Downward Scroll Progression ---");
  const pLen = triggers.sPinEnd - triggers.sPinStart;

  // Scroll to ~35% of pin -> 02 Web Development
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.35);
  await page.waitForTimeout(700);
  const s2 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const tab = document.querySelector(".svc-tab[data-active='1']");
    return { slug: stage?.getAttribute("data-service"), tabIndex: tab?.getAttribute("data-i") };
  });
  assert("Scrolled down to 02 Web Development", s2.slug === "web-development" && s2.tabIndex === "1", JSON.stringify(s2));

  // Scroll to ~62% of pin -> 03 AI Chatbots
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.62);
  await page.waitForTimeout(700);
  const s3 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const tab = document.querySelector(".svc-tab[data-active='1']");
    return { slug: stage?.getAttribute("data-service"), tabIndex: tab?.getAttribute("data-i") };
  });
  assert("Scrolled down to 03 AI Chatbots", s3.slug === "ai-chatbots" && s3.tabIndex === "2", JSON.stringify(s3));

  // Scroll to ~88% of pin -> 04 AI Automation
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.88);
  await page.waitForTimeout(700);
  const s4 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const tab = document.querySelector(".svc-tab[data-active='1']");
    return { slug: stage?.getAttribute("data-service"), tabIndex: tab?.getAttribute("data-i") };
  });
  assert("Scrolled down to 04 AI Automation", s4.slug === "ai-automation" && s4.tabIndex === "3", JSON.stringify(s4));

  // -------------------------------------------------------------
  // SCENARIO 3: Scroll upward through all four services. Reverses correctly.
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 3: Upward Scroll Reversal ---");
  // Back to 62%
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.62);
  await page.waitForTimeout(700);
  const r3 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    return stage?.getAttribute("data-service");
  });
  assert("Reversed up to AI Chatbots", r3 === "ai-chatbots", r3);

  // Back to 35%
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.35);
  await page.waitForTimeout(700);
  const r2 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    return stage?.getAttribute("data-service");
  });
  assert("Reversed up to Web Development", r2 === "web-development", r2);

  // Back to 10%
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + pLen * 0.10);
  await page.waitForTimeout(700);
  const r1 = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    return stage?.getAttribute("data-service");
  });
  assert("Reversed up to Video Editing", r1 === "video-editing", r1);

  // -------------------------------------------------------------
  // SCENARIO 4: Return to top -> enter Services again. Video Editing must be initial.
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 4: Return to Top and Re-enter Services ---");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  // Re-enter Services
  await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + 50);
  await page.waitForTimeout(700);
  const reEnterSvc = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const activeTab = document.querySelector(".svc-tab[data-active='1']");
    return {
      slug: stage?.getAttribute("data-service"),
      tabIndex: activeTab?.getAttribute("data-i"),
    };
  });
  assert("Re-entering Services starts at Video Editing", reEnterSvc.slug === "video-editing" && reEnterSvc.tabIndex === "0", JSON.stringify(reEnterSvc));

  // Test explicit user click on a tab
  console.log("\n--- Testing Tab Click Interaction ---");
  await page.locator(".svc-tab[data-i='2']").click(); // Click AI Chatbots
  await page.waitForTimeout(800);
  const clickedSvc = await page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    return stage?.getAttribute("data-service");
  });
  assert("Clicking tab 2 activates AI Chatbots", clickedSvc === "ai-chatbots", clickedSvc);

  // -------------------------------------------------------------
  // SCENARIO 5: Problem Section Layout, Headline, No Clipping, No Stray Point
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 5: Problem Section Geometry & Headline ---");
  await page.evaluate((y) => window.scrollTo(0, y), triggers.pPinStart + 100);
  await page.waitForTimeout(500);

  const probCheck = await page.evaluate(() => {
    const headingA = document.querySelector(".pf-head-line");
    const headingB = document.querySelector(".pf-head-line + div .pf-head-line");
    const probSec = document.getElementById("problem");
    const servSec = document.getElementById("services-home");
    const pRect = probSec ? probSec.getBoundingClientRect() : null;
    const sRect = servSec ? servSec.getBoundingClientRect() : null;
    const hRect = headingA ? headingA.getBoundingClientRect() : null;

    // Check overlap between problem and services
    const overlap = sRect && pRect ? sRect.top < pRect.bottom : false;

    return {
      headingTop: hRect ? hRect.top : 0,
      headingVisible: hRect ? hRect.top >= 0 && hRect.bottom > 0 : false,
      overlap,
      probTop: pRect?.top,
      probBottom: pRect?.bottom,
      servTop: sRect?.top,
    };
  });
  console.log("Problem Geometry:", probCheck);
  assert("Problem headline is not clipped by viewport top", probCheck.headingTop >= 40, `Top: ${probCheck.headingTop}px`);
  assert("Services does not overlap Problem while Problem is active", probCheck.servTop >= probCheck.probBottom - 5, `Serv top: ${probCheck.servTop}, Prob bottom: ${probCheck.probBottom}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verify_scen5_problem_clean.png") });

  // -------------------------------------------------------------
  // SCENARIO 6: Rapid Scroll Problem-to-Services Boundary & Reverse
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 6: Boundary Rapid Scroll ---");
  for (let i = 0; i < 4; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), triggers.sPinStart + 300);
    await page.waitForTimeout(80);
    await page.evaluate((y) => window.scrollTo(0, y), triggers.pPinStart + 200);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(400);

  const boundarySettle = await page.evaluate(() => {
    const probSec = document.getElementById("problem");
    const pRect = probSec ? probSec.getBoundingClientRect() : null;
    return {
      pTop: pRect?.top,
    };
  });
  assert("Boundary rapid scroll settled cleanly without error", errors.length === 0, `Errors: ${errors.length}`);

  // -------------------------------------------------------------
  // SCENARIO 7: Mobile Viewport Test (390x844)
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 7: Mobile Viewport (390x844) ---");
  const mContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mContext.newPage();
  await mPage.goto(BASE, { waitUntil: "networkidle" });
  await mPage.waitForTimeout(600);

  // Scroll to mobile Problem
  await mPage.locator("#problem").scrollIntoViewIfNeeded();
  await mPage.waitForTimeout(400);
  const mProb = await mPage.evaluate(() => {
    const h = document.querySelector("#problem h2");
    return { hasHeading: !!h, headingText: h?.textContent?.trim() };
  });
  assert("Mobile Problem headline rendered", mProb.hasHeading && mProb.headingText?.includes("businesses"), mProb.headingText);

  // Scroll to mobile Services
  await mPage.locator("#services-home").scrollIntoViewIfNeeded();
  await mPage.waitForTimeout(400);
  const mSvc = await mPage.evaluate(() => {
    const activeTab = document.querySelector(".svc-tab[data-active='1']");
    const stage = document.querySelector("#services-stage");
    return {
      tabIndex: activeTab?.getAttribute("data-i"),
      slug: stage?.getAttribute("data-service"),
    };
  });
  assert("Mobile Services starts on Video Editing (index 0)", mSvc.tabIndex === "0" && mSvc.slug === "video-editing", JSON.stringify(mSvc));
  await mPage.screenshot({ path: path.join(ARTIFACT_DIR, "verify_scen7_mobile.png") });
  await mContext.close();

  // -------------------------------------------------------------
  // SCENARIO 8: Reduced Motion Enabled
  // -------------------------------------------------------------
  console.log("\n--- SCENARIO 8: Reduced Motion ---");
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE, { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(600);

  await rmPage.locator("#services-home").scrollIntoViewIfNeeded();
  await rmPage.waitForTimeout(400);
  const rmSvc = await rmPage.evaluate(() => {
    const activeTab = document.querySelector(".svc-tab[data-active='1']");
    const stage = document.querySelector("#services-stage");
    return {
      tabIndex: activeTab?.getAttribute("data-i"),
      slug: stage?.getAttribute("data-service"),
    };
  });
  assert("Reduced motion Services starts on Video Editing (index 0)", rmSvc.tabIndex === "0" && rmSvc.slug === "video-editing", JSON.stringify(rmSvc));
  await rmPage.screenshot({ path: path.join(ARTIFACT_DIR, "verify_scen8_reduced_motion.png") });
  await rmContext.close();

  await browser.close();

  console.log("\n=================================================");
  console.log(`TOTAL PASSES: ${passCount}`);
  console.log(`TOTAL FAILURES: ${failCount}`);
  console.log("=================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});

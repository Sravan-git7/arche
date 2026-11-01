import { chromium } from "playwright";

const BASE = "http://localhost:5173/";

async function runRegression() {
  console.log("=== STARTING REGRESSION VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    channel: "chrome",
  });

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });

  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_CLOSED")) {
      errors.push("console: " + m.text());
    }
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // -------------------------------------------------------------
  // TEST 1: Handoff forward & reverse boundary tests (incl. rapid scroll)
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Handoff Boundaries & Rapid Scrolling ---");
  
  const triggerInfo = await page.evaluate(() => {
    const pPin = window.ScrollTrigger ? window.ScrollTrigger.getById("problem-pin") : null;
    const handoffSt = window.ScrollTrigger ? window.ScrollTrigger.getById("problem-services-handoff") : null;
    return {
      pPinEnd: pPin ? pPin.end : 3168,
      handoffStart: handoffSt ? handoffSt.start : 3168,
      handoffEnd: handoffSt ? handoffSt.end : 3168 + 630,
    };
  });
  console.log("Trigger Bounds:", triggerInfo);

  // Position A: Above handoff boundary (start - 100)
  await page.evaluate((y) => window.scrollTo(0, y), triggerInfo.handoffStart - 100);
  await page.waitForTimeout(300);
  const aboveState = await page.evaluate(() => {
    const handoffLayer = document.querySelector("#problem-services-handoff, [class*='pointer-events-none fixed inset-0 z-[60]']");
    const pDots = Array.from(document.querySelectorAll("#problem-website, [data-problem-dot]"));
    return {
      carrierOpacity: handoffLayer ? window.getComputedStyle(handoffLayer).opacity : "null",
      visibleProblemDots: pDots.filter((d) => window.getComputedStyle(d).opacity !== "0").length,
    };
  });
  console.log("Above handoff boundary (start - 100):", aboveState);

  // Rapid scroll forward deep into Services (past handoffEnd)
  await page.evaluate((y) => window.scrollTo(0, y), triggerInfo.handoffEnd + 400);
  await page.waitForTimeout(300);
  const belowState = await page.evaluate(() => {
    const handoffLayer = document.querySelector("#problem-services-handoff, [class*='pointer-events-none fixed inset-0 z-[60]']");
    const stage = document.getElementById("services-stage");
    return {
      carrierOpacity: handoffLayer ? window.getComputedStyle(handoffLayer).opacity : "null",
      stageClip: stage ? stage.style.clipPath : "null",
    };
  });
  console.log("Below handoff boundary (end + 400) after rapid scroll:", belowState);

  // Rapid reverse scroll back above handoff (start - 100)
  await page.evaluate((y) => window.scrollTo(0, y), triggerInfo.handoffStart - 100);
  await page.waitForTimeout(300);
  const reverseState = await page.evaluate(() => {
    const handoffLayer = document.querySelector("#problem-services-handoff, [class*='pointer-events-none fixed inset-0 z-[60]']");
    const stage = document.getElementById("services-stage");
    return {
      carrierOpacity: handoffLayer ? window.getComputedStyle(handoffLayer).opacity : "null",
      stageClip: stage ? stage.style.clipPath : "null",
    };
  });
  console.log("After rapid reverse scroll above handoff:", reverseState);

  // Multiple rapid oscillations across boundary
  for (let osc = 0; osc < 4; osc++) {
    await page.evaluate((y) => window.scrollTo(0, y), triggerInfo.handoffEnd + 200);
    await page.waitForTimeout(60);
    await page.evaluate((y) => window.scrollTo(0, y), triggerInfo.handoffStart - 100);
    await page.waitForTimeout(60);
  }
  const finalBoundaryState = await page.evaluate(() => {
    const handoffLayer = document.querySelector("#problem-services-handoff, [class*='pointer-events-none fixed inset-0 z-[60]']");
    return {
      carrierOpacity: handoffLayer ? window.getComputedStyle(handoffLayer).opacity : "null",
    };
  });
  console.log("After rapid oscillations back at start - 100:", finalBoundaryState);

  const test1Pass = aboveState.carrierOpacity === "0" &&
                    belowState.carrierOpacity === "0" &&
                    reverseState.carrierOpacity === "0" &&
                    finalBoundaryState.carrierOpacity === "0";
  console.log(`-> TEST 1 BOUNDARY OPACITY: ${test1Pass ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------
  // TEST 2: Resize synchronization in each of the four services
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Resize Synchronization across All 4 Services ---");

  const getPinBounds = async () => {
    return await page.evaluate(() => {
      const pin = window.ScrollTrigger ? window.ScrollTrigger.getById("services-pin") : null;
      return {
        start: pin ? pin.start : 0,
        end: pin ? pin.end : 0,
        total: pin ? pin.end - pin.start : 0,
      };
    });
  };

  const getServiceSyncState = async () => {
    return await page.evaluate(() => {
      const pinSt = window.ScrollTrigger ? window.ScrollTrigger.getById("services-pin") : null;
      const progress = pinSt ? pinSt.progress : 0;
      
      const counterEl = document.querySelector("#services-home .mono.flex-none");
      const activeTab = document.querySelector(".svc-tab[data-active='1']");
      const tabText = activeTab ? activeTab.textContent.replace(/\s+/g, " ").trim() : "none";
      
      // Rail dot active
      const dots = Array.from(document.querySelectorAll("[data-rail-dot]"));
      const activeDot = dots.find((d) => {
        const bg = window.getComputedStyle(d).backgroundColor;
        const box = window.getComputedStyle(d).boxShadow;
        return box.includes("4px") || bg.includes("200, 241, 79") || bg.includes("180, 255, 59");
      });
      const activeDotSlug = activeDot ? activeDot.getAttribute("data-rail-dot") : "none";

      const stageEl = document.getElementById("services-stage");
      const stageHeader = stageEl ? stageEl.innerText.substring(0, 50).replace(/\n/g, " ") : "";
      
      return {
        progress: progress.toFixed(3),
        counter: counterEl ? counterEl.textContent.trim() : "",
        tabText,
        activeDotSlug,
        stageHeader,
      };
    });
  };

  const servicesConfig = [
    { num: "01", slug: "video-editing", title: "Video", progress: 0.08 },
    { num: "02", slug: "web-development", title: "Web", progress: 0.35 },
    { num: "03", slug: "ai-chatbots", title: "Chatbots", progress: 0.60 },
    { num: "04", slug: "ai-automation", title: "Automation", progress: 0.85 },
  ];

  let test2AllPass = true;

  for (const svc of servicesConfig) {
    console.log(`\nTesting positioned in Service ${svc.num} (${svc.title}, target p=${svc.progress}):`);
    
    // 1. Scroll into service position
    const bounds = await getPinBounds();
    const targetY = bounds.start + svc.progress * bounds.total;
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await page.waitForTimeout(800); // Wait for transition to settle

    const beforeState = await getServiceSyncState();
    console.log("  Initial state:", beforeState);

    // 2. Resize viewport 1440x900 -> 1200x900 (width resize)
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(600);
    const resize1State = await getServiceSyncState();
    console.log("  After width resize (1200x900):", resize1State);

    // 3. Resize viewport back to 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);
    const resize2State = await getServiceSyncState();
    console.log("  After restore (1440x900):", resize2State);

    // Validate sync: tab, counter, dot, and demo must match each other
    const expectedNum = svc.num;
    const tabMatch = resize2State.tabText.includes(expectedNum);
    const counterMatch = resize2State.counter.startsWith(expectedNum);
    const dotMatch = resize2State.activeDotSlug === svc.slug;
    const stageMatch = resize2State.stageHeader.toUpperCase().includes(svc.title.toUpperCase());

    const isSynced = tabMatch && counterMatch && dotMatch && stageMatch;
    if (!isSynced) test2AllPass = false;
    console.log(`  -> Synchronization Validated: ${isSynced ? "PASS" : "FAIL"} (Tab: ${tabMatch}, Counter: ${counterMatch}, Dot: ${dotMatch}, Demo: ${stageMatch})`);
  }

  console.log(`\n-> TEST 2 RESIZE SYNCHRONIZATION: ${test2AllPass ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------
  // TEST 3: Mobile Checks (390x844)
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Mobile Checks (390x844) ---");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileCtx.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const mobilePage = await mobileCtx.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", (e) => mobileErrors.push("mobile pageerror: " + e.message));

  await mobilePage.goto(BASE, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.evaluate(() => {
    document.getElementById("services-home")?.scrollIntoView();
  });
  await mobilePage.waitForTimeout(500);

  const mobileState = await mobilePage.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll(".svc-tab"));
    const overflow = document.body.scrollWidth > window.innerWidth;
    return {
      tabCount: tabs.length,
      hasOverflow: overflow,
      bodyScrollW: document.body.scrollWidth,
      windowInnerW: window.innerWidth,
    };
  });
  console.log("Mobile state:", mobileState, "Mobile errors:", mobileErrors);
  const test3Pass = mobileState.tabCount === 4 && !mobileState.hasOverflow && mobileErrors.length === 0;
  console.log(`-> TEST 3 MOBILE: ${test3Pass ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------
  // TEST 4: Reduced Motion Checks
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Reduced Motion Checks ---");
  const rmCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await rmCtx.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const rmPage = await rmCtx.newPage();
  const rmErrors = [];
  rmPage.on("pageerror", (e) => rmErrors.push("reduced motion pageerror: " + e.message));

  await rmPage.goto(BASE, { waitUntil: "domcontentloaded" });
  await rmPage.waitForTimeout(1000);

  const rmState = await rmPage.evaluate(() => {
    const pin = window.ScrollTrigger ? window.ScrollTrigger.getById("services-pin") : null;
    return {
      prefersReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      pinExists: Boolean(pin),
      pinnedClass: document.getElementById("services-home")?.className,
    };
  });
  console.log("Reduced motion state:", rmState, "RM errors:", rmErrors);
  const test4Pass = rmState.prefersReduced === true && rmState.pinExists === false && rmErrors.length === 0;
  console.log(`-> TEST 4 REDUCED MOTION: ${test4Pass ? "PASS" : "FAIL"}`);

  await browser.close();
  console.log("\nGlobal Page Errors:", errors);
  console.log("=== REGRESSION VERIFICATION COMPLETE ===");
}

runRegression().catch((err) => {
  console.error("Regression error:", err);
  process.exit(1);
});

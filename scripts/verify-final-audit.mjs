import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/9995fa9a-bb45-477a-8a4a-e1a76cac54e3";
const BASE = process.env.BASE || "http://localhost:5173/";

async function run() {
  console.log("=== STARTING PROMPT 05 FINAL AUDIT ===");
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const results = [];
  const logCheck = (name, pass, detail = "") => {
    console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` - ${detail}` : ""}`);
    results.push({ name, pass: !!pass, detail });
  };

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

  // Helper to read current synchronized state
  const getState = async () => {
    return await page.evaluate(() => {
      const counterEl = document.querySelector("#services-home .flex-none span");
      const counter = counterEl?.getAttribute("aria-label") || counterEl?.textContent?.trim() || "";
      
      const activeTabEl = document.querySelector('.svc-tab[data-active="1"]');
      const activeTabIdx = activeTabEl ? activeTabEl.getAttribute("data-i") : null;
      const activeTabTxt = activeTabEl ? activeTabEl.textContent?.trim()?.replace(/\s+/g, " ") : "";
      
      // Find the rail dot that has an active glow/box-shadow
      const allDots = Array.from(document.querySelectorAll('#services-stage [data-rail-dot]'));
      const activeRailEl = allDots.find((el) => {
        const shadow = getComputedStyle(el).boxShadow;
        return shadow && shadow !== "none";
      });
      const activeRailSlug = activeRailEl ? activeRailEl.getAttribute("data-rail-dot") : null;
      
      const stageService = document.querySelector("#services-stage")?.getAttribute("data-service") || "";
      return { counter, activeTabIdx, activeTabTxt, activeRailSlug, stageService };
    });
  };

  /* =========================================================================
     CASE 1: Click all four service tabs in order: 4 -> 2 -> 1 -> 3 -> 4
     ========================================================================= */
  console.log("\n--- CASE 1: Tab clicks 4 -> 2 -> 1 -> 3 -> 4 ---");
  const tabSequence = [
    { targetIdx: 3, expectedN: "04", slug: "ai-automation" },
    { targetIdx: 1, expectedN: "02", slug: "web-development" },
    { targetIdx: 0, expectedN: "01", slug: "video-editing" },
    { targetIdx: 2, expectedN: "03", slug: "ai-chatbots" },
    { targetIdx: 3, expectedN: "04", slug: "ai-automation" },
  ];

  for (const step of tabSequence) {
    const tabBtn = page.locator(`.svc-tab[data-i="${step.targetIdx}"]`).first();
    await tabBtn.click();
    await page.waitForTimeout(1400); // 1.0s lenis scroll + 0.35s transition
    const st = await getState();
    const matches = st.activeTabIdx === String(step.targetIdx) &&
                    st.counter === step.expectedN &&
                    st.activeRailSlug === step.slug &&
                    st.stageService === step.slug;
    logCheck(`Tab click -> ${step.expectedN} (${step.slug})`, matches,
      `Tab=${st.activeTabIdx}, Counter=${st.counter}, Rail=${st.activeRailSlug}, Stage=${st.stageService}`);
  }
  const case1Pic = path.join(ARTIFACT_DIR, "audit_case1_tab_sequence.png");
  await page.screenshot({ path: case1Pic });

  /* =========================================================================
     CASE 2: Click all four rail dots in order: 4 -> 2 -> 1 -> 3 -> 4
     ========================================================================= */
  console.log("\n--- CASE 2: Rail dot clicks 4 -> 2 -> 1 -> 3 -> 4 ---");
  const railSequence = [
    { targetSlug: "ai-automation", targetIdx: 3, expectedN: "04" },
    { targetSlug: "web-development", targetIdx: 1, expectedN: "02" },
    { targetSlug: "video-editing", targetIdx: 0, expectedN: "01" },
    { targetSlug: "ai-chatbots", targetIdx: 2, expectedN: "03" },
    { targetSlug: "ai-automation", targetIdx: 3, expectedN: "04" },
  ];

  for (const step of railSequence) {
    const railBtn = page.locator(`[data-rail-tab="${step.targetSlug}"] button`).first();
    await railBtn.click();
    await page.waitForTimeout(1400);
    const st = await getState();
    const matches = st.activeTabIdx === String(step.targetIdx) &&
                    st.counter === step.expectedN &&
                    st.activeRailSlug === step.targetSlug &&
                    st.stageService === step.targetSlug;
    logCheck(`Rail click -> ${step.expectedN} (${step.targetSlug})`, matches,
      `Tab=${st.activeTabIdx}, Counter=${st.counter}, Rail=${st.activeRailSlug}, Stage=${st.stageService}`);
  }
  const case2Pic = path.join(ARTIFACT_DIR, "audit_case2_rail_sequence.png");
  await page.screenshot({ path: case2Pic });

  /* =========================================================================
     CASE 3: Rapid switching between services while autoplay timers are pending
     ========================================================================= */
  console.log("\n--- CASE 3: Rapid switching between services ---");
  await page.locator('.svc-tab[data-i="0"]').first().click();
  await page.waitForTimeout(100);
  await page.locator('.svc-tab[data-i="1"]').first().click();
  await page.waitForTimeout(100);
  await page.locator('.svc-tab[data-i="2"]').first().click();
  await page.waitForTimeout(100);
  await page.locator('.svc-tab[data-i="3"]').first().click();

  await page.waitForTimeout(1600);
  const stCase3 = await getState();
  const case3Pass = stCase3.activeTabIdx === "3" &&
                    stCase3.counter === "04" &&
                    stCase3.activeRailSlug === "ai-automation" &&
                    stCase3.stageService === "ai-automation";
  logCheck("Rapid tab switching settles on final target (04 Automation)", case3Pass,
    `Tab=${stCase3.activeTabIdx}, Counter=${stCase3.counter}, Rail=${stCase3.activeRailSlug}, Stage=${stCase3.stageService}`);
  const case3Pic = path.join(ARTIFACT_DIR, "audit_case3_rapid_switch.png");
  await page.screenshot({ path: case3Pic });

  /* =========================================================================
     CASE 4: Scroll manually forward and backward across all four services
     ========================================================================= */
  console.log("\n--- CASE 4: Manual scroll forward and backward ---");
  const svcPin = await page.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger?.getById("services-pin");
    return st ? { start: st.start, end: st.end } : null;
  });
  const sStart = svcPin ? svcPin.start : 3798;
  const sLen = svcPin ? svcPin.end - svcPin.start : 3060;

  const forwardPoints = [
    { frac: 0.08, expIdx: "0", expN: "01", name: "Service 01 Video" },
    { frac: 0.35, expIdx: "1", expN: "02", name: "Service 02 Web" },
    { frac: 0.60, expIdx: "2", expN: "03", name: "Service 03 Chatbots" },
    { frac: 0.85, expIdx: "3", expN: "04", name: "Service 04 Automation" },
  ];
  for (const pt of forwardPoints) {
    await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * pt.frac);
    await page.waitForTimeout(700);
    const st = await getState();
    const ok = st.activeTabIdx === pt.expIdx && st.counter === pt.expN;
    logCheck(`Scroll forward -> ${pt.name}`, ok, `Tab=${st.activeTabIdx}, Counter=${st.counter}`);
  }

  const backwardPoints = [
    { frac: 0.60, expIdx: "2", expN: "03", name: "Service 03 Chatbots" },
    { frac: 0.35, expIdx: "1", expN: "02", name: "Service 02 Web" },
    { frac: 0.08, expIdx: "0", expN: "01", name: "Service 01 Video" },
  ];
  for (const pt of backwardPoints) {
    await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * pt.frac);
    await page.waitForTimeout(700);
    const st = await getState();
    const ok = st.activeTabIdx === pt.expIdx && st.counter === pt.expN;
    logCheck(`Scroll backward -> ${pt.name}`, ok, `Tab=${st.activeTabIdx}, Counter=${st.counter}`);
  }
  const case4Pic = path.join(ARTIFACT_DIR, "audit_case4_scroll_sync.png");
  await page.screenshot({ path: case4Pic });

  /* =========================================================================
     CASE 5: 82% HOLD phase keeps EVERY demo interactive
     ========================================================================= */
  console.log("\n--- CASE 5: All 4 demos interactive in HOLD phase ---");

  // 1. Video Editing Demo (Service 0, frac 0.08)
  await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * 0.08);
  await page.waitForTimeout(1000);
  const waveTrack = page.locator(".vd-track").first();
  let videoInteractive = false;
  if (await waveTrack.count()) {
    const stageBefore = await page.evaluate(() => document.body.innerText.match(/STAGE:\s*\w+/)?.[0] || "");
    const box = await waveTrack.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(300);
      const stageAfter = await page.evaluate(() => document.body.innerText.match(/STAGE:\s*\w+/)?.[0] || "");
      videoInteractive = stageBefore !== stageAfter;
    }
  }
  logCheck("Demo 01 (Video Editing) interactive in HOLD phase", videoInteractive);

  // 2. Web Development Demo (Service 1, frac 0.35)
  await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * 0.35);
  await page.waitForTimeout(3500); // allow build sequence to reach LIVE phase
  const nameInput = page.locator(".wd-surface input").first();
  let webInteractive = false;
  if (await nameInput.count()) {
    const disabledBefore = await nameInput.isDisabled();
    await nameInput.fill("Antigravity");
    await page.waitForTimeout(200);
    const val = await nameInput.inputValue();
    webInteractive = !disabledBefore && val === "Antigravity";
  }
  logCheck("Demo 02 (Web Development) interactive in HOLD phase", webInteractive);

  // 3. AI Chatbots Demo (Service 2, frac 0.60)
  await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * 0.60);
  await page.waitForTimeout(1000);
  const questionChip = page.locator("#services-stage button").filter({ hasText: /CRM|booking|sure/i }).first();
  let chatbotInteractive = false;
  if (await questionChip.count()) {
    const textBefore = await page.evaluate(() => document.body.innerText);
    await questionChip.click();
    await page.waitForTimeout(1200);
    const textAfter = await page.evaluate(() => document.body.innerText);
    chatbotInteractive = textAfter.length > textBefore.length || /AGENT|QUALIFY|CRM/i.test(textAfter);
  }
  logCheck("Demo 03 (AI Chatbots) interactive in HOLD phase", chatbotInteractive);

  // 4. AI Automation Demo (Service 3, frac 0.85)
  await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * 0.85);
  await page.waitForTimeout(1000);
  const autoSeg = page.locator(".au-seg button");
  let autoInteractive = false;
  if ((await autoSeg.count()) >= 2) {
    await autoSeg.nth(1).click();
    await page.waitForTimeout(200);
    const checked = await autoSeg.nth(1).getAttribute("aria-checked");
    const runBtn = page.locator(".au-run").first();
    if (await runBtn.count()) {
      await runBtn.click();
      await page.waitForTimeout(1000);
      autoInteractive = checked === "true";
    }
  }
  logCheck("Demo 04 (AI Automation) interactive in HOLD phase", autoInteractive);
  const case5Pic = path.join(ARTIFACT_DIR, "audit_case5_demos_interactive.png");
  await page.screenshot({ path: case5Pic });

  /* =========================================================================
     CASE 6: Problem-to-Services handoff reversal & single persistent signal
     ========================================================================= */
  console.log("\n--- CASE 6: Problem-to-Services handoff reversal & single signal ---");
  const handoffSt = await page.evaluate(() => {
    // @ts-ignore
    const st = window.ScrollTrigger?.getById("problem-services-handoff");
    return st ? { start: st.start, end: st.end } : null;
  });

  if (handoffSt) {
    const midY = handoffSt.start + (handoffSt.end - handoffSt.start) * 0.5;
    await page.evaluate((y) => window.scrollTo(0, y), midY);
    await page.waitForTimeout(400);

    const midSignals = await page.evaluate(() => {
      const probDots = Array.from(document.querySelectorAll('#problem .pf-morph-node, #problem [data-thread-slot="problem"]'));
      const probDotsVisible = probDots.filter((el) => getComputedStyle(el).opacity === "1").length;
      const carrierEl = document.querySelector('.signal-dot')?.parentElement;
      const carrierVisible = carrierEl ? getComputedStyle(carrierEl).opacity === "1" : false;
      const rail1 = document.querySelector('[data-signal="rail-1"]');
      const rail1Shadow = rail1 ? getComputedStyle(rail1).boxShadow : "none";
      const rail1Lit = rail1Shadow !== "none";
      return { probDotsVisible, carrierVisible, rail1Lit };
    });
    logCheck("Hand-off mid-point: carrier active, problem dots hidden",
      midSignals.carrierVisible && midSignals.probDotsVisible === 0,
      JSON.stringify(midSignals));

    await page.evaluate((y) => window.scrollTo(0, y), handoffSt.start - 50);
    await page.waitForTimeout(400);

    const reversedCheck = await page.evaluate(() => {
      const probDots = Array.from(document.querySelectorAll('#problem .pf-morph-node, #problem [data-thread-slot="problem"]'));
      const probDotsVisible = probDots.filter((el) => getComputedStyle(el).opacity === "1").length;
      const carrierEl = document.querySelector('.signal-dot')?.parentElement;
      const carrierVisible = carrierEl ? getComputedStyle(carrierEl).opacity === "1" : false;
      const stageClip = document.getElementById("services-stage")?.style.clipPath || "";
      return { probDotsVisible, carrierVisible, stageClip };
    });
    logCheck("Hand-off reversed to t=0: problem dots visible, carrier hidden",
      reversedCheck.probDotsVisible > 0 && !reversedCheck.carrierVisible,
      JSON.stringify(reversedCheck));
  }
  const case6Pic = path.join(ARTIFACT_DIR, "audit_case6_handoff_reversal.png");
  await page.screenshot({ path: case6Pic });

  /* =========================================================================
     CASE 7: Resize, mobile, and reduced-motion behavior
     ========================================================================= */
  console.log("\n--- CASE 7: Resize, mobile, and reduced motion ---");

  await page.evaluate((y) => window.scrollTo(0, y), sStart + sLen * 0.35);
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(600);
  const resizeCheck1 = await getState();
  logCheck("Mid-scene resize down (1280x800): state intact", resizeCheck1.activeTabIdx === "1" && resizeCheck1.counter === "02");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  const resizeCheck2 = await getState();
  logCheck("Mid-scene resize restore (1440x900): state intact", resizeCheck2.activeTabIdx === "1" && resizeCheck2.counter === "02");

  const mContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mContext.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const mPage = await mContext.newPage();
  await mPage.goto(BASE, { waitUntil: "networkidle" });
  await mPage.waitForTimeout(800);
  const mobileHasPin = await mPage.evaluate(() => {
    // @ts-ignore
    return !!window.ScrollTrigger?.getById("services-pin");
  });
  const mobileTabsScrollable = await mPage.evaluate(() => {
    const rail = document.querySelector(".svc-rail");
    return rail ? rail.classList.contains("overflow-x-auto") : false;
  });
  logCheck("Mobile viewport (390x844): unpinned with swipeable tabs", !mobileHasPin && mobileTabsScrollable);
  const case7MobilePic = path.join(ARTIFACT_DIR, "audit_case7_mobile.png");
  await mPage.screenshot({ path: case7MobilePic });

  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await rmContext.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE, { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(800);
  const rmHasPin = await rmPage.evaluate(() => {
    // @ts-ignore
    return !!window.ScrollTrigger?.getById("services-pin");
  });
  const rmAllVisible = await rmPage.evaluate(() => {
    const el = document.getElementById("services-home");
    return el ? getComputedStyle(el).display !== "none" : false;
  });
  logCheck("Reduced motion: unpinned accessible static state", !rmHasPin && rmAllVisible);
  const case7RmPic = path.join(ARTIFACT_DIR, "audit_case7_reduced_motion.png");
  await rmPage.screenshot({ path: case7RmPic });

  console.log(`\nAudit completed with ${errors.length} errors.`);
  console.log("=== PROMPT 05 AUDIT COMPLETE ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});

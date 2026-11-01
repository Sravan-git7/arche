import { chromium } from "playwright";

const URL = "http://localhost:5173/";

async function main() {
  console.log("=== STARTING SERVICES MORPH ENGINE VERIFICATION ===");
  const launch = {
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    channel: process.env.CHROME_CHANNEL || "chrome",
  };
  if (process.env.CHROME_PATH) {
    launch.executablePath = process.env.CHROME_PATH;
  }
  const browser = await chromium.launch(launch);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("arche:booted", "1"); } catch {}
  });
  const page = await context.newPage();

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text());
  });

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Scroll to services section
  const sStart = await page.evaluate(() => {
    const st = window.ScrollTrigger?.getById("services-pin");
    return st ? st.start + 50 : 3850;
  });
  await page.evaluate((y) => window.scrollTo(0, y), sStart);
  await page.waitForTimeout(800);

  // Helper to click service tab
  const clickTab = async (index) => {
    const tab = page.locator(`[data-thread-slot="services"][data-i="${index}"]`);
    await tab.click();
  };

  // Helper to wait for morph settlement
  const waitForSettled = async (slug, timeoutMs = 4000) => {
    await page.waitForFunction(
      (s) => {
        const stage = document.querySelector("#services-stage");
        const morphLayer = stage?.querySelector(".z-\\[20\\]");
        const isSettled = morphLayer && morphLayer.children.length === 0;
        const currentService = stage?.getAttribute("data-service");
        const renderedService = stage?.getAttribute("data-rendered-service");
        return isSettled && currentService === s && renderedService === s;
      },
      slug,
      { timeout: timeoutMs }
    );
    await page.waitForTimeout(300);
  };

  const getGhostStats = async () => {
    return await page.evaluate(() => {
      const stage = document.querySelector("#services-stage");
      const morphLayer = stage?.querySelector(".z-\\[20\\]");
      const ghosts = morphLayer ? Array.from(morphLayer.children) : [];
      const sigDot = stage?.querySelector(".z-\\[25\\]");
      const sigDisplay = sigDot ? window.getComputedStyle(sigDot).display : "none";
      const sigOpacity = sigDot ? window.getComputedStyle(sigDot).opacity : "0";
      return {
        ghostCount: ghosts.length,
        maxGhostLimitPassed: ghosts.length <= 6,
        sigVisible: sigDisplay !== "none" && parseFloat(sigOpacity) > 0,
      };
    });
  };

  const SLUGS = ["video-editing", "web-development", "ai-chatbots", "ai-automation"];

  // --- PART 1: TEST ALL 12 DIRECTED TRANSITIONS ---
  console.log("\n--- TEST 1: All 12 Directed Transitions ---");
  const pairs = [
    [0, 1], // Video -> Web
    [1, 0], // Web -> Video
    [1, 3], // Web -> Automation
    [3, 1], // Automation -> Web
    [3, 2], // Automation -> Chatbots
    [2, 3], // Chatbots -> Automation
    [2, 0], // Chatbots -> Video
    [0, 2], // Video -> Chatbots
    [1, 2], // Web -> Chatbots
    [2, 1], // Chatbots -> Web
    [0, 3], // Video -> Automation
    [3, 0], // Automation -> Video
  ];

  let allPairsPass = true;
  for (const [fromIdx, toIdx] of pairs) {
    const fromSlug = SLUGS[fromIdx];
    const toSlug = SLUGS[toIdx];

    // Ensure we are at fromIdx
    await clickTab(fromIdx);
    await waitForSettled(fromSlug);
    await page.waitForTimeout(100);

    // Trigger transition to toIdx
    await clickTab(toIdx);
    await page.waitForTimeout(650); // sample mid-flight during morph

    const midStats = await getGhostStats();
    await waitForSettled(toSlug, 3500);
    const postStats = await getGhostStats();

    const pairPass = midStats.maxGhostLimitPassed && postStats.ghostCount === 0;
    if (!pairPass) allPairsPass = false;

    console.log(
      `  Pair [${fromSlug} -> ${toSlug}]: midGhosts=${midStats.ghostCount} (<=6: ${midStats.maxGhostLimitPassed}, sigVis=${midStats.sigVisible}) -> postGhosts=${postStats.ghostCount} [PASS: ${pairPass}]`
    );
  }
  console.log(`-> ALL 12 DIRECTED TRANSITIONS: ${allPairsPass ? "PASS" : "FAIL"}`);

  // --- PART 2: TRUE MID-FLIGHT RETARGETING ---
  console.log("\n--- TEST 2: True Mid-Flight Retargeting ---");
  // Start from Video (0), click Web (1), then at 650ms interrupt with Automation (3)
  await clickTab(0);
  await waitForSettled("video-editing", 3500);

  await clickTab(1); // Start to Web
  await page.waitForTimeout(650); // Mid-flight at 650ms during active morph
  const interruptStats1 = await getGhostStats();

  await clickTab(3); // Interrupt mid-flight with Automation!
  await page.waitForTimeout(200);
  const interruptStats2 = await getGhostStats();

  await waitForSettled("ai-automation", 3500);
  const postInterruptStats = await getGhostStats();

  const retargetPass =
    interruptStats1.ghostCount > 0 &&
    interruptStats2.ghostCount > 0 &&
    interruptStats2.ghostCount <= 6 &&
    postInterruptStats.ghostCount === 0;
  console.log(
    `  Mid-flight retarget (0 -> 1 interrupted by 3): flight1Ghosts=${interruptStats1.ghostCount}, retargetGhosts=${interruptStats2.ghostCount}, postGhosts=${postInterruptStats.ghostCount} [PASS: ${retargetPass}]`
  );

  // --- PART 3: RAPID CLICK SEQUENCE ---
  console.log("\n--- TEST 3: Rapid Click Sequence (4 -> 2 -> 1 -> 3 -> 4) ---");
  const seq = [3, 1, 0, 2, 3];
  for (const idx of seq) {
    await clickTab(idx);
    await page.waitForTimeout(60); // 60ms rapid bursts
  }
  await waitForSettled("ai-automation", 3500);
  const rapidStats = await getGhostStats();
  const finalStage = await page.evaluate(() => document.querySelector("#services-stage")?.getAttribute("data-service"));
  const rapidPass = rapidStats.ghostCount === 0 && finalStage === "ai-automation";
  console.log(`  Rapid click sequence settled at: ${finalStage}, remainingGhosts=${rapidStats.ghostCount} [PASS: ${rapidPass}]`);

  // --- PART 4: RESIZE INTERRUPTION ---
  console.log("\n--- TEST 4: Viewport Resize Interruption Mid-Flight ---");
  await clickTab(0);
  await waitForSettled("video-editing", 3500);

  await clickTab(1); // launch morph to Web
  await page.waitForTimeout(650); // mid-flight during morph

  // Resize viewport to trigger resize listener mid-flight
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(400);

  const resizeMidStats = await getGhostStats();
  const resizeStage = await page.evaluate(() => document.querySelector("#services-stage")?.getAttribute("data-service"));
  const resizePass = resizeMidStats.ghostCount === 0 && resizeStage === "web-development";
  console.log(
    `  Resize mid-flight settled cleanly: stage=${resizeStage}, remainingGhosts=${resizeMidStats.ghostCount} [PASS: ${resizePass}]`
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);

  // --- PART 5: CHATBOT PRE-TURN & POST-TURN FALLBACKS ---
  console.log("\n--- TEST 5: Chatbot Pre-Turn & Post-Turn States ---");
  // 1. Transition to Chatbots when turns = 0 (pre-turn)
  await clickTab(0);
  await waitForSettled("video-editing", 3500);
  await clickTab(2); // to Chatbots
  await waitForSettled("ai-chatbots", 3500);
  const preTurnTurns = await page.evaluate(() => document.querySelectorAll(".agent-chat .agent-question").length);
  console.log(`  Pre-turn Chatbots: turns in DOM = ${preTurnTurns} (expected 0 initial before auto-ask)`);

  // 2. Trigger question in Chatbots to establish conversation turn
  const firstChip = page.locator(".agent-suggestion").first();
  if (await firstChip.isVisible()) {
    await firstChip.click();
    await page.waitForTimeout(600);
  }
  const postTurnCount = await page.evaluate(() => document.querySelectorAll(".agent-chat .agent-question").length);
  console.log(`  Post-turn Chatbots: turns in DOM = ${postTurnCount} (conversation active)`);

  // 3. Morph away from Chatbots with turn active to Automation and back
  await clickTab(3); // to Automation
  await waitForSettled("ai-automation", 3500);
  await clickTab(2); // back to Chatbots
  await waitForSettled("ai-chatbots", 3500);
  const postReturnStats = await getGhostStats();
  console.log(`  Chatbots return with active conversation: postGhosts=${postReturnStats.ghostCount} [PASS: ${postReturnStats.ghostCount === 0}]`);

  // --- PART 6: WEB DEV PHASES ---
  console.log("\n--- TEST 6: Web Dev Phase Transitions ---");
  await clickTab(1); // to Web Dev
  await waitForSettled("web-development", 3500);
  const webDevHasFrame = await page.evaluate(() => Boolean(document.querySelector(".wd-frame")));
  console.log(`  Web Dev mounted with interactive canvas: ${webDevHasFrame} [PASS: ${webDevHasFrame}]`);

  // Capture screenshot of settled state
  await page.screenshot({ path: "morph_engine_settled.png" });
  console.log("  Saved screenshot to morph_engine_settled.png");

  console.log("\nGlobal Page Errors:", pageErrors);
  console.log("=== SERVICES MORPH ENGINE VERIFICATION COMPLETE ===");
  await browser.close();
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

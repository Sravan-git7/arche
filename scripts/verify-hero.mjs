import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/9995fa9a-bb45-477a-8a4a-e1a76cac54e3";
const BASE = "http://localhost:5173/";

async function run() {
  console.log("Launching Chromium (channel: chrome)...");
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const videoDir = path.join(ARTIFACT_DIR, "video_temp");
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  // ==========================================
  // TEST 1: FRESH VISIT (Intro -> Hero Reveal -> Hero Scroll)
  // ==========================================
  console.log("--- 1. Testing Fresh Visit (Intro & Reveal) ---");
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });

  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text());
  });

  console.log("Navigating to", BASE);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });

  // Take screenshot during intro (around t=1.0s)
  await page.waitForTimeout(1000);
  const introScreenshot = path.join(ARTIFACT_DIR, "intro_frame.png");
  await page.screenshot({ path: introScreenshot });
  console.log("Saved intro screenshot:", introScreenshot);

  // Wait for total intro + aperture + hero reveal to complete
  try {
    await page.waitForFunction(
      () => !document.documentElement.classList.contains("arche-intro-loading"),
      { timeout: 7000 }
    );
  } catch {}
  await page.waitForTimeout(1000);

  // Fully revealed hero at 0% scroll
  const heroScreenshot = path.join(ARTIFACT_DIR, "hero_revealed.png");
  await page.screenshot({ path: heroScreenshot });
  console.log("Saved fully revealed hero screenshot:", heroScreenshot);

  // Check scroll checkpoints
  const heroHeight = await page.evaluate(() => {
    const el = document.getElementById("hero");
    return el ? el.offsetHeight : window.innerHeight;
  });
  console.log("Hero measured height:", heroHeight);

  // 0% scroll
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const scroll0Screenshot = path.join(ARTIFACT_DIR, "hero_scroll_0.png");
  await page.screenshot({ path: scroll0Screenshot });
  console.log("Saved scroll 0% screenshot:", scroll0Screenshot);

  // 25% scroll
  const scroll25Y = Math.round(heroHeight * 0.25);
  await page.evaluate((y) => window.scrollTo(0, y), scroll25Y);
  await page.waitForTimeout(500);
  const scroll25Screenshot = path.join(ARTIFACT_DIR, "hero_scroll_25.png");
  await page.screenshot({ path: scroll25Screenshot });
  console.log("Saved scroll 25% screenshot:", scroll25Screenshot);

  // 50% scroll
  const scroll50Y = Math.round(heroHeight * 0.5);
  await page.evaluate((y) => window.scrollTo(0, y), scroll50Y);
  await page.waitForTimeout(500);
  const scroll50Screenshot = path.join(ARTIFACT_DIR, "hero_scroll_50.png");
  await page.screenshot({ path: scroll50Screenshot });
  console.log("Saved scroll 50% screenshot:", scroll50Screenshot);

  // 100% scroll
  const scroll100Y = Math.round(heroHeight * 1.0);
  await page.evaluate((y) => window.scrollTo(0, y), scroll100Y);
  await page.waitForTimeout(500);
  const scroll100Screenshot = path.join(ARTIFACT_DIR, "hero_scroll_100.png");
  await page.screenshot({ path: scroll100Screenshot });
  console.log("Saved scroll 100% screenshot:", scroll100Screenshot);

  // Scroll smoothly back to top for nice video recording
  for (let s = scroll100Y; s >= 0; s -= 50) {
    await page.evaluate((y) => window.scrollTo(0, y), s);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(500);

  // Close context to finalize video
  const video = page.video();
  await page.close();
  await ctx.close();

  if (video) {
    const videoPath = await video.path();
    const destPath = path.join(ARTIFACT_DIR, "hero_intro_and_scroll.webm");
    fs.copyFileSync(videoPath, destPath);
    console.log("Saved video to:", destPath);
  }

  // ==========================================
  // TEST 2: SAME-SESSION RELOAD
  // ==========================================
  console.log("--- 2. Testing Same-Session Reload (Intro Skipped) ---");
  const reloadCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  // Simulate having sessionStorage "arche_intro" set
  await reloadCtx.addInitScript(() => {
    try {
      sessionStorage.setItem("arche_intro", "1");
    } catch {}
  });

  const reloadPage = await reloadCtx.newPage();
  await reloadPage.goto(BASE, { waitUntil: "domcontentloaded" });

  // Intro should NOT be visible
  const hasIntroLoading = await reloadPage.evaluate(() =>
    document.documentElement.classList.contains("arche-intro-loading")
  );
  console.log("Same session reload has intro loading class?:", hasIntroLoading);

  // Wait 1.1s for headline-only reveal to settle
  await reloadPage.waitForTimeout(1100);
  const reloadScreenshot = path.join(ARTIFACT_DIR, "hero_reload_same_session.png");
  await reloadPage.screenshot({ path: reloadScreenshot });
  console.log("Saved same-session reload screenshot:", reloadScreenshot);
  await reloadCtx.close();

  // ==========================================
  // TEST 3: PREFERS-REDUCED-MOTION
  // ==========================================
  console.log("--- 3. Testing Reduced Motion ---");
  const reducedCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedCtx.newPage();
  await reducedPage.goto(BASE, { waitUntil: "domcontentloaded" });

  // Under reduced motion, intro is skipped immediately and hero is shown instantly
  await reducedPage.waitForTimeout(250);
  const reducedScreenshot = path.join(ARTIFACT_DIR, "hero_reduced_motion.png");
  await reducedPage.screenshot({ path: reducedScreenshot });
  console.log("Saved reduced motion screenshot:", reducedScreenshot);

  const reducedHasLoading = await reducedPage.evaluate(() =>
    document.documentElement.classList.contains("arche-intro-loading")
  );
  console.log("Reduced motion has intro loading class?:", reducedHasLoading);
  await reducedCtx.close();

  // ==========================================
  // TEST 4: WINDOW RESIZE MID-REVEAL
  // ==========================================
  console.log("--- 4. Testing Window Resize Mid-Reveal ---");
  const resizeCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const resizePage = await resizeCtx.newPage();
  await resizePage.goto(BASE, { waitUntil: "domcontentloaded" });

  // Mid-reveal (at ~2.5s)
  await resizePage.waitForTimeout(2400);
  console.log("Resizing window to 1024x768 mid-reveal...");
  await resizePage.setViewportSize({ width: 1024, height: 768 });
  await resizePage.waitForTimeout(1200);

  const resizeScreenshot = path.join(ARTIFACT_DIR, "hero_resize_mid_reveal.png");
  await resizePage.screenshot({ path: resizeScreenshot });
  console.log("Saved resize mid-reveal screenshot:", resizeScreenshot);

  const headlineText = await resizePage.evaluate(() => {
    const el = document.getElementById("hero");
    const h1 = el ? el.querySelector("h1") : null;
    return h1 ? h1.innerText : "";
  });
  console.log("Headline text intact after resize:", JSON.stringify(headlineText));
  await resizeCtx.close();

  await browser.close();
  console.log("--- ALL TESTS COMPLETE ---");
  if (pageErrors.length > 0) {
    console.error("Page Errors Encountered:", pageErrors);
  } else {
    console.log("No page errors or console errors encountered!");
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

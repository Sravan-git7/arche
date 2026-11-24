import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("1. Testing PreFooterCTA resting & left-glide matching awmedia...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll to PreFooterCTA
  const preFooter = page.locator("#pre-footer-cta");
  await preFooter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Take screenshot of resting center orb
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_01_prefooter_center.png"),
  });

  // Now hover/pointermove to the far left of the section (x: 140px from left)
  const box = await preFooter.boundingBox();
  if (box) {
    const targetX = box.x + box.width * 0.16; // far left
    const targetY = box.y + box.height * 0.45;
    await page.mouse.move(targetX, targetY);
    // Wait for GSAP quickTo (duration 0.65s) to animate orb to the left
    await page.waitForTimeout(900);

    // Screenshot with orb on the left (matching awmedia screenshot!)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "awmedia_match_02_prefooter_left.png"),
    });
    console.log("Captured awmedia_match_02_prefooter_left.png");
  }

  // 2. Test /#/services/video-editing
  console.log("2. Testing /#/services/video-editing contrast & bottleneck scrub...");
  await page.goto("http://localhost:5173/#/services/video-editing", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll to Chapter 2 Bottleneck statement
  await page.evaluate(() => {
    window.scrollTo({ top: 900, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_03_service_bottleneck.png"),
  });

  // Scroll further down to Chapter 4 (Relevant builds & carousel)
  await page.evaluate(() => {
    window.scrollTo({ top: 2200, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_04_service_builds.png"),
  });

  // 3. Test /#/pricing
  console.log("3. Testing /#/pricing commercial architecture & numerals...");
  await page.goto("http://localhost:5173/#/pricing", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll to Commercial Architecture section
  await page.evaluate(() => {
    window.scrollTo({ top: 2600, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_05_pricing_commercial.png"),
  });

  // 4. Test /#/work
  console.log("4. Testing /#/work...");
  await page.goto("http://localhost:5173/#/work", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_06_work_hub.png"),
  });

  // 5. Test /#/faq
  console.log("5. Testing /#/faq...");
  await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "awmedia_match_07_faq_hub.png"),
  });

  await browser.close();
  console.log("All screenshots captured successfully.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

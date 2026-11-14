import { chromium } from "playwright";
import fs from "fs";

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  
  // 1. DESKTOP TEST (1440x900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => sessionStorage.setItem("arche_intro", "1"));
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Locate the HowWeWork section
  const hww = page.locator(".hww");
  await hww.waitFor({ state: "attached" });

  const box = await hww.boundingBox();
  console.log("HWW bounding box:", box);

  if (!box) {
    console.error("HWW bounding box not found!");
    await browser.close();
    process.exit(1);
  }

  // Scroll to several key progress points along the section
  // Total scroll distance is box.height - window.innerHeight
  const startY = box.y;
  const totalDist = box.height;

  // Snapshot 1: Discover (Start of Process)
  await page.evaluate((y) => window.scrollTo({ top: y + 200, behavior: "instant" }), startY);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "verify-live-desktop-1-discover.png" });

  // Snapshot 2: Connect (Forms fusing, paper background)
  await page.evaluate(({ y, h }) => window.scrollTo({ top: y + h * 0.44, behavior: "instant" }), { y: startY, h: totalDist });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "verify-live-desktop-2-connect.png" });

  // Snapshot 3: Launch (Dark transition + ignited light channel)
  await page.evaluate(({ y, h }) => window.scrollTo({ top: y + h * 0.60, behavior: "instant" }), { y: startY, h: totalDist });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "verify-live-desktop-3-launch.png" });

  // Snapshot 4: Approach - Anchor jump test to #approach
  await page.evaluate(() => {
    const el = document.getElementById("approach");
    if (el) el.scrollIntoView({ behavior: "instant" });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "verify-live-desktop-4-approach.png" });

  // Snapshot 5: Exit (Return to paper)
  await page.evaluate(({ y, h }) => window.scrollTo({ top: y + h - 100, behavior: "instant" }), { y: startY, h: totalDist });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "verify-live-desktop-5-exit.png" });

  // 2. MOBILE TEST (375x812)
  const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobilePage.addInitScript(() => sessionStorage.setItem("arche_intro", "1"));
  await mobilePage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  const mHww = mobilePage.locator(".hww");
  const mBox = await mHww.boundingBox();
  console.log("Mobile HWW box:", mBox);

  if (mBox) {
    // Mobile Discover
    await mobilePage.evaluate((y) => window.scrollTo({ top: y + 200, behavior: "instant" }), mBox.y);
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: "verify-live-mobile-1-discover.png" });

    // Mobile Launch (Dark)
    await mobilePage.evaluate(({ y, h }) => window.scrollTo({ top: y + h * 0.60, behavior: "instant" }), { y: mBox.y, h: mBox.height });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: "verify-live-mobile-2-launch.png" });
  }

  // 3. VERIFICATIONS
  // Verify accessible content exists
  const srText = await page.locator(".hww .sr-only").innerText();
  console.log("SR text length:", srText.length);
  console.log("SR text sample:", srText.slice(0, 150));

  // Verify anchors exist
  const processAnchor = await page.$("#process");
  const approachAnchor = await page.$("#approach");
  console.log("Process anchor present:", !!processAnchor);
  console.log("Approach anchor present:", !!approachAnchor);

  // Check progress rail chapter detection
  const railChapter = await page.$eval(".progress-edge-label", el => el.textContent).catch(() => "not found");
  console.log("ProgressRail text at current scroll:", railChapter);

  await browser.close();
  console.log("All live browser verifications complete!");
})();

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function run() {
  console.log("Launching Playwright for FAQ Vertical Stack + PreFooter Glass Orb verification...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Load FAQ Page
  console.log("Navigating to http://localhost:5173/#/faq...");
  await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 2. Verify ArcheConcierge on FAQ Page
  const concierge = page.locator(".arche-concierge-card");
  await concierge.waitFor({ state: "visible", timeout: 8000 });
  const conciergeBox = await concierge.boundingBox();
  console.log(`ArcheConcierge dimensions: width=${conciergeBox.width}px, height=${conciergeBox.height}px, y=${conciergeBox.y}px`);

  if (conciergeBox.width < 950) {
    throw new Error(`Expected ArcheConcierge to be full-width (>= 950px), but was ${conciergeBox.width}px!`);
  }

  // Verify Search bar is below ArcheConcierge
  const searchInput = page.locator('input[placeholder*="Search pricing, timelines"]');
  await searchInput.waitFor({ state: "visible", timeout: 5000 });
  const searchBox = await searchInput.boundingBox();
  console.log(`Search input y=${searchBox.y}px (ArcheConcierge bottom = ${conciergeBox.y + conciergeBox.height}px)`);

  if (searchBox.y <= conciergeBox.y + conciergeBox.height) {
    throw new Error(`Expected search bar to be below ArcheConcierge in a vertical stack!`);
  }

  // 3. Test Bot Questions
  const botInput = concierge.locator('input[placeholder*="Ask pricing, turnaround"]');
  const botSubmit = concierge.locator('button[type="submit"]');

  async function askQuestion(query, expectedSnippets) {
    console.log(`\nTesting Query: "${query}"...`);
    await botInput.fill(query);
    await botSubmit.click();
    await page.waitForTimeout(600); // 260ms response delay + rendering

    // Get last bot message
    const botMessages = concierge.locator('[data-sender="bot"]');
    const count = await botMessages.count();
    const lastMsgText = await botMessages.nth(count - 1).innerText();
    console.log(`Bot Response Preview: ${lastMsgText.replace(/\n+/g, ' ').slice(0, 150)}...`);

    for (const snippet of expectedSnippets) {
      if (!lastMsgText.includes(snippet)) {
        throw new Error(`Bot response for "${query}" did not contain expected snippet "${snippet}"!\nResponse was: ${lastMsgText}`);
      }
      console.log(`  ✓ Verified snippet: "${snippet}"`);
    }
  }

  await askQuestion("what is the basic video editing plan cost", ["₹799", "₹2,499"]);
  await askQuestion("standard website cost", ["₹12,999"]);
  await askQuestion("pitch deck price", ["₹3,999", "₹7,999", "₹14,999"]);

  // Screenshot FAQ page top (Concierge full-width)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "faq_fullwidth_concierge_top_1440.png"),
    clip: { x: 0, y: 0, width: 1440, height: 1100 },
  });
  console.log("Saved faq_fullwidth_concierge_top_1440.png");

  // Scroll down to FAQ accordions
  await page.evaluate(() => window.scrollBy(0, 750));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "faq_search_and_accordions_bottom_1440.png"),
    clip: { x: 0, y: 0, width: 1440, height: 1000 },
  });
  console.log("Saved faq_search_and_accordions_bottom_1440.png");

  // 4. Test PreFooterCTA Glass Orb Cursor Tracking
  console.log("\nTesting PreFooterCTA Glass Orb cursor sweep...");
  const preFooter = page.locator("#pre-footer-cta");
  await preFooter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const sectionBox = await preFooter.boundingBox();
  console.log(`PreFooter section bounding box: x=${sectionBox.x}, y=${sectionBox.y}, w=${sectionBox.width}, h=${sectionBox.height}`);

  const orb = preFooter.locator(".animate-orb-float > div").first();
  await orb.waitFor({ state: "visible" });

  // Helper to read transform x
  async function getOrbTransformX() {
    return await orb.evaluate((el) => {
      const transform = window.getComputedStyle(el).transform;
      if (!transform || transform === "none") return 0;
      const matrix = new DOMMatrixReadOnly(transform);
      return matrix.m41;
    });
  }

  // Move to center
  const centerX = sectionBox.x + sectionBox.width / 2;
  const centerY = sectionBox.y + sectionBox.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.waitForTimeout(800);
  console.log(`Orb transform at center: x=${await getOrbTransformX()}`);

  // Move to far left edge (matching awmedia screenshot 2)
  console.log("Moving cursor to far left edge...");
  await page.mouse.move(sectionBox.x + 30, centerY);
  await page.waitForTimeout(900);
  const leftX = await getOrbTransformX();
  console.log(`Orb transform at far left: x=${leftX}px`);

  if (leftX > -500) {
    throw new Error(`Expected orb to glide to far left (x < -500), but was ${leftX}px!`);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_orb_far_left_awmedia_match.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_orb_far_left_awmedia_match.png");

  // Move to far right edge
  console.log("Moving cursor to far right edge...");
  await page.mouse.move(sectionBox.x + sectionBox.width - 30, centerY);
  await page.waitForTimeout(900);
  const rightX = await getOrbTransformX();
  console.log(`Orb transform at far right: x=${rightX}px`);

  if (rightX < 500) {
    throw new Error(`Expected orb to glide to far right (x > 500), but was ${rightX}px!`);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_orb_far_right_awmedia_match.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_orb_far_right_awmedia_match.png");

  // Move cursor right over headline text "business?" (matching awmedia screenshot 1)
  console.log("Moving cursor right over headline 'business?'...");
  const headline = preFooter.locator("h2");
  const headlineBox = await headline.boundingBox();
  await page.mouse.move(headlineBox.x + headlineBox.width * 0.72, headlineBox.y + headlineBox.height * 0.75);
  await page.waitForTimeout(900);
  console.log(`Orb transform under headline: x=${await getOrbTransformX()}px`);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "prefooter_orb_under_headline_awmedia_match.png"),
    clip: { x: 0, y: Math.max(0, sectionBox.y), width: 1440, height: Math.min(sectionBox.height, 900) },
  });
  console.log("Saved prefooter_orb_under_headline_awmedia_match.png");

  // 5. Test Mobile Viewport (390x844)
  console.log("\nTesting Mobile Viewport (390x844)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "faq_mobile_vertical_stack_390.png"),
    fullPage: false,
  });
  console.log("Saved faq_mobile_vertical_stack_390.png");

  await browser.close();
  console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

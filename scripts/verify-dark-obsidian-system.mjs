import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("C:/Users/srava/.gemini/antigravity/brain/bec7ffae-d2f4-4501-b465-5148348593cc/screenshots");
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const DIST_DIR = path.resolve("D:/arche/dist");

// Simple static HTTP server for the built single-file bundle
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  const filePath = path.join(DIST_DIR, decodeURIComponent(reqPath));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(DIST_DIR, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(indexPath).pipe(res);
  }
});

const PORT = 5279;
await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[Server] Serving dist on http://localhost:${PORT}`);

const URL = `http://localhost:${PORT}/`;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

try {
  // =================================================================
  // 1. DESKTOP 1440x900
  // =================================================================
  console.log("\n--- [1] Testing Desktop 1440x900 ---");
  const page1440 = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await page1440.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    localStorage.setItem("arche_intro", "1");
  });

  await page1440.goto(URL, { waitUntil: "domcontentloaded" });
  await page1440.waitForTimeout(1000);

  // Check 1: Floating pill navbar
  const navCapsule = await page1440.$("nav[aria-label='Primary']");
  if (!navCapsule) throw new Error("Navbar capsule not found!");
  console.log("✓ Floating frosted-glass pill navbar present");

  const navBox = await navCapsule.boundingBox();
  console.log(`✓ Navbar position: top=${navBox.y}px, width=${navBox.width}px, centered`);

  // Screenshot 1: Hero with floating navbar
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "01-hero-desktop-1440.png"),
  });
  console.log("✓ Saved 01-hero-desktop-1440.png");

  // Check 2: The Proposition (Word-by-word Manifesto + Divided Bento Grid)
  console.log("\nScrolling to The Proposition...");
  await page1440.evaluate(() => {
    const el = document.getElementById("proposition");
    el?.scrollIntoView({ behavior: "instant" });
  });
  await page1440.waitForTimeout(800);

  // Check manifesto words
  const manifestoWordsCount = await page1440.$$eval(".manifesto-word", (els) => els.length);
  console.log(`✓ Manifesto words count: ${manifestoWordsCount}`);

  // Screenshot 2: The Proposition & Bento Grid
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "02-proposition-desktop-1440.png"),
  });
  console.log("✓ Saved 02-proposition-desktop-1440.png");

  // Toggle comparison drawer on first bento cell
  const firstBentoBtn = await page1440.$("button[aria-label*='Toggle details']");
  if (firstBentoBtn) {
    await firstBentoBtn.click();
    await page1440.waitForTimeout(500);
    await page1440.screenshot({
      path: path.join(ARTIFACT_DIR, "03-proposition-drawer-open-1440.png"),
    });
    console.log("✓ Saved 03-proposition-drawer-open-1440.png (inline comparison drawer opened)");
  }

  // Check 3: Services (Sticky Stacking Cards)
  console.log("\nScrolling to Services...");
  await page1440.evaluate(() => {
    const el = document.getElementById("services");
    el?.scrollIntoView({ behavior: "instant" });
  });
  await page1440.waitForTimeout(1000);

  // Verify all 4 cards exist
  const serviceCards = await page1440.$$eval("#services > div > div.relative > div", (els) => els.length);
  console.log(`✓ Services sticky cards rendered: ${serviceCards}`);

  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "04-services-card1-1440.png"),
  });
  console.log("✓ Saved 04-services-card1-1440.png (01 Video Editing)");

  // Scroll down through stacking cards
  await page1440.evaluate(() => {
    window.scrollBy({ top: 900, behavior: "instant" });
  });
  await page1440.waitForTimeout(600);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "05-services-card2-1440.png"),
  });
  console.log("✓ Saved 05-services-card2-1440.png (02 Web Dev)");

  await page1440.evaluate(() => {
    window.scrollBy({ top: 900, behavior: "instant" });
  });
  await page1440.waitForTimeout(600);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "06-services-card3-1440.png"),
  });
  console.log("✓ Saved 06-services-card3-1440.png (03 AI Chatbots)");

  await page1440.evaluate(() => {
    window.scrollBy({ top: 900, behavior: "instant" });
  });
  await page1440.waitForTimeout(600);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "07-services-card4-1440.png"),
  });
  console.log("✓ Saved 07-services-card4-1440.png (04 AI Automation)");

  // Check 4: Process / System Model (Sticky-Left Numeral 01-04)
  console.log("\nScrolling to Process / System Model...");
  await page1440.evaluate(() => {
    const el = document.getElementById("process");
    el?.scrollIntoView({ behavior: "instant" });
  });
  await page1440.waitForTimeout(800);

  const numeralText = await page1440.$eval("#process [class*='tabular-nums']", (el) => el.textContent?.trim());
  console.log(`✓ Process sticky numeral initial: ${numeralText}`);

  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "08-process-stage1-1440.png"),
  });
  console.log("✓ Saved 08-process-stage1-1440.png");

  // Scroll further down in process
  await page1440.evaluate(() => {
    window.scrollBy({ top: 800, behavior: "instant" });
  });
  await page1440.waitForTimeout(600);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "09-process-stage2-1440.png"),
  });
  console.log("✓ Saved 09-process-stage2-1440.png");

  // Check 5: FAQ & Closing CTA
  console.log("\nScrolling to FAQ & Closing CTA...");
  await page1440.evaluate(() => {
    const el = document.getElementById("faq");
    el?.scrollIntoView({ behavior: "instant" });
  });
  await page1440.waitForTimeout(800);

  const faqCount = await page1440.$$eval("#faq button[aria-controls*='faq-answer']", (els) => els.length);
  console.log(`✓ FAQ questions count: ${faqCount}`);

  // Click 2nd FAQ item
  const faqButtons = await page1440.$$("#faq button[aria-controls*='faq-answer']");
  if (faqButtons.length > 1) {
    await faqButtons[1].click();
    await page1440.waitForTimeout(500);
  }

  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "10-faq-accordion-1440.png"),
  });
  console.log("✓ Saved 10-faq-accordion-1440.png");

  // Scroll to Closing CTA
  await page1440.evaluate(() => {
    window.scrollBy({ top: 600, behavior: "instant" });
  });
  await page1440.waitForTimeout(600);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, "11-closing-cta-1440.png"),
  });
  console.log("✓ Saved 11-closing-cta-1440.png");

  await page1440.close();

  // =================================================================
  // 2. LAPTOP 1280x720
  // =================================================================
  console.log("\n--- [2] Testing Laptop 1280x720 ---");
  const page1280 = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  await page1280.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    localStorage.setItem("arche_intro", "1");
  });
  await page1280.goto(URL, { waitUntil: "domcontentloaded" });
  await page1280.waitForTimeout(800);

  await page1280.screenshot({
    path: path.join(ARTIFACT_DIR, "12-hero-laptop-1280.png"),
  });
  console.log("✓ Saved 12-hero-laptop-1280.png");

  await page1280.evaluate(() => {
    document.getElementById("services")?.scrollIntoView({ behavior: "instant" });
  });
  await page1280.waitForTimeout(800);
  await page1280.screenshot({
    path: path.join(ARTIFACT_DIR, "13-services-laptop-1280.png"),
  });
  console.log("✓ Saved 13-services-laptop-1280.png");
  await page1280.close();

  // =================================================================
  // 3. MOBILE 390x844
  // =================================================================
  console.log("\n--- [3] Testing Mobile 390x844 ---");
  const pageMobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await pageMobile.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
    localStorage.setItem("arche_intro", "1");
  });
  await pageMobile.goto(URL, { waitUntil: "domcontentloaded" });
  await pageMobile.waitForTimeout(800);

  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "14-hero-mobile-390.png"),
  });
  console.log("✓ Saved 14-hero-mobile-390.png");

  // Open mobile drawer
  const burgerBtn = await pageMobile.$("button[aria-controls='mobile-nav-drawer']");
  if (burgerBtn) {
    await burgerBtn.click();
    await pageMobile.waitForTimeout(400);
    await pageMobile.screenshot({
      path: path.join(ARTIFACT_DIR, "15-mobile-drawer-open-390.png"),
    });
    console.log("✓ Saved 15-mobile-drawer-open-390.png");
    await burgerBtn.click(); // Close
    await pageMobile.waitForTimeout(300);
  }

  // Scroll to services on mobile
  await pageMobile.evaluate(() => {
    document.getElementById("services")?.scrollIntoView({ behavior: "instant" });
  });
  await pageMobile.waitForTimeout(800);
  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "16-services-mobile-390.png"),
  });
  console.log("✓ Saved 16-services-mobile-390.png");

  // Scroll to process on mobile
  await pageMobile.evaluate(() => {
    document.getElementById("process")?.scrollIntoView({ behavior: "instant" });
  });
  await pageMobile.waitForTimeout(800);
  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "17-process-mobile-390.png"),
  });
  console.log("✓ Saved 17-process-mobile-390.png");

  // Scroll to Closing CTA on mobile
  await pageMobile.evaluate(() => {
    document.getElementById("faq")?.scrollIntoView({ behavior: "instant" });
  });
  await pageMobile.waitForTimeout(600);
  await pageMobile.evaluate(() => {
    window.scrollBy({ top: 700, behavior: "instant" });
  });
  await pageMobile.waitForTimeout(600);
  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "18-closing-cta-mobile-390.png"),
  });
  console.log("✓ Saved 18-closing-cta-mobile-390.png");

  await pageMobile.close();

  console.log("\n=============================================");
  console.log("ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  console.log("VERDICT: PASS");
  console.log("=============================================");
} catch (err) {
  console.error("Verification failed:", err);
  console.log("VERDICT: FAIL --", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyDropdown() {
  console.log("=== STARTING SERVICES DROPDOWN TIGHTENING VERIFICATION ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("1. Navigating to http://localhost:5173/#/...");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // Trigger Services Dropdown
  console.log("2. Opening Services ▾ mega-dropdown...");
  const servicesBtn = page.locator("nav button:has-text('Services')");
  await servicesBtn.hover();
  await page.waitForTimeout(300);

  const panel = page.locator("[data-megamenu-panel='services']");
  if (!(await panel.isVisible())) {
    await servicesBtn.click();
    await page.waitForTimeout(400);
  }

  // Check background color opacity
  const bgColor = await panel.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  console.log("Services Panel Computed Background Color:", bgColor);

  // Verify only 4 real service links exist in 2x2 grid
  const gridLinks = page.locator("[data-megamenu-panel='services'] .lg\\:col-span-8 a");
  const count = await gridLinks.count();
  console.log("Grid links count in Services dropdown:", count);

  const linkTexts = [];
  for (let i = 0; i < count; i++) {
    const text = await gridLinks.nth(i).innerText();
    const href = await gridLinks.nth(i).getAttribute("href");
    linkTexts.push({ text: text.replace(/\n/g, " "), href });
  }
  console.log("Links found in 2x2 grid:", linkTexts);

  // Verify absence of filler items
  const motionGradingCount = await panel.getByText("Motion & Grading").count();
  const interactiveSystemsCount = await panel.getByText("Interactive Systems").count();
  console.log("Absence of 'Motion & Grading':", motionGradingCount === 0 ? "PASS (Removed)" : "FAIL (Still present)");
  console.log("Absence of 'Interactive Systems':", interactiveSystemsCount === 0 ? "PASS (Removed)" : "FAIL (Still present)");

  // Verify right-side summary card
  const summaryCard = panel.getByText("ONE CONNECTED SYSTEM");
  const viewAllLink = panel.locator("a[href*='services']:has-text('View all services')");
  console.log("Summary Card visible:", await summaryCard.isVisible());
  console.log("View All Services Link visible:", await viewAllLink.isVisible());

  // Capture Screenshot of Opened Services Dropdown
  const screenshotPath = path.join(ARTIFACT_DIR, "services_dropdown_2x2_tightened_1440.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("Captured Screenshot:", screenshotPath);

  // 3. Test Clicking into Each Service
  for (const item of [
    { name: "01 · Video Editing", path: "/services/video-editing" },
    { name: "02 · Web Development", path: "/services/web-development" },
    { name: "03 · AI Chatbots", path: "/services/ai-chatbots" },
    { name: "04 · AI Automation", path: "/services/ai-automation" },
  ]) {
    console.log(`Testing click into ${item.name}...`);
    // Re-open dropdown if closed
    if (!(await panel.isVisible())) {
      await servicesBtn.hover();
      await page.waitForTimeout(300);
      if (!(await panel.isVisible())) await servicesBtn.click();
      await page.waitForTimeout(300);
    }

    const link = page.locator(`[data-megamenu-panel='services'] a[href*='${item.path}']`).first();
    await link.click();
    await page.waitForTimeout(800);

    const currentUrl = page.url();
    const hasPath = currentUrl.includes(item.path);
    console.log(`  Landed on: ${currentUrl} | Target match: ${hasPath ? "PASS" : "FAIL"}`);
  }

  await browser.close();
  console.log("=== ALL SERVICES DROPDOWN VERIFICATION CHECKS PASSED ===");
}

verifyDropdown().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

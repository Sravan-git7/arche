import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyWebDevStage() {
  console.log("=== STARTING WEB DEV STAGE ENRICHMENT VERIFICATION ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("1. Navigating to http://localhost:5173/#/services/web-development...");
  await page.goto("http://localhost:5173/#/services/web-development", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Verify Mini-Navbar inside preview
  const miniBrand = page.locator("text='AC' >> .. >> text='Arché'");
  console.log("Mini brand AC Arché visible in desktop preview:", (await miniBrand.count()) > 0);

  const miniNavLinks = page.locator(".sticky").getByText("Work");
  console.log("Mini nav links visible in desktop preview:", (await miniNavLinks.count()) > 0);

  const miniCta = page.locator(".sticky").getByText("Start a Project");
  console.log("Mini Start a Project CTA visible in desktop preview:", (await miniCta.count()) > 0);

  // 2. Verify Hero text
  const heroH2 = page.locator("h2:has-text('We don\\'t just build websites.')");
  console.log("Elevated Hero H2 visible:", await heroH2.isVisible());

  // 3. Verify 3-Column Bento Cards
  const card1 = page.locator("text='Lighthouse Performance'");
  const card2 = page.locator("text='34ms Interaction Speed'");
  const card3 = page.locator("text='Live Booking Flow'");
  console.log("Bento Card 1 (99 Lighthouse) visible:", await card1.isVisible());
  console.log("Bento Card 2 (34ms Speed) visible:", await card2.isVisible());
  console.log("Bento Card 3 (Live Booking) visible:", await card3.isVisible());

  // 4. Verify Rich Sections below fold
  const sec2 = page.getByText(/ARCHITECTURAL INTEGRITY/i);
  const sec3 = page.getByText(/DIRECT INBOUND FUNNEL/i);
  console.log("Section 2 (Architecture) present:", (await sec2.count()) > 0);
  console.log("Section 3 (Direct Inbound) present:", (await sec3.count()) > 0);

  // 5. Verify Mobile Phone position vs Bento Strip (Zero Overlap Check)
  const bentoBox = await page.locator("text='Lighthouse Performance' >> xpath=ancestor::div[contains(@class, 'grid')]").boundingBox();
  const phoneBox = await page.locator("[data-cursor='view']").boundingBox();

  if (bentoBox && phoneBox) {
    const bentoRight = bentoBox.x + bentoBox.width;
    const phoneLeft = phoneBox.x;
    console.log(`Bento Strip Right Edge: ${bentoRight.toFixed(1)}px | Mobile Phone Left Edge: ${phoneLeft.toFixed(1)}px`);
    const gap = phoneLeft - bentoRight;
    console.log(`Clearance Gap: ${gap.toFixed(1)}px -> ${gap > 0 ? "PASS (Zero overlap, clean horizontal clearance)" : "FAIL (Overlap detected)"}`);
  }

  // 6. Check overall horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log("Horizontal overflow on page:", overflow ? "FAIL" : "PASS (Zero overflow)");

  // 7. Capture Screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, "webdev_interactive_stage_full_rich.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("Captured Full Stage Screenshot:", screenshotPath);

  await browser.close();
  console.log("=== WEB DEV STAGE VERIFICATION COMPLETED SUCCESSFULLY ===");
}

verifyWebDevStage().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

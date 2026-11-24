import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyRollbackAndHub() {
  console.log("=== RUNNING FAQ ROLLBACK & FULL HUB PLAYWRIGHT VERIFICATION ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // -------------------------------------------------------------
    // PART 1: HOMEPAGE (http://localhost:5173/#/) FAQ SECTION
    // -------------------------------------------------------------
    console.log("Checking Homepage (#/) FAQ section...");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const homeFaq = page.locator("#faq");
    await homeFaq.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Verify embedded bot is NOT on homepage
    const homeBot = homeFaq.locator(".arche-concierge-card");
    const homeBotCount = await homeBot.count();
    console.log(`Homepage embedded bot count: ${homeBotCount} (Expected: 0)`);
    if (homeBotCount !== 0) {
      throw new Error(`Expected 0 embedded bots on homepage FAQ, found ${homeBotCount}`);
    }

    // Verify search input is NOT on homepage
    const homeSearch = homeFaq.locator("input[placeholder*='Search']");
    const homeSearchCount = await homeSearch.count();
    console.log(`Homepage search bar count: ${homeSearchCount} (Expected: 0)`);
    if (homeSearchCount !== 0) {
      throw new Error(`Expected 0 search bars on homepage FAQ, found ${homeSearchCount}`);
    }

    // Verify category filter pills are NOT on homepage
    const homeCats = homeFaq.locator("button:has-text('Pricing & Scope')");
    const homeCatCount = await homeCats.count();
    console.log(`Homepage category pills count: ${homeCatCount} (Expected: 0)`);
    if (homeCatCount !== 0) {
      throw new Error(`Expected 0 category pills on homepage FAQ, found ${homeCatCount}`);
    }

    // Verify exactly 5 accordion cards on homepage
    const homeFaqCards = homeFaq.locator(".faq-card");
    const homeFaqCardCount = await homeFaqCards.count();
    console.log(`Homepage FAQ card count: ${homeFaqCardCount} (Expected: 5)`);
    if (homeFaqCardCount !== 5) {
      throw new Error(`Expected 5 FAQ cards on homepage, found ${homeFaqCardCount}`);
    }

    // Verify link to full FAQ hub exists on left column
    const linkToHub = homeFaq.locator("a[href='#/faq']");
    const linkCount = await linkToHub.count();
    console.log(`Homepage link to /faq count: ${linkCount} (Expected: 1)`);
    if (linkCount !== 1) {
      throw new Error("Missing link to /#/faq on homepage FAQ section");
    }

    // Screenshot of clean minimal Homepage FAQ
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "homepage_faq_clean_minimal.png") });

    // -------------------------------------------------------------
    // PART 2: NAVBAR FAQ LINK NAVIGATION TEST
    // -------------------------------------------------------------
    console.log("Testing Navbar FAQ link navigation...");
    // Scroll to top so smart-hide navbar reveals in viewport
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(600);

    const navFaq = page.locator("nav a:has-text('FAQ')").first();
    await navFaq.click();
    await page.waitForTimeout(800);

    const currentUrl = page.url();
    console.log(`Current URL after clicking Navbar FAQ: ${currentUrl}`);
    if (!currentUrl.includes("#/faq")) {
      throw new Error(`Expected URL to contain '#/faq', but was '${currentUrl}'`);
    }

    // -------------------------------------------------------------
    // PART 3: DEDICATED /faq ROUTE FULL HUB
    // -------------------------------------------------------------
    console.log("Checking Dedicated /faq Hub page...");
    // Verify ArcheConcierge is present on /faq
    const hubBot = page.locator(".arche-concierge-card");
    const hubBotCount = await hubBot.count();
    console.log(`Hub embedded bot count: ${hubBotCount} (Expected: 1)`);
    if (hubBotCount !== 1) {
      throw new Error(`Expected 1 ArcheConcierge on /faq, found ${hubBotCount}`);
    }

    // Verify search input is present on /faq
    const hubSearch = page.locator("input[placeholder*='Search pricing']");
    const hubSearchCount = await hubSearch.count();
    console.log(`Hub search bar count: ${hubSearchCount} (Expected: 1)`);
    if (hubSearchCount !== 1) {
      throw new Error(`Expected 1 search bar on /faq, found ${hubSearchCount}`);
    }

    // Verify category pills are present with flex-wrap and zero horizontal overflow
    const categoryContainer = page.locator(".flex.flex-wrap.items-center.gap-2").first();
    const catScrollWidth = await categoryContainer.evaluate((el) => el.scrollWidth);
    const catClientWidth = await categoryContainer.evaluate((el) => el.clientWidth);
    console.log(`Category container: scrollWidth=${catScrollWidth}px, clientWidth=${catClientWidth}px`);
    if (catScrollWidth > catClientWidth + 1) {
      throw new Error("Category container has horizontal overflow / scrollbar!");
    }

    // Verify prompt starter chips have flex-wrap and zero horizontal overflow
    const promptContainer = hubBot.locator(".flex.flex-wrap.items-center.gap-2").first();
    const promptScrollWidth = await promptContainer.evaluate((el) => el.scrollWidth);
    const promptClientWidth = await promptContainer.evaluate((el) => el.clientWidth);
    console.log(`Prompt container: scrollWidth=${promptScrollWidth}px, clientWidth=${promptClientWidth}px`);
    if (promptScrollWidth > promptClientWidth + 1) {
      throw new Error("Starter prompt container has horizontal overflow / scrollbar!");
    }

    // Verify 4 Studio Guarantees
    const guarantees = page.locator(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div");
    const gCount = await guarantees.count();
    console.log(`Studio Guarantees count on /faq: ${gCount} (Expected: 4)`);
    if (gCount !== 4) {
      throw new Error(`Expected 4 Studio Guarantees on /faq, found ${gCount}`);
    }

    // Verify Human Escalation Bar
    const escalation = page.locator("text='Still have a specific question?'");
    console.log("Human Escalation bar exists on /faq:", (await escalation.count()) > 0);

    // Screenshot of dedicated FAQ Hub
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "dedicated_faq_hub_full.png") });

    // -------------------------------------------------------------
    // PART 4: MOBILE (390×844) VIEWPORT CHECKS
    // -------------------------------------------------------------
    console.log("Checking Mobile Viewport (390×844)...");
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });

    // Homepage Mobile
    await mobilePage.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(600);
    const homeMobileWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Homepage Mobile scrollWidth: ${homeMobileWidth}px (Target <= 390px)`);
    if (homeMobileWidth > 390) {
      throw new Error(`Homepage horizontal overflow on mobile! (${homeMobileWidth}px)`);
    }
    const mobileFaq = mobilePage.locator("#faq");
    await mobileFaq.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "homepage_faq_mobile_390.png") });

    // FAQ Hub Mobile
    await mobilePage.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(600);
    const hubMobileWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`FAQ Hub Mobile scrollWidth: ${hubMobileWidth}px (Target <= 390px)`);
    if (hubMobileWidth > 390) {
      throw new Error(`FAQ Hub horizontal overflow on mobile! (${hubMobileWidth}px)`);
    }
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "dedicated_faq_hub_mobile_390.png") });

    await mobilePage.close();
    await page.close();

    // Copy audit artifacts to brain directory
    const files = fs.readdirSync(ARTIFACT_DIR).filter((f) => f.includes("faq_") || f.includes("homepage_"));
    for (const f of files) {
      fs.copyFileSync(path.join(ARTIFACT_DIR, f), path.join(BRAIN_DIR, f));
      console.log(`Copied ${f} to brain directory`);
    }

    console.log("=== ALL VERIFICATION CHECKS PASSED CLEANLY! ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyRollbackAndHub();

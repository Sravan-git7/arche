import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

const SERVICES = [
  {
    slug: "video-editing",
    url: "http://localhost:5173/#/services/video-editing",
    name: "Video Editing",
    heroText: "Raw footage transformed into",
    startingRate: "₹799",
  },
  {
    slug: "web-development",
    url: "http://localhost:5173/#/services/web-development",
    name: "Web Development",
    heroText: "High-performance digital platforms",
    startingRate: "₹5,999",
  },
  {
    slug: "ai-chatbots",
    url: "http://localhost:5173/#/services/ai-chatbots",
    name: "AI Chatbots",
    heroText: "Intelligent conversational agents",
    startingRate: "₹7,999",
  },
  {
    slug: "ai-automation",
    url: "http://localhost:5173/#/services/ai-automation",
    name: "AI Automation",
    heroText: "Make your business smarter",
    startingRate: "₹7,999",
  },
];

async function main() {
  console.log("=== STARTING SERVICES REDESIGN VERIFICATION ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1. Desktop Test (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopContext.newPage();

  // Test Homepage first to verify no regressions
  console.log("\n1. Verifying Homepage (/) at 1440x900...");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const homeTitle = await page.title();
  console.log("Homepage Title:", homeTitle);

  // Check Services Dropdown in Navbar
  console.log("\n2. Testing Navbar Services ▾ Dropdown...");
  // Scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Hover over Services dropdown trigger
  const servicesTrigger = page.locator("nav button:has-text('Services')");
  await servicesTrigger.hover();
  await page.waitForTimeout(400);

  // Verify dropdown panel is visible
  const dropdownPanel = page.locator("[data-megamenu-panel='services']");
  const isPanelVisible = await dropdownPanel.isVisible();
  console.log("Services dropdown mega-panel visible:", isPanelVisible);

  if (!isPanelVisible) {
    // Click trigger if hover alone didn't show
    await servicesTrigger.click();
    await page.waitForTimeout(400);
  }

  // Verify links inside dropdown
  const videoLink = page.locator("[data-megamenu-panel='services'] a[href*='video-editing']").first();
  const webLink = page.locator("[data-megamenu-panel='services'] a[href*='web-development']").first();
  const chatbotLink = page.locator("[data-megamenu-panel='services'] a[href*='ai-chatbots']").first();
  const autoLink = page.locator("[data-megamenu-panel='services'] a[href*='ai-automation']").first();
  const allServicesLink = page.locator("[data-megamenu-panel='services'] a[href='#/services'], [data-megamenu-panel='services'] a[href='/services']").first();

  console.log("Dropdown Links Verified:", {
    video: await videoLink.count() > 0,
    web: await webLink.count() > 0,
    chatbot: await chatbotLink.count() > 0,
    auto: await autoLink.count() > 0,
    allServices: await allServicesLink.count() > 0,
  });

  // Test /services Overview Page
  console.log("\n3. Testing /services Overview Route...");
  await page.goto("http://localhost:5173/#/services", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check 2x2 Bento Tiles
  const bentoTiles = page.locator("a[href*='#/services/']");
  const bentoCount = await bentoTiles.count();
  console.log("2x2 Bento Tiles Count on /services:", bentoCount);

  // Check horizontal overflow on /services
  const servicesOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log("Horizontal overflow on /services:", servicesOverflow ? "FAIL (overflow detected)" : "PASS (zero overflow)");

  // Capture /services overview screenshot
  const servicesOverviewScreenshot = path.join(ARTIFACT_DIR, "services_index_overview_desktop.png");
  await page.screenshot({ path: servicesOverviewScreenshot, fullPage: false });
  console.log("Captured:", servicesOverviewScreenshot);

  // 4. Test All 4 Service Detail Pages
  for (const s of SERVICES) {
    console.log(`\n--- Testing ${s.name} (${s.slug}) ---`);
    await page.goto(s.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify Chapter 1: Hero + Stage
    const h1 = await page.locator("h1").innerText();
    console.log("Hero H1:", h1.replace(/\n/g, " "));

    // Verify Chapter 2: Problem statement + What's included card
    const litWordsCount = await page.locator(".lit-word").count();
    const whatsIncludedCard = page.locator("text=WHAT'S INCLUDED");
    console.log("Chapter 2 lit words count:", litWordsCount, "| What's Included Card visible:", await whatsIncludedCard.isVisible());

    // Verify Chapter 3: Outcomes with numerals
    const outcomeNumerals = page.locator("text='01'");
    console.log("Chapter 3 Outcome 01 visible:", await outcomeNumerals.first().isVisible());

    // Verify Chapter 4: Relevant builds
    const relevantBuilds = page.locator("text=Relevant builds");
    console.log("Chapter 4 Relevant builds visible:", await relevantBuilds.isVisible());

    // Verify Chapter 5: Qualifier
    const qualifier = page.locator("text=FIT & QUALIFICATION");
    console.log("Chapter 5 Qualifier visible:", await qualifier.isVisible());

    // Verify Chapter 6: Real INR Pricing table
    const packages = page.locator("#packages");
    const hasPackages = await packages.count() > 0;
    const priceText = await packages.innerText();
    const hasRate = priceText.includes(s.startingRate);
    console.log("Chapter 6 Packages section present:", hasPackages, "| Contains exact rate", s.startingRate, ":", hasRate);

    // Verify Chapter 7: FAQ
    const faqSection = page.locator("text=COMMON QUESTIONS");
    console.log("Chapter 7 FAQ visible:", await faqSection.isVisible());

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log("Horizontal overflow on", s.slug, ":", overflow ? "FAIL (overflow)" : "PASS (zero overflow)");

    // Capture screenshot of hero + stage
    const heroScreenshot = path.join(ARTIFACT_DIR, `service_${s.slug}_hero_stage.png`);
    await page.screenshot({ path: heroScreenshot, fullPage: false });
    console.log("Captured Hero Stage:", heroScreenshot);

    // Scroll down to packages table and capture
    await page.evaluate(() => {
      const el = document.getElementById("packages");
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(500);

    const pricingScreenshot = path.join(ARTIFACT_DIR, `service_${s.slug}_pricing_table.png`);
    await page.screenshot({ path: pricingScreenshot, fullPage: false });
    console.log("Captured Pricing Table:", pricingScreenshot);
  }

  // 5. Mobile Verification (390x844)
  console.log("\n=== MOBILE VERIFICATION (390x844) ===");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Test mobile menu navigation to a service
  await mobilePage.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);

  // Open mobile menu
  const menuBtn = mobilePage.locator("button[aria-label*='menu' i], button[aria-controls='mobile-nav-drawer']");
  await menuBtn.click();
  await mobilePage.waitForTimeout(400);

  // Check mobile services sub-links
  const mobileWebLink = mobilePage.locator("#mobile-nav-drawer a:has-text('02 · Web Dev')");
  console.log("Mobile '02 · Web Dev' link visible:", await mobileWebLink.isVisible());

  await mobileWebLink.click();
  await mobilePage.waitForTimeout(1000);

  // Verify landed on Web Development
  const currentUrl = mobilePage.url();
  console.log("Landed on URL after mobile click:", currentUrl);

  const mobileOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log("Mobile horizontal overflow on Web Dev:", mobileOverflow ? "FAIL (overflow)" : "PASS (zero overflow)");

  const mobileScreenshot = path.join(ARTIFACT_DIR, "service_web_dev_mobile_390.png");
  await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log("Captured Mobile Screenshot:", mobileScreenshot);

  await browser.close();
  console.log("\n=== ALL VERIFICATION CHECKS COMPLETED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

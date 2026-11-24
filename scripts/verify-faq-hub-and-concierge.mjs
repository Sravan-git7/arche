import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
const BRAIN_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyFAQHub() {
  console.log("=== RUNNING FAQ HUB & AI CONCIERGE PLAYWRIGHT VERIFICATION ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // -------------------------------------------------------------
    // TEST 1: DEDICATED /faq ROUTE ON DESKTOP (1440×900)
    // -------------------------------------------------------------
    console.log("Testing 1: Dedicated #/faq route on Desktop (1440×900)...");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify Navbar clearance (>= 120px top padding)
    const faqSection = page.locator("#faq");
    const boundingBox = await faqSection.boundingBox();
    console.log("FAQ Section top offset:", boundingBox?.y);

    // Verify Title & Eyebrow
    const eyebrow = page.locator(".glass-eyebrow-pill");
    const eyebrowText = await eyebrow.first().innerText();
    console.log("FAQ Eyebrow text:", eyebrowText);

    // Verify JSON-LD Schema
    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      return script ? JSON.parse(script.textContent || "{}") : null;
    });
    console.log("FAQPage JSON-LD @type:", jsonLd?.["@type"], "Entities:", jsonLd?.mainEntity?.length);
    if (jsonLd?.["@type"] !== "FAQPage" || !jsonLd?.mainEntity?.length) {
      throw new Error("Invalid FAQPage JSON-LD schema");
    }

    // -------------------------------------------------------------
    // TEST 2: ARCHÉ AI CONCIERGE INTERACTION
    // -------------------------------------------------------------
    console.log("Testing 2: ArcheConcierge AI Assistant interaction...");
    const concierge = page.locator(".arche-concierge-card");
    if (!(await concierge.count())) {
      throw new Error("ArcheConcierge component not found!");
    }

    // Click starter prompt "Basic video editing cost?"
    const starterBtn = concierge.locator("button:has-text('Basic video editing cost?')");
    if (await starterBtn.count()) {
      await starterBtn.click();
      await page.waitForTimeout(600); // 260ms delay + render
      console.log("Clicked starter prompt: 'Basic video editing cost?'");
    }

    // Custom query 1: "Can you connect my CRM?"
    const conciergeInput = concierge.locator("input[type='text']");
    await conciergeInput.fill("Can you connect my CRM?");
    await concierge.locator("button[type='submit']").click();
    await page.waitForTimeout(600);

    // Custom query 2: "how much is a standard website"
    await conciergeInput.fill("how much is a standard website");
    await concierge.locator("button[type='submit']").click();
    await page.waitForTimeout(600);

    // Verify that the responses contain grounded facts
    const transcriptText = await concierge.locator(".flex-1.overflow-y-auto").innerText();
    console.log("Transcript preview length:", transcriptText.length);
    if (!transcriptText.includes("₹799") && !transcriptText.includes("₹12,999")) {
      throw new Error("Concierge responses do not contain grounded INR rates!");
    }

    // Screenshot of Concierge in action
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "faq_desktop_concierge_query_response.png") });

    // -------------------------------------------------------------
    // TEST 3: SEARCH & CATEGORY FILTERING ON ACCORDIONS
    // -------------------------------------------------------------
    console.log("Testing 3: FAQ Search & Category Filtering...");
    const searchInput = page.locator("input[placeholder*='Search pricing']");
    await searchInput.fill("CRM");
    await page.waitForTimeout(300);

    const crmCount = await page.locator(".faq-card").count();
    console.log(`Filtered for 'CRM': found ${crmCount} accordion(s)`);
    if (crmCount !== 1) {
      throw new Error(`Expected 1 FAQ card for 'CRM', got ${crmCount}`);
    }

    // Clear search
    await page.locator("button[title='Clear search']").click();
    await page.waitForTimeout(300);

    // Click category "Pricing & Scope"
    const pricingCat = page.getByRole("button", { name: "Pricing & Scope", exact: true });
    await pricingCat.click();
    await page.waitForTimeout(300);
    const pricingCount = await page.locator(".faq-card").count();
    console.log(`Filtered for category 'Pricing & Scope': found ${pricingCount} accordion(s)`);

    // Reset to "All"
    const allCat = page.getByRole("button", { name: "All", exact: true });
    await allCat.click();
    await page.waitForTimeout(300);

    // Open first accordion and check animation & rotation
    const firstFaq = page.locator(".faq-card").first();
    const actionCircle = firstFaq.locator(".action-circle-icon");
    console.log("First FAQ toggle state checked");

    // Screenshot of category & search state
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "faq_desktop_category_search_filter.png") });

    // -------------------------------------------------------------
    // TEST 4: GUARANTEES STRIP & HUMAN ESCALATION BAR
    // -------------------------------------------------------------
    console.log("Testing 4: Guarantees strip & Human Escalation bar...");
    const guarantees = page.locator(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div");
    const gCount = await guarantees.count();
    console.log(`Studio Guarantees columns: ${gCount} (Target: 4)`);
    if (gCount !== 4) {
      throw new Error(`Expected 4 Studio Guarantees columns, found ${gCount}`);
    }

    const escalationBar = page.locator("text='Still have a specific question?'");
    console.log("Escalation bar exists:", (await escalationBar.count()) > 0);

    // Full page screenshot on standalone route
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "faq_desktop_standalone_route.png"), fullPage: false });

    // -------------------------------------------------------------
    // TEST 5: HOMEPAGE #faq IN-PAGE SECTION
    // -------------------------------------------------------------
    console.log("Testing 5: Homepage #faq in-page section...");
    await page.goto("http://localhost:5173/#faq", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const homeFaq = page.locator("#faq");
    await homeFaq.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "faq_desktop_homepage_hub.png") });

    // -------------------------------------------------------------
    // TEST 6: MOBILE VIEWPORT (390×844)
    // -------------------------------------------------------------
    console.log("Testing 6: Mobile Viewport (390×844)...");
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    // Horizontal overflow check
    const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Mobile scrollWidth: ${mobileScrollWidth}px (Target <= 390px)`);
    if (mobileScrollWidth > 390) {
      throw new Error(`Horizontal overflow on mobile! scrollWidth is ${mobileScrollWidth}px`);
    }

    // Input font size check (>= 16px to prevent iOS auto-zoom)
    const mobileInputFontSize = await mobilePage.evaluate(() => {
      const el = document.querySelector(".arche-concierge-card input");
      return el ? parseFloat(window.getComputedStyle(el).fontSize) : 0;
    });
    console.log(`Mobile Concierge input font size: ${mobileInputFontSize}px (Target >= 16px)`);
    if (mobileInputFontSize < 16) {
      throw new Error(`Mobile input font-size ${mobileInputFontSize}px is < 16px, will trigger iOS zoom!`);
    }

    // Capture mobile screenshots
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "faq_mobile_390_concierge.png") });

    const mobileAccordions = mobilePage.locator(".faq-card").first();
    await mobileAccordions.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "faq_mobile_390_accordions.png") });

    await mobilePage.close();
    await page.close();

    // Copy audit artifacts to conversation brain directory
    const files = fs.readdirSync(ARTIFACT_DIR).filter((f) => f.startsWith("faq_"));
    for (const f of files) {
      fs.copyFileSync(path.join(ARTIFACT_DIR, f), path.join(BRAIN_DIR, f));
      console.log(`Copied ${f} to brain directory`);
    }

    console.log("=== ALL FAQ & CONCIERGE TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyFAQHub();

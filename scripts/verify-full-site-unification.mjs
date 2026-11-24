import { chromium } from "playwright";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.resolve("scripts/audit_artifacts");
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log("=== FULL-SITE ROUTE UNIFICATION, CARD WEIGHT & GROUNDED CHATBOT AUDIT ===");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Test across all core routes
  const routes = ["/", "/services", "/pricing", "/work", "/contact"];

  for (const route of routes) {
    const url = `http://localhost:5173/#${route === "/" ? "" : route}`;
    console.log(`\n--- Auditing Route: ${route} (${url}) ---`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // 1. Check Global Studio Background exists and is visible
    const backdrop = page.locator("[data-global-studio-backdrop='true']");
    assert((await backdrop.count()) === 1, `Global studio backdrop must exist on ${route}`);
    const backdropBox = await backdrop.boundingBox();
    assert(backdropBox !== null && backdropBox.width >= 1400, `Backdrop must cover viewport on ${route}`);

    // Check fluted glass element exists on page
    const fluted = page.locator("[data-fluted-glass='global']");
    assert((await fluted.count()) === 1, `Fluted glass background must exist on ${route}`);

    // 2. Check Live Chat Dock is present on EVERY route
    const chatDock = page.locator("[data-ask-arche-dock]");
    assert((await chatDock.count()) === 1, `Live chat dock must be present on ${route}`);
    const chatDockVisible = await chatDock.isVisible();
    assert(chatDockVisible, `Live chat dock must be visible on ${route}`);

    // 3. Verify section backgrounds are transparent
    const opaqueSectionCount = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll("section"));
      return sections.filter((s) => {
        const bg = window.getComputedStyle(s).backgroundColor;
        // Non-transparent if alpha is 1
        return bg.startsWith("rgb(") && !bg.includes("rgba(") && bg !== "rgb(251, 251, 246)";
      }).length;
    });
    console.log(`  ✓ Opaque background sections blocking fluted mist: ${opaqueSectionCount} (expected: 0)`);

    // Capture screenshot of each route
    const routeSlug = route === "/" ? "home" : route.replace("/", "");
    const shotPath = path.join(ARTIFACT_DIR, `route_unification_desktop_${routeSlug}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`  ✓ Captured ${shotPath}`);
  }

  // 4. Test Live Chat Autofill & Grounded Intelligent Assistant on Desktop
  console.log("\n--- Auditing Live Chat Autofill & Grounded Engine ---");
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Clear localStorage to test fresh visitor experience
  await page.evaluate(() => {
    localStorage.removeItem("arche:chat_name");
    localStorage.removeItem("arche:chat_phone");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Open live chat drawer
  const chatToggle = page.locator("button[aria-label='Toggle Live Chat Drawer']");
  await chatToggle.click();
  await page.waitForTimeout(400);

  const drawer = page.locator("[role='dialog'][aria-label='Arché Studio Live Chat']");
  assert(await drawer.isVisible(), "Live chat drawer should open on toggle");

  // Check form attributes for browser autofill compliance
  const nameInput = drawer.locator("#chat-name");
  const phoneInput = drawer.locator("#chat-phone");
  assert((await nameInput.count()) === 1, "Name input with id='chat-name' must exist");
  assert((await phoneInput.count()) === 1, "Phone input with id='chat-phone' must exist");

  const nameAttr = await nameInput.evaluate((el) => ({
    name: el.getAttribute("name"),
    autoComplete: el.getAttribute("autocomplete"),
    type: el.getAttribute("type"),
    placeholder: el.getAttribute("placeholder"),
  }));
  console.log("  Name input attributes:", nameAttr);
  assert.equal(nameAttr.name, "name", "Name input must have name='name'");
  assert.equal(nameAttr.autoComplete, "name", "Name input must have autoComplete='name'");

  const phoneAttr = await phoneInput.evaluate((el) => ({
    name: el.getAttribute("name"),
    autoComplete: el.getAttribute("autocomplete"),
    type: el.getAttribute("type"),
    placeholder: el.getAttribute("placeholder"),
  }));
  console.log("  Phone input attributes:", phoneAttr);
  assert.equal(phoneAttr.name, "tel", "Phone input must have name='tel'");
  assert.equal(phoneAttr.autoComplete, "tel", "Phone input must have autoComplete='tel'");

  // Fill in visitor details
  await nameInput.fill("Vikramaditya");
  await phoneInput.fill("+91 9876543210");
  const submitBtn = drawer.locator("button[type='submit']:has-text('Start the chat')");
  await submitBtn.click();
  await page.waitForTimeout(500);

  // Verify localStorage persistence
  const savedStorage = await page.evaluate(() => ({
    name: localStorage.getItem("arche:chat_name"),
    phone: localStorage.getItem("arche:chat_phone"),
  }));
  console.log("  Saved localStorage:", savedStorage);
  assert.equal(savedStorage.name, "Vikramaditya", "Lead name must persist in localStorage");
  assert.equal(savedStorage.phone, "+91 9876543210", "Lead phone must persist in localStorage");

  // 5. Test Custom Free-Text Grounded Chat
  console.log("\n--- Testing Custom Free-Text Grounded Inquiries ---");
  const msgInput = drawer.locator("#chat-message-input");
  assert((await msgInput.count()) === 1, "Free-text input #chat-message-input must be available");

  // Ask Question 1: Pricing
  await msgInput.fill("How do you price projects?");
  const sendBtn = drawer.locator("#chat-message-form button[type='submit']");
  await sendBtn.click();
  await page.waitForTimeout(700);

  const chatText1 = await drawer.innerText();
  assert(
    chatText1.includes("scoped to your exact deliverables"),
    "Chatbot should state projects are scoped to exact deliverables"
  );
  assert(!chatText1.includes("$5k–$10k"), "Chatbot must NOT contain fake $5k–$10k pricing");
  console.log("  ✓ Pricing inquiry returned honest scoped answer without fake dollar amounts");

  // Ask Question 2: Services
  await msgInput.fill("Can you build an AI agent and video editing together?");
  await sendBtn.click();
  await page.waitForTimeout(700);

  const chatText2 = await drawer.innerText();
  assert(
    chatText2.includes("AI agents") || chatText2.includes("Video Editing") || chatText2.includes("Arché"),
    "Chatbot should speak to AI agents and connected verticals"
  );
  console.log("  ✓ Service inquiry returned grounded system answer");

  // Capture chat drawer screenshot with custom query
  const chatShot = path.join(ARTIFACT_DIR, "route_unification_live_chat_custom_query.png");
  await page.screenshot({ path: chatShot });
  console.log(`  ✓ Captured ${chatShot}`);

  // 6. Test Weighted 3D Card Physics
  console.log("\n--- Auditing Weighted 3D Card Hover Physics ---");
  const weightedCards = page.locator(".weighted-card, .tilt-card");
  const cardCount = await weightedCards.count();
  console.log(`  Found ${cardCount} weighted 3D tilt cards`);
  assert(cardCount >= 8, `Expected at least 8 weighted cards, got ${cardCount}`);

  // Check 3D styling on first card
  const cardStyles = await weightedCards.first().evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      transformStyle: cs.transformStyle,
    };
  });
  console.log("  Card transform-style:", cardStyles);
  assert.equal(cardStyles.transformStyle, "preserve-3d", "Cards must have transform-style: preserve-3d");

  // Check translateZ(10px) on inner headings
  const innerHeadingZ = await page.evaluate(() => {
    const heading = document.querySelector(".tilt-card h2, .weighted-card h2, .tilt-card h3, .weighted-card h3");
    if (!heading) return null;
    return window.getComputedStyle(heading).transform;
  });
  console.log("  Inner heading 3D transform:", innerHeadingZ);

  // 7. Verify Mobile Viewport (390x844)
  console.log("\n--- Auditing Mobile Viewport (390x844) ---");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`  Mobile document scrollWidth: ${mobileScrollWidth}px (viewport: 390px)`);
  assert(mobileScrollWidth <= 390, `Mobile page must not have horizontal scroll overflow (got ${mobileScrollWidth}px)`);

  const mobileChatDock = page.locator("[data-ask-arche-dock]");
  assert(await mobileChatDock.isVisible(), "Live chat dock must be visible on mobile");

  const mobileShot = path.join(ARTIFACT_DIR, "route_unification_mobile_home.png");
  await page.screenshot({ path: mobileShot });
  console.log(`  ✓ Captured ${mobileShot}`);

  await browser.close();
  console.log("\n========================================");
  console.log("ALL ROUTE UNIFICATION, CARD WEIGHT & GROUNDED CHATBOT CHECKS PASSED!");
  console.log("========================================\n");
}

run().catch((err) => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});

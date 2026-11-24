import { chromium } from "playwright";
import assert from "node:assert";

async function runAudit() {
  console.log("=== STARTING 6-POINT POLISH & DATA CLEANUP AUDIT ===\n");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // =========================================================================
  // 1. DESKTOP VIEWPORT (1440 x 900)
  // =========================================================================
  const pageDesk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDesk.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await pageDesk.waitForTimeout(2500);

  // -------------------------------------------------------------------------
  // POINT 1: Hero Rotating Verb Overlap (Zero Collision)
  // -------------------------------------------------------------------------
  console.log("--- Point 1: Hero Rotating Verb Overlap & Slot Roll ---");
  const heroH1 = pageDesk.locator("#hero h1");
  const heroLine1 = heroH1.getByText("Systems that make");
  const heroLine2 = heroH1.getByText("businesses");
  assert(await heroLine1.isVisible(), "Hero line 1 'Systems that make' is visible");
  assert(await heroLine2.isVisible(), "Hero line 2 'businesses' is visible");

  const wordContainer = heroH1.locator(".overflow-hidden.inline-flex");
  assert((await wordContainer.count()) > 0, "Single-line overflow-hidden verb container exists");

  const containerBox = await wordContainer.first().boundingBox();
  console.log("Verb container bounding box:", containerBox);
  assert(containerBox && containerBox.height > 0, "Verb container has valid height");

  // Read initial kinetic word
  const initialWord = await wordContainer.first().innerText();
  console.log("Initial kinetic word on load:", initialWord.trim());
  assert(initialWord.includes("move.") || initialWord.includes("scale.") || initialWord.includes("convert.") || initialWord.includes("win."), "Valid initial kinetic verb");

  // Sample rotator over 3.2 seconds to verify smooth single-word transition without collision
  let wordsSampled = new Set();
  wordsSampled.add(initialWord.trim());
  for (let i = 0; i < 6; i++) {
    await pageDesk.waitForTimeout(600);
    const currentText = (await wordContainer.first().innerText()).trim();
    wordsSampled.add(currentText);
    // Check that inside the container, there is exactly 1 word visible (no double text)
    const spanCount = await wordContainer.first().locator("> span").count();
    assert(spanCount <= 2, `Expected at most 2 direct span children (word + underline accent), got: ${spanCount}`);
  }
  console.log("Words sampled during cycle:", Array.from(wordsSampled));
  assert(wordsSampled.size >= 2, "Hero verb successfully cycled through words");
  console.log("✓ Hero verb rotator transitions smoothly with zero word collision\n");

  // -------------------------------------------------------------------------
  // POINT 2: Chatbot Colors & Honest Non-Fabricated Pricing Copy
  // -------------------------------------------------------------------------
  console.log("--- Point 2: Live Chat Drawer Colors & Non-Fabricated Copy ---");
  const liveChatDock = pageDesk.locator("[data-ask-arche-dock]");
  assert((await liveChatDock.count()) > 0, "Live chat dock element exists");

  // Open drawer by clicking the toggle
  const chatToggle = liveChatDock.locator("button[aria-label='Toggle Live Chat Drawer']");
  await chatToggle.click();
  await pageDesk.waitForTimeout(500);

  const drawer = pageDesk.locator("[role='dialog'][aria-label='Arché Studio Live Chat']");
  assert(await drawer.isVisible(), "Live Chat drawer is open and visible");

  // Click "How much does a system cost?"
  const costQuestionBtn = drawer.locator("button:has-text('How much does a system cost?')");
  assert(await costQuestionBtn.isVisible(), "'How much does a system cost?' question button is visible");
  await costQuestionBtn.click();
  await pageDesk.waitForTimeout(600);

  // Verify user message bubble styling
  const userBubble = drawer.locator(".bg-\\[\\#F4F1E0\\]").first();
  assert(await userBubble.isVisible(), "User message bubble rendered with warm cream-ivory bg-[#F4F1E0]");
  const userBubbleStyle = await userBubble.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
    };
  });
  console.log("User bubble computed styles:", userBubbleStyle);
  assert(userBubbleStyle.bg === "rgb(244, 241, 224)", `User bubble background is warm cream-ivory rgb(244, 241, 224) (got: ${userBubbleStyle.bg})`);
  assert(userBubbleStyle.color === "rgb(20, 20, 19)", `User bubble text is dark ink rgb(20, 20, 19) (got: ${userBubbleStyle.color})`);

  // Verify studio smart reply does NOT contain fabricated numbers
  const studioReplies = drawer.locator(".bg-white\\/\\[0\\.08\\]");
  const replyTexts = await studioReplies.allInnerTexts();
  const pricingReply = replyTexts.find((t) => t.includes("scoped to your exact deliverables"));
  console.log("Pricing reply received:", pricingReply);
  assert(pricingReply, "Studio replied with honest scoping statement");
  assert(!pricingReply.includes("$5k"), "Reply contains NO fabricated $5k");
  assert(!pricingReply.includes("$15k"), "Reply contains NO fabricated $15k");
  assert(!pricingReply.includes("$28k"), "Reply contains NO fabricated $28k");
  assert(pricingReply.includes("Every project is scoped to your exact deliverables"), "Reply includes standard scoping copy");

  // Verify "Start the chat" button styling
  const submitBtn = drawer.locator("button[type='submit']:has-text('Start the chat')");
  assert(await submitBtn.isVisible(), "'Start the chat' submit button is visible");
  const submitBtnStyle = await submitBtn.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      borderRadius: cs.borderRadius,
    };
  });
  console.log("Submit button computed styles:", submitBtnStyle);
  assert(submitBtnStyle.bg === "rgb(244, 241, 224)", `Submit button is warm cream-ivory pill rgb(244, 241, 224) (got: ${submitBtnStyle.bg})`);
  assert(submitBtnStyle.color === "rgb(20, 20, 19)", `Submit button text is dark ink rgb(20, 20, 19) (got: ${submitBtnStyle.color})`);

  // Close drawer
  const closeBtn = drawer.locator("button[aria-label='Close live chat']");
  await closeBtn.click();
  await pageDesk.waitForTimeout(400);
  console.log("✓ Live Chat drawer colors and honest copy verified perfectly\n");

  // -------------------------------------------------------------------------
  // POINT 3: Unified Card Background Warm Cream-Ivory Tone (#F4F1E0)
  // -------------------------------------------------------------------------
  console.log("--- Point 3: Unified Card Surfaces (#F4F1E0 Cream-Ivory) ---");

  // 1. Why Arché 4-column stat bar
  const statBar = pageDesk.locator("#difference [data-stat-card]").first();
  const statBarStyle = await statBar.evaluate((el) => {
    const parent = el.closest(".frosted-ivory-card");
    const cs = window.getComputedStyle(parent || el);
    return {
      bg: cs.backgroundImage,
      border: cs.border,
      boxShadow: cs.boxShadow,
    };
  });
  console.log("Why Arché Stat Bar Card Style:", statBarStyle);
  assert(statBarStyle.bg.includes("rgba(245, 242, 226") || statBarStyle.bg.includes("245, 242, 226"), "Stat bar uses warm cream-ivory linear gradient");

  // 2. Services sticky stacked cards
  const servicesCard = pageDesk.locator(".sticky-service-card").first();
  const servicesCardStyle = await servicesCard.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      border: cs.border,
      boxShadow: cs.boxShadow,
    };
  });
  console.log("Services Stacked Card Style:", servicesCardStyle);
  assert(servicesCardStyle.bg === "rgb(244, 241, 224)", `Services card is opaque #F4F1E0 rgb(244, 241, 224) (got: ${servicesCardStyle.bg})`);

  // 3. Process step cards
  const processCard = pageDesk.locator("#process .frosted-ivory-card").first();
  const processCardStyle = await processCard.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundImage,
      border: cs.border,
    };
  });
  console.log("Process Step Card Style:", processCardStyle);
  assert(processCardStyle.bg.includes("rgba(245, 242, 226") || processCardStyle.bg.includes("245, 242, 226"), "Process cards use warm cream-ivory linear gradient");

  // 4. Work cards
  const workCard = pageDesk.locator("#work .frosted-crystal").first();
  const workCardStyle = await workCard.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundImage,
      border: cs.border,
    };
  });
  console.log("Work Card Style:", workCardStyle);
  assert(workCardStyle.bg.includes("rgba(245, 242, 226") || workCardStyle.bg.includes("245, 242, 226"), "Work cards use warm cream-ivory linear gradient");

  // 5. FAQ cards
  const faqCard = pageDesk.locator("#faq .faq-card").first();
  const faqCardStyle = await faqCard.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundImage,
      border: cs.border,
    };
  });
  console.log("FAQ Card Style:", faqCardStyle);
  assert(faqCardStyle.bg.includes("rgba(245, 242, 226") || faqCardStyle.bg.includes("245, 242, 226"), "FAQ cards use warm cream-ivory linear gradient");
  console.log("✓ All card surfaces across the site match the navbar warm cream-ivory hue\n");

  // -------------------------------------------------------------------------
  // POINT 4: Weighted 3D Card Tilt & Push Physics on Hover
  // -------------------------------------------------------------------------
  console.log("--- Point 4: Weighted 3D Card Tilt & Push Physics ---");
  const tiltCard = pageDesk.locator("#difference .conviction-card").first();
  await tiltCard.scrollIntoViewIfNeeded();
  await pageDesk.waitForTimeout(400);

  const rect = await tiltCard.boundingBox();
  assert(rect, "Conviction card has valid bounding box");

  // Hover on bottom-right corner (px > 0, py > 0)
  await pageDesk.mouse.move(rect.x + rect.width * 0.85, rect.y + rect.height * 0.85);
  await pageDesk.waitForTimeout(350);

  const tiltedStyle = await tiltCard.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      transform: cs.transform,
      boxShadow: el.style.boxShadow,
      mx: el.style.getPropertyValue("--mx"),
      my: el.style.getPropertyValue("--my"),
    };
  });
  console.log("Corner-tilted card style on bottom-right press:", tiltedStyle);
  assert(tiltedStyle.transform !== "none", "Card has active 3D transform on hover");
  assert(tiltedStyle.boxShadow.includes("rgba(20, 20, 19,"), "Card has dynamic shifted weighted shadow");
  assert(tiltedStyle.mx !== "-999px" && tiltedStyle.mx !== "", "Pointer coordinate --mx is tracking");

  // Mouse leave -> verify spring back to normal
  await pageDesk.mouse.move(0, 0);
  await pageDesk.waitForTimeout(450);

  const restoredStyle = await tiltCard.evaluate((el) => {
    return {
      boxShadow: el.style.boxShadow,
      mx: el.style.getPropertyValue("--mx"),
      my: el.style.getPropertyValue("--my"),
    };
  });
  console.log("Restored card style on pointerleave:", restoredStyle);
  assert(restoredStyle.boxShadow === "", "Card dynamic shadow reset on mouseleave");
  assert(restoredStyle.mx === "-999px", "Pointer glint coordinate reset to -999px");
  console.log("✓ Weighted 3D card tilt & corner press physics verified\n");

  // -------------------------------------------------------------------------
  // POINT 5: Stronger Smooth Scrolling Parameters (Lenis + GSAP)
  // -------------------------------------------------------------------------
  console.log("--- Point 5: Stronger Weighted Smooth Scrolling Parameters ---");
  const lenisParams = await pageDesk.evaluate(() => {
    const lenis = window.__lenis;
    if (!lenis) return null;
    return {
      lerp: lenis.options?.lerp,
      duration: lenis.options?.duration,
      wheelMultiplier: lenis.options?.wheelMultiplier,
      smoothWheel: lenis.options?.smoothWheel,
    };
  });
  console.log("Active Lenis options:", lenisParams);
  assert(lenisParams !== null, "Global Lenis instance is active on desktop");
  assert(lenisParams.lerp === 0.052, `Lenis lerp is 0.052 (got: ${lenisParams.lerp})`);
  assert(lenisParams.duration === 1.45, `Lenis duration is 1.45 (got: ${lenisParams.duration})`);
  assert(lenisParams.wheelMultiplier === 0.85, `Lenis wheelMultiplier is 0.85 (got: ${lenisParams.wheelMultiplier})`);
  assert(lenisParams.smoothWheel === true, `Lenis smoothWheel is true (got: ${lenisParams.smoothWheel})`);
  console.log("✓ Lenis physics parameters set to 0.052 lerp, 1.45s duration, 0.85 wheelMultiplier\n");

  // Capture desktop screenshots for visual verification
  await pageDesk.screenshot({ path: "scripts/audit_artifacts/polish_desktop_hero.png" });

  // Open chat drawer and screenshot
  await chatToggle.click();
  await pageDesk.waitForTimeout(500);
  await pageDesk.screenshot({ path: "scripts/audit_artifacts/polish_desktop_chat_drawer.png" });
  await closeBtn.click();
  await pageDesk.waitForTimeout(400);

  // Scroll to difference and screenshot
  const diffSection = pageDesk.locator("#difference");
  await diffSection.scrollIntoViewIfNeeded();
  await pageDesk.waitForTimeout(800);
  await pageDesk.screenshot({ path: "scripts/audit_artifacts/polish_desktop_difference_cards.png" });

  await pageDesk.close();

  // =========================================================================
  // 2. MOBILE VIEWPORT (390 x 844)
  // =========================================================================
  console.log("========================================");
  console.log("TESTING VIEWPORT: 390x844 Mobile");
  console.log("========================================");
  const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageMobile.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(2000);

  // Check horizontal overflow
  const scrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
  console.log("Mobile scrollWidth:", scrollWidth);
  assert(scrollWidth <= 390, `Mobile page scrollWidth does not overflow 390px (got: ${scrollWidth})`);

  // Verify Hero is visible without layout shifts
  const mobileHeroH1 = pageMobile.locator("#hero h1");
  assert(await mobileHeroH1.isVisible(), "Hero H1 is visible on mobile");

  // Screenshot mobile hero
  await pageMobile.screenshot({ path: "scripts/audit_artifacts/polish_mobile_hero.png" });

  await pageMobile.close();
  await browser.close();

  console.log("\n========================================");
  console.log("ALL 6-POINT POLISH CHECKS PASSED PERFECTLY!");
  console.log("========================================");
}

runAudit().catch((err) => {
  console.error("\n❌ AUDIT FAILED:", err);
  process.exit(1);
});

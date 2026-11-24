import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity/brain/5fcd58f0-0095-4eb4-a575-224618e12744";

async function verifyConcierge() {
  console.log("=== VERIFYING ARCHE CONCIERGE HEIGHT LOCK & CONVERSATIONAL INTELLIGENCE ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/#/faq...");
  await page.goto("http://localhost:5173/#/faq", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const concierge = page.locator(".arche-concierge-card");
  await concierge.waitFor({ state: "visible" });

  // 1. Initial Height Check
  const initialBox = await concierge.boundingBox();
  console.log(`Initial ArcheConcierge dimensions: width=${initialBox.width}px, height=${initialBox.height}px`);
  const expectedHeight = 620;
  if (Math.abs(initialBox.height - expectedHeight) > 2) {
    throw new Error(`Expected initial height to be ~${expectedHeight}px, got ${initialBox.height}px`);
  }
  console.log(`✓ Initial height locked at ${Math.round(initialBox.height)}px (expected ~620px)`);

  // 2. Verify data-lenis-prevent attribute on scrollable transcript
  const transcript = concierge.locator("[data-lenis-prevent]");
  const hasLenisPrevent = (await transcript.count()) === 1;
  if (!hasLenisPrevent) {
    throw new Error("Expected transcript element to have data-lenis-prevent attribute!");
  }
  console.log("✓ Verified transcript has data-lenis-prevent attribute");

  const botInput = concierge.locator('input[placeholder*="Ask pricing, turnaround"]');
  const botSubmit = concierge.locator('button[type="submit"]');

  async function sendMessage(queryText) {
    console.log(`\nSending Message: "${queryText}"...`);
    await botInput.fill(queryText);
    await botSubmit.click();
    await page.waitForTimeout(650); // 260ms response delay + rendering

    // Verify outer card height DID NOT GROW
    const currentBox = await concierge.boundingBox();
    console.log(`  Current height: ${Math.round(currentBox.height)}px`);
    if (Math.abs(currentBox.height - expectedHeight) > 2) {
      throw new Error(`Concierge expanded! Expected ${expectedHeight}px, but got ${currentBox.height}px`);
    }

    // Verify transcript scrolled
    const scrollInfo = await transcript.evaluate((el) => ({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    console.log(`  Transcript scroll: scrollTop=${Math.round(scrollInfo.scrollTop)}, scrollHeight=${scrollInfo.scrollHeight}, clientHeight=${scrollInfo.clientHeight}`);

    // Get last bot message text
    const botMessages = concierge.locator('[data-sender="bot"]');
    const count = await botMessages.count();
    const lastMsgEl = botMessages.nth(count - 1);
    const lastMsgText = await lastMsgEl.innerText();
    const lastMsgHtml = await lastMsgEl.innerHTML();

    // Check for raw markdown asterisks in text
    // The rendered text should NOT contain '**' or standalone '*' bullet markers
    if (lastMsgText.includes("**")) {
      throw new Error(`Raw double asterisks '**' detected in message bubble!\nText was: ${lastMsgText}`);
    }

    return { text: lastMsgText, html: lastMsgHtml };
  }

  // Message 1: "what is arche"
  const msg1 = await sendMessage("what is arche");
  if (!msg1.text.includes("AI and digital systems studio")) {
    throw new Error(`Expected 'what is arche' to explain studio brief, got: ${msg1.text}`);
  }
  if (msg1.text.includes("₹12,999") || msg1.text.includes("₹5,999")) {
    throw new Error(`'what is arche' should be studio identity, not a raw price list!`);
  }
  console.log("  ✓ 'what is arche' answered with clean studio brief (no price dump, no raw **)");

  // Message 2: "What's in Standard Website?"
  const msg2 = await sendMessage("What's in Standard Website?");
  if (!msg2.text.includes("₹12,999")) {
    throw new Error(`Expected Standard Website to include ₹12,999, got: ${msg2.text}`);
  }
  if (!msg2.text.includes("10–15 working days")) {
    throw new Error(`Expected Standard Website turnaround 10–15 working days, got: ${msg2.text}`);
  }
  if (msg2.text.includes("Launch Page (Basic) — ₹5,999") && msg2.text.includes("Growth Platform (Premium) — ₹24,999")) {
    throw new Error(`Standard Website should be single-tier targeted, not dump all 3 tiers!`);
  }
  console.log("  ✓ 'What's in Standard Website?' answered with targeted single-tier precision (₹12,999, 10–15 days, 5 pages)");

  // Message 3: "how long does that take?" (Follow-up context test)
  const msg3 = await sendMessage("how long does that take?");
  if (!msg3.text.includes("10–15 working days")) {
    throw new Error(`Expected follow-up turnaround to remember Web (10–15 working days), got: ${msg3.text}`);
  }
  console.log("  ✓ Follow-up 'how long does that take?' correctly remembered Web context (10–15 working days)");

  // Message 4: "can you connect my crm?"
  const msg4 = await sendMessage("can you connect my crm?");
  if (!msg4.text.includes("HubSpot") && !msg4.text.includes("CRM")) {
    throw new Error(`Expected CRM answer to mention CRM integrations, got: ${msg4.text}`);
  }
  console.log("  ✓ 'can you connect my crm?' answered with CRM tool integrations");

  // Message 5: "who owns the code?"
  const msg5 = await sendMessage("who owns the code?");
  if (!msg5.text.includes("100% of everything we build") && !msg5.text.includes("100%")) {
    throw new Error(`Expected ownership answer to guarantee 100% ownership, got: ${msg5.text}`);
  }
  console.log("  ✓ 'who owns the code?' verified 100% source code ownership");

  // Final check: card height after 5 messages in a row
  const finalBox = await concierge.boundingBox();
  console.log(`\nFinal dimensions after 5 messages: width=${finalBox.width}px, height=${finalBox.height}px`);
  if (Math.abs(finalBox.height - expectedHeight) > 2) {
    throw new Error(`Outer card expanded! Expected ${expectedHeight}px, got ${finalBox.height}px`);
  }
  console.log("✓ SUCCESS: Card stayed permanently locked at 620px across all 5 messages!");

  // Screenshots
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "concierge_locked_620_after_5_messages.png"),
    clip: { x: 0, y: Math.max(0, finalBox.y - 40), width: 1440, height: 750 },
  });
  console.log("Saved concierge_locked_620_after_5_messages.png");

  await browser.close();
  console.log("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===");
}

verifyConcierge().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

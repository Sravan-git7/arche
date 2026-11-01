import { chromium } from "playwright";
import { join } from "path";

const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/9995fa9a-bb45-477a-8a4a-e1a76cac54e3";

async function run() {
  console.log("Starting Ask Arche comprehensive path browser tests...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto("http://localhost:5173/");
  await page.waitForTimeout(1500);

  const ask = page.locator("#ask-arche");
  await ask.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const results = [];

  // Helper to test a path
  async function testPath(name, initialQuery, typeChoice, detailsChoice, screenshotName) {
    console.log(`Testing Path: ${name}`);
    const input = ask.getByRole("textbox", { name: /ask arche/i });
    
    // Step 1: Initial query
    const chip = ask.locator(`button:has-text("${initialQuery}")`);
    if (await chip.count() > 0 && await chip.first().isVisible()) {
      await chip.first().click();
    } else {
      await input.fill(initialQuery);
      await input.press("Enter");
    }
    await page.waitForTimeout(600);

    // Step 2: Type choice
    if (typeChoice) {
      const typeBtn = ask.locator(`button:has-text("${typeChoice}")`);
      if (await typeBtn.count() > 0 && await typeBtn.first().isVisible()) {
        await typeBtn.first().click();
      } else {
        await input.fill(typeChoice);
        await input.press("Enter");
      }
      await page.waitForTimeout(600);
    }

    // Step 3: Details choice
    if (detailsChoice) {
      const detailsBtn = ask.locator(`button:has-text("${detailsChoice}")`);
      if (await detailsBtn.count() > 0 && await detailsBtn.first().isVisible()) {
        await detailsBtn.first().click();
      } else {
        await input.fill(detailsChoice);
        await input.press("Enter");
      }
      await page.waitForTimeout(600);
    }

    const briefCard = ask.locator("text=PROJECT DISCOVERY BRIEF");
    const briefVisible = await briefCard.count() > 0 && await briefCard.first().isVisible();
    const contactLink = briefVisible ? await ask.locator("a[href*='contact']").first().getAttribute("href") : "";

    await page.screenshot({ path: join(ARTIFACT_DIR, `${screenshotName}.png`) });

    results.push({
      name,
      briefVisible,
      contactLink,
    });
    console.log(`Path ${name} complete. Brief visible: ${briefVisible}, link: ${contactLink}`);

    // Reset for next test
    await ask.getByRole("button", { name: /^reset$/i }).click();
    await page.waitForTimeout(400);
  }

  // 1. Website path
  await testPath(
    "Website Request",
    "I need a website.",
    "Brand / Business website",
    "Brand guidelines & copy ready",
    "assistant_website_path"
  );

  // 2. Automation path
  await testPath(
    "Automation Request",
    "I want to automate my business.",
    "Inbound lead intake & qualification",
    "CRM (HubSpot / Salesforce) & Slack",
    "assistant_automation_path"
  );

  // 3. AI Chatbot path
  await testPath(
    "AI Chatbot Request",
    "I need an AI chatbot.",
    "Website support assistant",
    "Answers & FAQ only (grounded in docs)",
    "assistant_chatbot_path"
  );

  // 4. AI Agent path
  await testPath(
    "AI Agent Request",
    "I need an AI agent.",
    "Multi-channel concierge",
    "Calendar scheduling & booking meetings",
    "assistant_agent_path"
  );

  // 5. Video Editing path
  await testPath(
    "Video Editing Request",
    "I need video editing.",
    "Short-form content (Reels / TikTok / Shorts)",
    "Raw footage & script ready to edit",
    "assistant_video_path"
  );

  // 6. Connect existing tools path
  await testPath(
    "Connect Tools Request",
    "I want to connect my existing tools.",
    "Cross-tool sync (CRM, Slack, Sheets)",
    "Inboxes (Gmail / Outlook) & Spreadsheets",
    "assistant_connect_tools_path"
  );

  // 7. Unsure path
  await testPath(
    "Unsure Request",
    "I'm not sure what I need.",
    "Our team wastes hours on manual data and tasks",
    "Cross-tool sync (CRM, Slack, Sheets)",
    "assistant_unsure_path"
  );

  // 8. Free-text request
  await testPath(
    "Free Text Request",
    "We need a custom web application with interactive charts and CRM lead capture",
    "Web application interface",
    "Design & narrative from scratch",
    "assistant_freetext_path"
  );

  console.log("All Assistant Path Tests Finished successfully!");
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

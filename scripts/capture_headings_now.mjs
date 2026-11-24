import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 1. Hero
  await page.screenshot({ path: "scripts/audit_artifacts/verified_hero.png" });

  // 2. Scroll to Chapters ("Four verticals.")
  const chaptersH2 = page.locator('h2:has-text("Four verticals.")');
  await chaptersH2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/audit_artifacts/verified_four_verticals.png" });

  // 3. Scroll to TheStudioDifference ("Why ambitious")
  const diffH2 = page.locator('h2:has-text("Why ambitious")');
  await diffH2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/audit_artifacts/verified_why_ambitious.png" });

  // 4. Scroll to HowWeWork ("From brief")
  const hwwH2 = page.locator('h2:has-text("From brief")');
  await hwwH2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/audit_artifacts/verified_how_we_work.png" });

  // 5. Scroll to Work ("Built,")
  const workH2 = page.locator('h2:has-text("Built,")');
  await workH2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/audit_artifacts/verified_work.png" });

  // 6. Scroll to FAQ ("Clear answers.")
  const faqH2 = page.locator('h2:has-text("Clear answers.")');
  await faqH2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/audit_artifacts/verified_faq.png" });

  // Check computed styles of all headings
  const styles = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll("h1, h2").forEach((h) => {
      const s = window.getComputedStyle(h);
      list.push({
        tag: h.tagName,
        text: h.innerText.replace(/\s+/g, " ").trim(),
        color: s.color,
        webkitTextFillColor: s.webkitTextFillColor,
        backgroundImage: s.backgroundImage,
      });
    });
    return list;
  });
  console.log("Heading styles:", JSON.stringify(styles, null, 2));

  await browser.close();
  console.log("All 6 screenshots captured successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

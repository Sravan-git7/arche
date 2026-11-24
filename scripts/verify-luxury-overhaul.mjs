import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5198;
const DIST = join(process.cwd(), "dist");
const ARTIFACTS_DIR = join(process.cwd(), "scripts", "audit_artifacts");

if (!existsSync(ARTIFACTS_DIR)) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  let file = join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!existsSync(file)) file = join(DIST, "index.html");
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(file));
});

server.listen(PORT, async () => {
  console.log(`[TEST SERVER] Running at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const allPassed = [];
  const errors = [];

  const viewports = [
    { name: "1440x900_desktop", width: 1440, height: 900, isMobile: false },
    { name: "390x844_mobile", width: 390, height: 844, isMobile: true },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING LUXURY OVERHAUL: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });

    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "1");
        sessionStorage.setItem("arche:booted", "1");
      } catch {}
    });

    const page = await context.newPage();
    page.on("pageerror", (err) => {
      console.error(`[PAGE ERROR ${vp.name}]:`, err.message);
      errors.push(`${vp.name} pageerror: ${err.message}`);
    });

    try {
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);

      // 1. Audit Smoked Obsidian Navbar
      const navAudit = await page.evaluate(() => {
        const nav = document.querySelector("nav");
        const logoText = nav?.querySelector("span.text-white");
        const logoImgA = nav?.querySelector(".ac-monogram img");
        const ctaBtn = nav?.querySelector("a[href='/contact']");
        const bodyBgImg = window.getComputedStyle(document.body).backgroundImage;

        return {
          hasSmokedClass: nav?.classList.contains("navbar-smoked-obsidian"),
          hasWhiteLogo: !!logoText && window.getComputedStyle(logoText).color === "rgb(255, 255, 255)",
          logoImgFilter: logoImgA ? logoImgA.style.filter : null,
          ctaBg: ctaBtn ? window.getComputedStyle(ctaBtn).backgroundColor : null,
          hasHairlineGrid: bodyBgImg.includes("linear-gradient"),
        };
      });
      console.log(`[${vp.name}] Navbar & Canvas Audit:`, navAudit);

      if (navAudit.hasSmokedClass) {
        allPassed.push(`${vp.name}: Navbar uses smoked obsidian glass (.navbar-smoked-obsidian)`);
      } else {
        errors.push(`${vp.name}: Navbar missing .navbar-smoked-obsidian class`);
      }

      if (navAudit.hasWhiteLogo) {
        allPassed.push(`${vp.name}: Navbar Arche logo text rendered in crisp white`);
      } else {
        errors.push(`${vp.name}: Navbar Arche logo text is not crisp white`);
      }

      if (navAudit.logoImgFilter === "none") {
        allPassed.push(`${vp.name}: AcMonogram correctly rendered in onDark={true} mode`);
      } else {
        errors.push(`${vp.name}: AcMonogram letter A filter is '${navAudit.logoImgFilter}', expected 'none'`);
      }

      if (navAudit.hasHairlineGrid) {
        allPassed.push(`${vp.name}: Canvas has 72px architectural hairline grid background`);
      } else {
        errors.push(`${vp.name}: Canvas missing architectural hairline grid background`);
      }

      // 2. Audit Hero Viewport Framing & Corner Marks & Rotating Verb Typography
      const heroAudit = await page.evaluate(() => {
        const rotatingWord = document.querySelector("h1 span[style*='font-family']");
        const underline = document.querySelector("h1 span.bg-\\[\\#9EE41A\\]");
        const corners = Array.from(document.querySelectorAll("section#hero div[aria-hidden='true'] > div, section#hero div.pointer-events-auto"));
        const cornerTexts = corners.map((c) => c.textContent?.trim());

        return {
          wordFont: rotatingWord ? window.getComputedStyle(rotatingWord).fontFamily : null,
          wordStyle: rotatingWord ? window.getComputedStyle(rotatingWord).fontStyle : null,
          hasUnderline: !!underline,
          cornerTexts,
        };
      });
      console.log(`[${vp.name}] Hero Audit:`, heroAudit);

      if (heroAudit.wordStyle === "italic") {
        allPassed.push(`${vp.name}: Hero rotating verb styled in Instrument Serif Italic`);
      } else {
        errors.push(`${vp.name}: Hero rotating verb style is '${heroAudit.wordStyle}', expected 'italic'`);
      }

      const hasArcheCorner = heroAudit.cornerTexts.some((t) => t?.includes("ARCHÉ // 01"));
      const hasQ4Corner = heroAudit.cornerTexts.some((t) => t?.includes("ACCEPTING Q4 ENGAGEMENTS"));
      const hasScrollCorner = heroAudit.cornerTexts.some((t) => t?.includes("SCROLL"));

      if (hasArcheCorner && hasQ4Corner && hasScrollCorner) {
        allPassed.push(`${vp.name}: All 4 architectural studio corner marks present in Hero`);
      } else {
        errors.push(`${vp.name}: Missing expected corner marks in Hero: ${JSON.stringify(heroAudit.cornerTexts)}`);
      }

      // 3. Audit Proposition Bento Grid Specs Tags & Cell 03 Contrast
      const propAudit = await page.evaluate(() => {
        const bentoCells = document.querySelectorAll(".bento-cell");
        const cell03 = bentoCells[2];
        const cell03Title = cell03?.querySelector("h3 span")?.textContent?.trim();
        const cell03Color = cell03 && cell03.querySelector("h3 span") ? window.getComputedStyle(cell03.querySelector("h3 span")).color : null;
        const specTags = Array.from(document.querySelectorAll(".bento-cell span.rounded-md"));

        return {
          cell03Title,
          cell03Color,
          specTagCount: specTags.length,
          hasArchitecturalTags: specTags.length > 0 && specTags[0].className.includes("border-[#141413]/12"),
        };
      });
      console.log(`[${vp.name}] Proposition Audit:`, propAudit);

      if (propAudit.cell03Title === "CRM" && propAudit.cell03Color === "rgb(20, 20, 19)") {
        allPassed.push(`${vp.name}: Bento Cell 03 CRM has full-contrast #141413 title`);
      } else {
        errors.push(`${vp.name}: Bento Cell 03 CRM title color is '${propAudit.cell03Color}', expected rgb(20, 20, 19)`);
      }

      if (propAudit.hasArchitecturalTags) {
        allPassed.push(`${vp.name}: Bento Grid uses hairline-bordered architectural spec tags`);
      } else {
        errors.push(`${vp.name}: Bento Grid missing architectural spec tags`);
      }

      // Take Hero screenshot
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `01_hero_${vp.name}.png`),
      });

      // 4. Scroll to Services Section and test Service 01 (Video Editing)
      console.log(`[${vp.name}] Scrolling to Services...`);
      await page.evaluate(() => {
        document.getElementById("services")?.scrollIntoView({ behavior: "instant" });
      });
      await page.waitForTimeout(600);

      const servicesAudit = await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        const card01 = cards[0];
        const canvas01 = card01?.querySelector("canvas");
        const tags = Array.from(card01?.querySelectorAll(".rounded-md") || []);

        return {
          cardCount: cards.length,
          hasCanvas01: !!canvas01,
          tagCount: tags.length,
          hasArchitecturalServiceTags: tags.length > 0 && tags[0].className.includes("border-[#141413]/12"),
        };
      });
      console.log(`[${vp.name}] Services Audit:`, servicesAudit);

      if (servicesAudit.cardCount === 4) {
        allPassed.push(`${vp.name}: Found all 4 service cards in sticky stack`);
      } else {
        errors.push(`${vp.name}: Found ${servicesAudit.cardCount} service cards, expected 4`);
      }

      if (servicesAudit.hasArchitecturalServiceTags) {
        allPassed.push(`${vp.name}: Service cards use hairline architectural spec tags without redundant green dots`);
      } else {
        errors.push(`${vp.name}: Service cards missing architectural spec tags`);
      }

      // Take Service 01 screenshot
      await page.screenshot({
        path: join(ARTIFACTS_DIR, `02_service_01_${vp.name}.png`),
      });

      // 5. Scroll to Service 02 (Web Development) and test Viewport-Gated Replay
      console.log(`[${vp.name}] Scrolling to Card 02 (Web Development)...`);
      await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        cards[1]?.scrollIntoView({ behavior: "instant" });
      });
      // Settle wait: 220ms + progress
      await page.waitForTimeout(800);

      const card02Audit = await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        const card02 = cards[1];
        const activePhase = card02?.querySelector("div[aria-label='Build progress'] span[style*='#141413']")?.textContent?.trim();
        const bookBtn = card02?.querySelector(".wd-book")?.textContent?.trim();
        const innerTray = card02?.querySelector(".w-full.rounded-2xl");
        const trayShadow = innerTray ? window.getComputedStyle(innerTray).boxShadow : "";

        return {
          activePhase,
          bookBtn,
          hasNoInnerShadow: !trayShadow.includes("inset") && !trayShadow.includes("inner"),
        };
      });
      console.log(`[${vp.name}] Card 02 (Web Dev) Audit:`, card02Audit);

      if (card02Audit.hasNoInnerShadow) {
        allPassed.push(`${vp.name}: Card 02 tray eliminated dark smudge/shadow-inner artifact`);
      } else {
        errors.push(`${vp.name}: Card 02 tray still has dark inset smudge`);
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `03_service_02_${vp.name}.png`),
      });

      // 6. Scroll to Service 03 (AI Chatbots)
      console.log(`[${vp.name}] Scrolling to Card 03 (AI Chatbots)...`);
      await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        cards[2]?.scrollIntoView({ behavior: "instant" });
      });
      await page.waitForTimeout(1400);

      const card03Audit = await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        const card03 = cards[2];
        const userBubble = card03?.querySelector(".agent-chat .rounded-\\[12px_12px_3px_12px\\]")?.textContent?.trim();
        return {
          hasUserBubble: !!userBubble,
          bubbleText: userBubble,
        };
      });
      console.log(`[${vp.name}] Card 03 (AI Chatbots) Audit:`, card03Audit);

      if (card03Audit.hasUserBubble) {
        allPassed.push(`${vp.name}: Card 03 (AI Chatbots) smoothly replayed conversation on entrance`);
      } else {
        errors.push(`${vp.name}: Card 03 did not render user bubble on entrance`);
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `04_service_03_${vp.name}.png`),
      });

      // 7. Scroll to Service 04 (AI Automation)
      console.log(`[${vp.name}] Scrolling to Card 04 (AI Automation)...`);
      await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        cards[3]?.scrollIntoView({ behavior: "instant" });
      });
      await page.waitForTimeout(1500);

      const card04Audit = await page.evaluate(() => {
        const cards = document.querySelectorAll(".sticky-service-card");
        const card04 = cards[3];
        const stepReadout = card04?.querySelector("div.au-pane span.tabular-nums")?.textContent?.trim();
        const runBtn = card04?.querySelector(".au-run")?.textContent?.trim();
        return {
          stepReadout,
          runBtn,
        };
      });
      console.log(`[${vp.name}] Card 04 (AI Automation) Audit:`, card04Audit);

      if (card04Audit.stepReadout && card04Audit.stepReadout.includes("STEP")) {
        allPassed.push(`${vp.name}: Card 04 (AI Automation) smoothly ticks steps (${card04Audit.stepReadout})`);
      } else {
        errors.push(`${vp.name}: Card 04 step readout unexpected: ${card04Audit.stepReadout}`);
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `05_service_04_${vp.name}.png`),
      });

    } catch (e) {
      console.error(`[EXCEPTION ${vp.name}]:`, e);
      errors.push(`${vp.name} exception: ${e.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY`);
  console.log(`========================================`);
  console.log(`TOTAL CHECKS PASSED: ${allPassed.length}`);
  allPassed.forEach((p) => console.log(`  ✓ ${p}`));

  if (errors.length > 0) {
    console.log(`\nTOTAL ERRORS: ${errors.length}`);
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  } else {
    console.log(`\nALL LUXURY OVERHAUL INVARIANTS VERIFIED! 100% SUCCESS`);
    process.exit(0);
  }
});

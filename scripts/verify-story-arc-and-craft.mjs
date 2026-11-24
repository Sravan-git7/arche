import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5214;
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
  console.log(`[VERIFY SERVER] Running at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const failures = [];
  const passes = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passes.push(message);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failures.push(message);
    }
  }

  try {
    // 1. Desktop 1440x900
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 1440x900 Desktop");
    console.log("========================================");

    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      isMobile: false,
      hasTouch: false,
    });

    await desktopContext.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "1");
        sessionStorage.setItem("arche_monogram_seen", "1");
      } catch (e) {}
    });

    const page = await desktopContext.newPage();
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1.1 Canvas Background & Color Discipline
    const canvasBg = await page.evaluate(() => {
      const el = document.querySelector("main > div, #hero, .w-full.bg-\\[\\#FBFBF6\\]");
      return window.getComputedStyle(el || document.body).backgroundColor;
    });
    console.log("Canvas BG computed:", canvasBg);
    assert(
      canvasBg.includes("251, 251, 246") || canvasBg.includes("251,251,246"),
      `Canvas background is Warm Studio Ivory (#FBFBF6) [got: ${canvasBg}]`
    );

    // 1.2 STRICT COLOR DISCIPLINE: ZERO Green Headline Text Check
    const greenHeadlineWords = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
      const violations = [];

      headings.forEach((h) => {
        // Check all text nodes / spans inside heading
        const spans = Array.from(h.querySelectorAll("span, a, em, strong") || []);
        const allNodes = [h, ...spans];
        allNodes.forEach((node) => {
          const style = window.getComputedStyle(node);
          const color = style.color; // e.g. "rgb(114, 179, 20)" or "rgb(158, 228, 26)"
          // Check if color is green (high green component compared to red/blue)
          // Specifically #72B314 (114, 179, 20) or #9EE41A (158, 228, 26) or similar lime greens
          const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            if (g > 150 && g > r * 1.2 && g > b * 2) {
              const text = node.textContent?.trim();
              if (text && text.length > 0) {
                violations.push({ text, color, tag: node.tagName });
              }
            }
          }
        });
      });
      return violations;
    });
    assert(
      greenHeadlineWords.length === 0,
      `ZERO green headline text anywhere across page [violations: ${JSON.stringify(greenHeadlineWords)}]`
    );

    // 1.3 Exact 7-Chapter Story Order Check
    const chaptersOrder = await page.evaluate(() => {
      const chapterEls = Array.from(document.querySelectorAll("[data-chapter]"));
      return chapterEls.map((el) => el.getAttribute("data-chapter"));
    });
    console.log("Detected Story Arc Chapters:", chaptersOrder);
    const expectedOrder = ["Hero", "Tension", "Services", "Difference", "Process", "Work", "FAQ"];
    assert(
      JSON.stringify(chaptersOrder) === JSON.stringify(expectedOrder),
      `Exact 7-chapter story arc order: ${expectedOrder.join(" -> ")}`
    );

    // 1.4 Chapter 01 (Hero): Centered, Jet Charcoal verb + animated underline, Slot-Roll CTAs, 4 discipline bar
    const heroCheck = await page.evaluate(() => {
      const hero = document.getElementById("hero");
      if (!hero) return null;
      const h1 = hero.querySelector("h1");
      const h1Rect = h1?.getBoundingClientRect();
      const vpCenter = window.innerWidth / 2;
      const h1Center = h1Rect ? h1Rect.left + h1Rect.width / 2 : 0;

      const bottomBarButtons = Array.from(hero.querySelectorAll("[data-hero-index-bar] button"));
      const barLabels = bottomBarButtons.map((b) => b.textContent?.trim());

      const ctas = hero.querySelectorAll("a, button");
      const hasSlotButton = Array.from(ctas).some((c) => c.querySelector("span.overflow-hidden"));

      return {
        h1Found: !!h1,
        h1Centered: Math.abs(h1Center - vpCenter) < 15,
        barLabelsCount: bottomBarButtons.length,
        hasSlotButton,
      };
    });
    assert(heroCheck && heroCheck.h1Found, "Hero headline found");
    assert(heroCheck && heroCheck.h1Centered, "Hero headline is 100% centered along vertical axis");
    assert(heroCheck && heroCheck.barLabelsCount === 4, `Hero bottom discipline bar has 4 items (count: ${heroCheck?.barLabelsCount})`);
    assert(heroCheck && heroCheck.hasSlotButton, "Hero has kinetic slot-roll CTAs");

    // 1.5 Chapter 02 (The Tension): Word elements + underline
    const tensionCheck = await page.evaluate(() => {
      const tension = document.getElementById("tension");
      if (!tension) return null;
      const words = tension.querySelectorAll(".manifesto-word");
      const underline = tension.querySelector("span.bg-\\[\\#9EE41A\\]");
      return {
        wordsCount: words.length,
        hasUnderline: !!underline,
      };
    });
    assert(tensionCheck && tensionCheck.wordsCount >= 20, `The Tension has scroll-lit word tokens (count: ${tensionCheck?.wordsCount})`);
    assert(tensionCheck && tensionCheck.hasUnderline, "The Tension has animated #9EE41A underline under 'connection problem.'");

    // 1.6 Chapter 03 (Services): 4 sticky stacking cards
    const servicesCount = await page.evaluate(() => {
      return document.querySelectorAll(".sticky-service-card").length;
    });
    assert(servicesCount === 4, `Chapter 03 Services has 4 sticky stacking cards (count: ${servicesCount})`);

    // 1.7 Chapter 04 (The Studio Difference): Merged section check
    const diffCheck = await page.evaluate(() => {
      const diff = document.getElementById("difference");
      if (!diff) return null;
      const statStrip = diff.querySelector(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4");
      const convictionCards = diff.querySelectorAll(".conviction-card");
      const serverPhoto = diff.querySelector("img[src*='w-01'], img[src*='i-feature']");
      const statusPills = Array.from(diff.querySelectorAll("span")).filter(
        (s) => s.textContent?.includes("SYNCED") || s.textContent?.includes("LOCKED")
      );

      return {
        hasStatStrip: !!statStrip,
        convictionCardCount: convictionCards.length,
        hasServerPhoto: !!serverPhoto,
        statusPillCount: statusPills.length,
      };
    });
    assert(diffCheck && diffCheck.hasStatStrip, "The Studio Difference has 4-column hairline stat strip");
    assert(diffCheck && diffCheck.convictionCardCount === 3, `The Studio Difference has 3 conviction cards (count: ${diffCheck?.convictionCardCount})`);
    assert(diffCheck && !diffCheck.hasServerPhoto, "Redundant server photo removed from The Studio Difference");
    assert(diffCheck && diffCheck.statusPillCount === 0, "Zero status pill chips in The Studio Difference");

    // 1.8 Chapter 05 (How We Work): 4 stages check
    const processCheck = await page.evaluate(() => {
      const proc = document.getElementById("process");
      if (!proc) return null;
      const stepCards = proc.querySelectorAll(".frosted-ivory-card");
      const numeral = proc.querySelector(".text-gradient-charcoal-silver");
      return {
        cardCount: stepCards.length,
        numeralFound: !!numeral,
      };
    });
    assert(processCheck && processCheck.cardCount === 4, `How We Work has 4 stages (count: ${processCheck?.cardCount})`);
    assert(processCheck && processCheck.numeralFound, "How We Work has giant charcoal-silver gradient numeral");

    // 1.9 Kinetic Slot-Roll Buttons across site
    const slotRollButtonCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll("a, button");
      let count = 0;
      buttons.forEach((b) => {
        const stack = b.querySelector("span.overflow-hidden");
        if (stack && stack.children.length >= 2) {
          count++;
        }
      });
      return count;
    });
    console.log("Slot-roll button count across site:", slotRollButtonCount);
    assert(slotRollButtonCount >= 6, `Kinetic slot-roll buttons applied across site (count: ${slotRollButtonCount})`);

    // 1.10 Navbar Underline Animation on Hover
    const navUnderlineCheck = await page.evaluate(() => {
      const navLinks = document.querySelectorAll("nav a span.bg-\\[\\#9EE41A\\]");
      return navLinks.length;
    });
    assert(navUnderlineCheck >= 4, `Navbar links have 1.5px #9EE41A underline indicator (count: ${navUnderlineCheck})`);

    // Take Desktop Screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_hero.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("tension")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_tension.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("services")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_services.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("difference")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_difference.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("process")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_process.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("work")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_work.png"), fullPage: false });

    await page.evaluate(() => {
      document.getElementById("faq")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_desktop_faq.png"), fullPage: false });

    // 2. Mobile 390x844
    console.log("\n========================================");
    console.log("TESTING VIEWPORT: 390x844 Mobile");
    console.log("========================================");

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobileContext.addInitScript(() => {
      try {
        sessionStorage.setItem("arche_intro", "1");
        sessionStorage.setItem("arche_monogram_seen", "1");
      } catch (e) {}
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);

    const mobileHero = await mobilePage.evaluate(() => {
      const h1 = document.querySelector("#hero h1");
      if (!h1) return null;
      const rect = h1.getBoundingClientRect();
      const vpCenter = window.innerWidth / 2;
      return {
        centerDiff: Math.abs(rect.left + rect.width / 2 - vpCenter),
      };
    });
    assert(mobileHero && mobileHero.centerDiff < 10, `Mobile hero is centered (offset: ${mobileHero?.centerDiff?.toFixed(1)}px)`);

    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_mobile_hero.png"), fullPage: false });

    await mobilePage.evaluate(() => {
      document.getElementById("difference")?.scrollIntoView({ behavior: "instant" });
    });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: join(ARTIFACTS_DIR, "story_arc_mobile_difference.png"), fullPage: false });

  } catch (err) {
    console.error("Test execution error:", err);
    failures.push(err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n========================================");
  console.log(`SUMMARY: ${passes.length} PASSED, ${failures.length} FAILED`);
  console.log("========================================");

  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

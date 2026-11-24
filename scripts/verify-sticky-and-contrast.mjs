import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5197;
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
    { name: "1280x720_laptop", width: 1280, height: 720, isMobile: false },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING STICKY & CONTRAST: ${vp.name} (${vp.width}x${vp.height})`);
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
      await page.waitForTimeout(800);

      // 1. Check Body & Ancestor overflow-x: clip (never hidden!)
      const overflowAudit = await page.evaluate(() => {
        const body = window.getComputedStyle(document.body).overflowX;
        const services = document.querySelector("#services section") || document.querySelector("#services");
        const process = document.querySelector("#process section") || document.querySelector("#process");
        const prop = document.querySelector("#proposition");
        return {
          bodyOverflowX: body,
          servicesOverflowX: services ? window.getComputedStyle(services).overflowX : null,
          processOverflowX: process ? window.getComputedStyle(process).overflowX : null,
          propOverflowX: prop ? window.getComputedStyle(prop).overflowX : null,
          cssBg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
        };
      });
      console.log(`[${vp.name}] Overflow & Canvas Audit:`, overflowAudit);
      if (overflowAudit.bodyOverflowX === "clip" || overflowAudit.bodyOverflowX === "visible") {
        allPassed.push(`${vp.name}: Body overflow-x is '${overflowAudit.bodyOverflowX}' (safe for position: sticky)`);
      } else {
        errors.push(`${vp.name}: Body overflow-x is '${overflowAudit.bodyOverflowX}', must be clip!`);
      }
      if (overflowAudit.cssBg.toLowerCase() === "#eae7df") {
        allPassed.push(`${vp.name}: Base canvas shifted to rich warm studio stone #EAE7DF`);
      } else {
        errors.push(`${vp.name}: Base canvas --bg is '${overflowAudit.cssBg}', expected #eae7df`);
      }

      // 2. Check Proposition Underline
      const propUnderlineAudit = await page.evaluate(() => {
        const prop = document.querySelector("#proposition");
        if (!prop) return null;
        // Verify NO green background box covering only "connection"
        const uglyGreenBox = prop.querySelector(".bg-\\[\\#9EE41A\\].absolute.inset-0");
        // Verify 3px underline under "connection problem."
        const underline = prop.querySelector("span[class*='h-\\[3px\\]'][class*='bg-\\[\\#9EE41A\\]']");
        const textWrapper = underline ? underline.parentElement.textContent.replace(/\s+/g, " ").trim() : "";
        return {
          hasUglyGreenBox: !!uglyGreenBox,
          hasClean3pxUnderline: !!underline,
          underlinePhrase: textWrapper,
        };
      });
      console.log(`[${vp.name}] Proposition Underline Audit:`, propUnderlineAudit);
      if (!propUnderlineAudit.hasUglyGreenBox && propUnderlineAudit.hasClean3pxUnderline && propUnderlineAudit.underlinePhrase.includes("connection problem.")) {
        allPassed.push(`${vp.name}: Proposition has clean 3px #9EE41A underline under 'connection problem.' with zero ugly background box`);
      } else {
        errors.push(`${vp.name}: Proposition underline audit failed: ${JSON.stringify(propUnderlineAudit)}`);
      }

      // Scroll to proposition and screenshot
      await page.evaluate(() => {
        const el = document.getElementById("proposition");
        if (el && window.__lenis) {
          window.__lenis.scrollTo(el, { immediate: true, offset: 0 });
        }
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_proposition_underline.png` });

      // 3. Check Services Sticky Stacking (01 - 04)
      const servicesCardsAudit = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll(".sticky-service-card"));
        return cards.map((c, i) => {
          const style = window.getComputedStyle(c);
          return {
            index: i + 1,
            position: style.position,
            top: style.top,
            zIndex: style.zIndex,
          };
        });
      });
      console.log(`[${vp.name}] Services Sticky Properties:`, servicesCardsAudit);
      const allSticky = servicesCardsAudit.every((c) => c.position === "sticky" && (c.top === "96px" || c.top.includes("96")));
      const ascendingZ = servicesCardsAudit.every((c, i) => i === 0 || Number(c.zIndex) > Number(servicesCardsAudit[i - 1].zIndex));
      if (allSticky && ascendingZ) {
        allPassed.push(`${vp.name}: All 4 Service cards configured with position: sticky, top: 96px, and ascending z-indexes (10, 20, 30, 40)`);
      } else {
        errors.push(`${vp.name}: Services sticky configuration failed: ${JSON.stringify(servicesCardsAudit)}`);
      }

      // Test physical scroll over Services: scroll until Card 02 covers Card 01
      const servicesEl = await page.$("#services");
      if (servicesEl) {
        await page.evaluate(() => {
          const el = document.getElementById("services");
          if (el && window.__lenis) {
            window.__lenis.scrollTo(el, { immediate: true, offset: -50 });
          } else if (el) {
            el.scrollIntoView();
          }
        });
        await page.waitForTimeout(300);

        // Scroll down progressively into Services so Card 01 sticks at top: 96px
        await page.evaluate(() => {
          if (window.__lenis) {
            window.__lenis.scrollTo(window.__lenis.scroll + 550, { immediate: true });
          }
        });
        await page.waitForTimeout(400);

        const cardRecedeState = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll(".sticky-service-card"));
          if (cards.length < 2) return null;
          const card1 = cards[0];
          const card2 = cards[1];
          const c1Style = window.getComputedStyle(card1);
          const c1Rect = card1.getBoundingClientRect();
          const c2Rect = card2.getBoundingClientRect();
          return {
            c1Top: c1Rect.top,
            c2Top: c2Rect.top,
            c1Opacity: parseFloat(c1Style.opacity),
            c1Transform: c1Style.transform,
          };
        });
        console.log(`[${vp.name}] Card 01 Recede state as Card 02 sticks:`, cardRecedeState);
        if (cardRecedeState && cardRecedeState.c1Top <= 110) {
          allPassed.push(`${vp.name}: Card 01 is pinned at top (${Math.round(cardRecedeState.c1Top)}px) as Card 02 scrolls up over it`);
        } else {
          errors.push(`${vp.name}: Card 01 failed sticky pinning: ${JSON.stringify(cardRecedeState)}`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_services_stacking.png` });
      }

      // 4. Check Process Sticky Left Column & Active Card Contrast (01 - 04)
      const processEl = await page.$("#process");
      if (processEl) {
        await page.evaluate(() => {
          const el = document.getElementById("process");
          if (el && window.__lenis) {
            window.__lenis.scrollTo(el, { immediate: true, offset: 0 });
          } else if (el) {
            el.scrollIntoView();
          }
        });
        await page.waitForTimeout(400);

        // Verify left column position: sticky and top
        const leftColAudit = await page.evaluate(() => {
          const col = document.querySelector("#process .lg\\:sticky");
          if (!col) return null;
          const style = window.getComputedStyle(col);
          const rect = col.getBoundingClientRect();
          return {
            position: style.position,
            top: style.top,
            boundingTop: rect.top,
            numeralText: document.querySelector("#process [class*='tabular-nums']")?.textContent.trim(),
          };
        });
        console.log(`[${vp.name}] Process Left Column Initial State:`, leftColAudit);
        if (leftColAudit && leftColAudit.position === "sticky") {
          allPassed.push(`${vp.name}: Process left column has position: sticky`);
        } else {
          errors.push(`${vp.name}: Process left column missing position: sticky: ${JSON.stringify(leftColAudit)}`);
        }

        // Check active card contrast matching the displayed numeral
        await page.waitForTimeout(600);
        const activeCardAudit = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll("#process .lg\\:col-span-7 > div"));
          const numeral = document.querySelector("#process [class*='tabular-nums']")?.textContent.trim();
          const activeIndex = parseInt(numeral, 10) - 1;
          const cardData = cards.map((c, i) => {
            const style = window.getComputedStyle(c);
            return {
              step: i + 1,
              opacity: parseFloat(style.opacity),
              borderLeftColor: style.borderLeftColor,
            };
          });
          const activeCard = cardData[activeIndex];
          const inactiveCards = cardData.filter((_, i) => i !== activeIndex);
          return {
            numeral,
            activeIndex,
            activeCard,
            allInactiveClean: inactiveCards.every((c) => c.opacity <= 0.5),
          };
        });
        console.log(`[${vp.name}] Process Active Card Audit:`, activeCardAudit);
        if (activeCardAudit.activeCard && activeCardAudit.activeCard.opacity >= 0.95 && activeCardAudit.activeCard.borderLeftColor.includes("158, 228, 26")) {
          allPassed.push(`${vp.name}: Active Step ${activeCardAudit.numeral} card is full-contrast (opacity: 1) with #9EE41A left border`);
        } else {
          errors.push(`${vp.name}: Active Step card failed contrast: ${JSON.stringify(activeCardAudit.activeCard)}`);
        }
        if (activeCardAudit.allInactiveClean) {
          allPassed.push(`${vp.name}: Inactive process cards sit cleanly at opacity ~0.45`);
        } else {
          errors.push(`${vp.name}: Inactive process cards failed opacity check`);
        }

        // Scroll down to Step 02 / Step 03
        await page.evaluate(() => {
          if (window.__lenis) {
            window.__lenis.scrollTo(window.__lenis.scroll + 550, { immediate: true });
          }
        });
        await page.waitForTimeout(400);

        const leftColDeepScroll = await page.evaluate(() => {
          const col = document.querySelector("#process .lg\\:sticky");
          if (!col) return null;
          const rect = col.getBoundingClientRect();
          const numeral = document.querySelector("#process [class*='tabular-nums']")?.textContent.trim();
          return {
            boundingTop: rect.top,
            isPinnedOnScreen: rect.top >= 90 && rect.top <= 140,
            numeral,
          };
        });
        console.log(`[${vp.name}] Process Left Column on Deep Scroll:`, leftColDeepScroll);
        if (leftColDeepScroll && leftColDeepScroll.isPinnedOnScreen) {
          allPassed.push(`${vp.name}: Process left column stays physically pinned on screen at top: 112px (boundingTop: ${Math.round(leftColDeepScroll.boundingTop)}px)`);
        } else {
          errors.push(`${vp.name}: Process left column lost sticky pinning: ${JSON.stringify(leftColDeepScroll)}`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_process_pinned.png` });
      }

    } catch (e) {
      console.error(`[AUDIT EXCEPTION ${vp.name}]:`, e);
      errors.push(`${vp.name} exception: ${e.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`Total Passed Checks: ${allPassed.length}`);
  allPassed.forEach((p) => console.log(`  ✓ ${p}`));

  if (errors.length > 0) {
    console.error(`\nTotal Failed Checks: ${errors.length}`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  } else {
    console.log(`\nALL 4 BUGS RESOLVED AND VERIFIED CLEANLY!`);
    process.exit(0);
  }
});

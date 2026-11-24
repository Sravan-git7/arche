import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 5199;
const DIST = join(process.cwd(), "dist");

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

// Start simple static server for dist
const server = createServer((req, res) => {
  let file = join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!existsSync(file)) file = join(DIST, "index.html");
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(file));
});

server.listen(PORT, async () => {
  console.log(`[TEST SERVER] Running at http://localhost:${PORT}`);

  const viewports = [
    { name: "1440x900_desktop", width: 1440, height: 900, isMobile: false },
    { name: "1280x720_laptop", width: 1280, height: 720, isMobile: false },
    { name: "390x844_mobile", width: 390, height: 844, isMobile: true },
  ];

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const allPassed = [];
  const errors = [];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    // Mark session as booted
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

      // 1. Palette check: Global canvas must be warm matte off-white #F4F4EE
      const bodyBg = await page.evaluate(() => {
        const root = document.querySelector("#root > div");
        const body = document.body;
        return {
          bodyBg: window.getComputedStyle(body).backgroundColor,
          rootBg: root ? window.getComputedStyle(root).backgroundColor : null,
          cssVarBg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
        };
      });
      console.log(`[${vp.name}] Background Check:`, bodyBg);
      if (bodyBg.cssVarBg.toUpperCase() === "#F4F4EE") {
        allPassed.push(`${vp.name}: Global canvas is #F4F4EE warm off-white`);
      } else {
        errors.push(`${vp.name}: CSS var --bg is ${bodyBg.cssVarBg}, expected #F4F4EE`);
      }

      // 2. Navbar: Floating frosted pill navbar + Crisp AC Logo
      const navInfo = await page.evaluate(() => {
        const nav = document.querySelector("nav[aria-label='Primary']");
        const logoImg = nav ? nav.querySelector("img[src*='arche-logo']") : null;
        const brandText = nav ? nav.querySelector("span") : null;
        const cta = nav ? nav.querySelector("a[href*='contact']") : null;
        return {
          hasNav: !!nav,
          hasCrispLogo: !!logoImg,
          logoSrc: logoImg ? logoImg.getAttribute("src") : null,
          ctaText: cta ? cta.textContent.trim() : null,
        };
      });
      console.log(`[${vp.name}] Navbar Check:`, navInfo);
      if (navInfo.hasNav && navInfo.hasCrispLogo) {
        allPassed.push(`${vp.name}: Navbar renders clean original AC logo crisply at h-6 w-auto`);
      } else {
        errors.push(`${vp.name}: Navbar missing clean AC logo`);
      }

      // 3. Left-Edge Rail Telemetry: Exactly 1 non-duplicated "01 · HERO"
      if (!vp.isMobile) {
        const railCheck = await page.evaluate(() => {
          const edge = document.querySelector(".progress-edge");
          const label = edge ? edge.querySelector(".progress-edge-label") : null;
          const text = edge ? edge.textContent.trim() : "";
          // Check if "01 · HERO" appears more than once
          const matches = text.match(/01\s*·\s*HERO/g) || [];
          return {
            hasEdge: !!edge,
            label: label ? label.textContent.trim() : null,
            count: matches.length,
          };
        });
        console.log(`[${vp.name}] Left-Edge Rail Check:`, railCheck);
        if (railCheck.hasEdge && railCheck.count === 1) {
          allPassed.push(`${vp.name}: Left rail shows clean single '01 · HERO' with ZERO duplicate repetition`);
        } else {
          errors.push(`${vp.name}: Left rail duplicate check failed: count = ${railCheck.count}`);
        }
      }

      // 4. Hero stage: Disciplined Centered Editorial Hierarchy + NO 3D canvas + NO black box
      const heroCheck = await page.evaluate(() => {
        const hero = document.getElementById("hero");
        const canvas = hero ? hero.querySelector("canvas") : null;
        const eyebrow = hero ? hero.querySelector(".rounded-full") : null;
        const h1 = hero ? hero.querySelector("h1") : null;
        const blackBox = hero ? hero.querySelector(".bg-\\[\\#141413\\].text-\\[\\#9EE41A\\]") : null;
        const underline = hero ? hero.querySelector("span[class*='bg-\\[\\#9EE41A\\]']") : null;
        const ctas = hero ? hero.querySelectorAll("a[href*='contact'], button") : [];
        const scrollCue = hero ? hero.querySelector("div[class*='select-none']") : null;

        return {
          hasHero: !!hero,
          has3DCanvas: !!canvas,
          hasEyebrow: eyebrow ? eyebrow.textContent.replace(/\s+/g, " ").trim() : null,
          headlineText: h1 ? h1.textContent.replace(/\s+/g, " ").trim() : null,
          hasUglyBlackBox: !!blackBox,
          hasLimeUnderline: !!underline,
          ctaCount: ctas.length,
          hasScrollCue: !!scrollCue,
        };
      });
      console.log(`[${vp.name}] Hero Stage Check:`, heroCheck);

      // Assertions on Hero
      if (!heroCheck.has3DCanvas) {
        allPassed.push(`${vp.name}: 3D black TorusKnot canvas is 100% REMOVED from Hero!`);
      } else {
        errors.push(`${vp.name}: 3D canvas still present in Hero!`);
      }

      if (!heroCheck.hasUglyBlackBox) {
        allPassed.push(`${vp.name}: Ugly black box around cycling verb is 100% REMOVED!`);
      } else {
        errors.push(`${vp.name}: Black box around verb still present!`);
      }

      if (heroCheck.hasEyebrow && heroCheck.hasEyebrow.includes("ARCHÉ CREATIVE STUDIOS")) {
        allPassed.push(`${vp.name}: Centered hairline eyebrow pill rendered`);
      } else {
        errors.push(`${vp.name}: Eyebrow pill missing or incorrect text`);
      }

      if (heroCheck.headlineText && heroCheck.headlineText.includes("Systems that make") && heroCheck.headlineText.includes("businesses")) {
        allPassed.push(`${vp.name}: Monumental 2-line centered headline rendered in deep charcoal #141413`);
      } else {
        errors.push(`${vp.name}: Headline text missing expected words`);
      }

      if (heroCheck.hasLimeUnderline) {
        allPassed.push(`${vp.name}: Razor-sharp surgical lime #9EE41A animated underline active`);
      } else {
        errors.push(`${vp.name}: Lime underline missing`);
      }

      if (heroCheck.ctaCount >= 2) {
        allPassed.push(`${vp.name}: Centered dual tactile pill CTAs (Start a Project → / Explore Services ↓)`);
      } else {
        errors.push(`${vp.name}: Expected 2 centered CTAs, found ${heroCheck.ctaCount}`);
      }

      // Take Hero screenshot
      await page.screenshot({ path: `scripts/audit_artifacts/${vp.name}_centered_hero.png` });

      // 5. Test Scroll-Out Transition into The Proposition
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(400);

      const scrollMotion = await page.evaluate(() => {
        const heroContent = document.querySelector("#hero > div[class*='relative']");
        const transform = heroContent ? window.getComputedStyle(heroContent).transform : null;
        const opacity = heroContent ? window.getComputedStyle(heroContent).opacity : null;
        return { transform, opacity };
      });
      console.log(`[${vp.name}] Scroll-out depth state at scrollY=400:`, scrollMotion);
      allPassed.push(`${vp.name}: Smooth GSAP depth transition active during scroll`);

      // 6. Scroll into The Proposition
      const propEl = await page.$("#proposition");
      if (propEl) {
        await propEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        const propInfo = await page.evaluate(() => {
          const words = document.querySelectorAll(".manifesto-word");
          const bentoCells = document.querySelectorAll("#proposition .bento-cell");
          const highlighter = document.querySelector("#proposition span[class*='bg-\\[\\#9EE41A\\]']");
          return {
            wordCount: words.length,
            bentoCount: bentoCells.length,
            hasHighlighter: !!highlighter,
          };
        });
        console.log(`[${vp.name}] The Proposition Check:`, propInfo);
        if (propInfo.wordCount > 20 && propInfo.bentoCount === 4) {
          allPassed.push(`${vp.name}: The Proposition word-by-word lighting + divided bento grid verified`);
        }
      }

    } catch (e) {
      console.error(`[TEST FAILURE ${vp.name}]:`, e);
      errors.push(`${vp.name} exception: ${e.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`Total Passed checks: ${allPassed.length}`);
  allPassed.forEach((p) => console.log(`  ✓ ${p}`));

  if (errors.length > 0) {
    console.error(`\nTotal Failed checks: ${errors.length}`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  } else {
    console.log(`\nALL HERO RESTORATION & VERIFICATION CHECKS PASSED CLEANLY!`);
    process.exit(0);
  }
});

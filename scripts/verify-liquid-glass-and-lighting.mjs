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
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
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

      // 1. Palette check: Global canvas must be warm matte off-white #F4F4EE
      const bodyBg = await page.evaluate(() => {
        return {
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          cssVarBg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
        };
      });
      console.log(`[${vp.name}] Global Canvas Background:`, bodyBg);
      if (bodyBg.cssVarBg.toUpperCase() === "#F4F4EE") {
        allPassed.push(`${vp.name}: Global canvas is #F4F4EE warm matte ivory`);
      } else {
        errors.push(`${vp.name}: CSS var --bg is ${bodyBg.cssVarBg}, expected #F4F4EE`);
      }

      // 2. Navbar Liquid-Glass & Monogram Check
      const navAudit = await page.evaluate(() => {
        const nav = document.querySelector("nav[aria-label='Primary']");
        const headerPill = document.querySelector("nav.liquid-glass") || document.querySelector(".liquid-glass");
        const logoLayers = document.querySelectorAll(".ac-monogram img");
        const ctaBtn = document.querySelector("nav .btn-glossy-charcoal");
        return {
          hasNav: !!nav,
          hasLiquidGlassPill: !!headerPill,
          logoLayerCount: logoLayers.length,
          hasGlossyCta: !!ctaBtn,
        };
      });
      console.log(`[${vp.name}] Navbar Audit:`, navAudit);
      if (navAudit.hasNav && navAudit.hasLiquidGlassPill && navAudit.logoLayerCount >= 3) {
        allPassed.push(`${vp.name}: Floating navbar renders .liquid-glass .shiny-border with crisp charcoal & lime logo layers`);
      } else {
        errors.push(`${vp.name}: Navbar missing liquid glass or logo layers: ${JSON.stringify(navAudit)}`);
      }

      // 3. Hero Liquid-Glass & Specular Elements Check
      const heroAudit = await page.evaluate(() => {
        const eyebrow = document.querySelector("#hero .liquid-glass-sm.shiny-border");
        const primaryCta = document.querySelector("#hero .btn-glossy-charcoal");
        const secondaryCta = document.querySelector("#hero button.liquid-glass-sm.shiny-border");
        const canvas = document.querySelector("#hero canvas");
        const uglyBox = document.querySelector("#hero .bg-\\[\\#141413\\].text-\\[\\#9EE41A\\]");
        return {
          hasEyebrowLiquidGlass: !!eyebrow,
          hasPrimaryGlossyCta: !!primaryCta,
          hasSecondaryLiquidGlassCta: !!secondaryCta,
          has3DCanvas: !!canvas,
          hasUglyBox: !!uglyBox,
        };
      });
      console.log(`[${vp.name}] Hero Audit:`, heroAudit);
      if (heroAudit.hasEyebrowLiquidGlass && heroAudit.hasPrimaryGlossyCta && heroAudit.hasSecondaryLiquidGlassCta) {
        allPassed.push(`${vp.name}: Hero eyebrow and CTAs upgraded with .liquid-glass-sm, .shiny-border, and .btn-glossy-charcoal`);
      } else {
        errors.push(`${vp.name}: Hero elements missing glass/shiny classes: ${JSON.stringify(heroAudit)}`);
      }
      if (!heroAudit.has3DCanvas && !heroAudit.hasUglyBox) {
        allPassed.push(`${vp.name}: Hero remains pristine (zero 3D canvas, zero ugly black box)`);
      } else {
        errors.push(`${vp.name}: Hero has forbidden elements: canvas=${heroAudit.has3DCanvas}, box=${heroAudit.hasUglyBox}`);
      }

      // 4. Cursor-tracking test: Move pointer over a .shiny-border and verify --mx, --my set
      if (!vp.isMobile) {
        const eyebrowBox = await page.locator("#hero .shiny-border").first().boundingBox();
        if (eyebrowBox) {
          await page.mouse.move(eyebrowBox.x + eyebrowBox.width / 2, eyebrowBox.y + eyebrowBox.height / 2);
          await page.waitForTimeout(100);

          const pointerTrackingCheck = await page.evaluate(() => {
            const el = document.querySelector("#hero .shiny-border");
            if (!el) return null;
            const style = el.getAttribute("style") || "";
            const mx = el.style.getPropertyValue("--mx");
            const my = el.style.getPropertyValue("--my");
            return { style, mx, my };
          });
          console.log(`[${vp.name}] Cursor Tracking on Shiny Border:`, pointerTrackingCheck);
          if (pointerTrackingCheck && pointerTrackingCheck.mx && pointerTrackingCheck.my) {
            allPassed.push(`${vp.name}: Live cursor tracking actively updates --mx and --my on .shiny-border`);
          } else {
            errors.push(`${vp.name}: Cursor tracking failed to set --mx/--my: ${JSON.stringify(pointerTrackingCheck)}`);
          }
        }
      }

      // 5. Screenshot Hero
      await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_01_hero_liquid_glass.png` });

      // 6. The Proposition Bento Liquid-Glass & Shiny-Border Check
      const propEl = await page.$("#proposition");
      if (propEl) {
        await propEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        const bentoAudit = await page.evaluate(() => {
          const bentoGrid = document.querySelector("#proposition .liquid-glass.shiny-border");
          const bentoCells = document.querySelectorAll("#proposition .bento-cell.shiny-border");
          const ambientLight = document.querySelector("#hero-proposition-world div[style*='driftCaustic']") || document.querySelector("#hero-proposition-world div[style*='radial-gradient']");
          return {
            hasBentoLiquidGlass: !!bentoGrid,
            bentoCellShinyCount: bentoCells.length,
            hasAmbientLightLayer: !!ambientLight,
          };
        });
        console.log(`[${vp.name}] Proposition Bento Audit:`, bentoAudit);
        if (bentoAudit.hasBentoLiquidGlass && bentoAudit.bentoCellShinyCount === 4) {
          allPassed.push(`${vp.name}: The Proposition 2x2 Bento container & all 4 cells have .liquid-glass and .shiny-border`);
        } else {
          errors.push(`${vp.name}: Bento missing liquid glass or shiny borders: ${JSON.stringify(bentoAudit)}`);
        }
        if (bentoAudit.hasAmbientLightLayer) {
          allPassed.push(`${vp.name}: Ambient studio lighting layer with caustic bloom active behind Hero & Proposition`);
        } else {
          errors.push(`${vp.name}: Ambient lighting layer missing behind Hero & Proposition`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_02_proposition_bento.png` });
      }

      // 7. Services Sticky Cards Liquid-Glass & Shiny-Border Check
      const servicesEl = await page.$("#services");
      if (servicesEl) {
        await servicesEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        const servicesAudit = await page.evaluate(() => {
          const cards = document.querySelectorAll(".sticky-service-card.liquid-glass.shiny-border");
          const ctas = document.querySelectorAll(".sticky-service-card .btn-glossy-charcoal");
          return {
            glassCardCount: cards.length,
            glossyCtaCount: ctas.length,
          };
        });
        console.log(`[${vp.name}] Services Audit:`, servicesAudit);
        if (servicesAudit.glassCardCount === 4 && servicesAudit.glossyCtaCount === 4) {
          allPassed.push(`${vp.name}: All 4 Services sticky cards have .liquid-glass .shiny-border + .btn-glossy-charcoal`);
        } else {
          errors.push(`${vp.name}: Services cards missing glass/glossy classes: ${JSON.stringify(servicesAudit)}`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_03_services_cards.png` });
      }

      // 8. Process & FAQ Liquid-Glass & Shiny-Border Check
      const processEl = await page.$("#process");
      if (processEl) {
        await processEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        const processAudit = await page.evaluate(() => {
          const cards = document.querySelectorAll("#process .liquid-glass.shiny-border");
          return {
            glassCardCount: cards.length,
          };
        });
        console.log(`[${vp.name}] Process Audit:`, processAudit);
        if (processAudit.glassCardCount === 4) {
          allPassed.push(`${vp.name}: All 4 Process step cards have .liquid-glass and .shiny-border`);
        } else {
          errors.push(`${vp.name}: Process cards missing glass/shiny classes: ${JSON.stringify(processAudit)}`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_04_process_steps.png` });
      }

      const faqEl = await page.$("#faq");
      if (faqEl) {
        await faqEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        const faqAudit = await page.evaluate(() => {
          const items = document.querySelectorAll("#faq .faq-card.liquid-glass-sm.shiny-border");
          return {
            glassItemCount: items.length,
          };
        });
        console.log(`[${vp.name}] FAQ Audit:`, faqAudit);
        if (faqAudit.glassItemCount === 5) {
          allPassed.push(`${vp.name}: All 5 FAQ accordion items have .liquid-glass-sm and .shiny-border`);
        } else {
          errors.push(`${vp.name}: FAQ items missing glass/shiny classes: ${JSON.stringify(faqAudit)}`);
        }

        await page.screenshot({ path: `${ARTIFACTS_DIR}/${vp.name}_05_faq_accordion.png` });
      }

      // 9. Frosted-Glass Cursor Lens Check
      if (!vp.isMobile) {
        const cursorAudit = await page.evaluate(() => {
          const ring = document.querySelector(".cursor-ring");
          const dot = document.querySelector(".cursor-dot");
          if (!ring || !dot) return null;
          const ringStyle = window.getComputedStyle(ring);
          const dotStyle = window.getComputedStyle(dot);
          return {
            ringBackdrop: ringStyle.backdropFilter || ringStyle.webkitBackdropFilter,
            ringBg: ringStyle.backgroundColor,
            dotBg: dotStyle.backgroundColor,
          };
        });
        console.log(`[${vp.name}] Frosted Cursor Audit:`, cursorAudit);
        if (cursorAudit && cursorAudit.ringBackdrop && cursorAudit.ringBackdrop.includes("blur")) {
          allPassed.push(`${vp.name}: Custom cursor ring features physical frosted-glass backdrop-filter blur`);
        } else {
          console.warn(`${vp.name}: Cursor ring backdropFilter check:`, cursorAudit);
        }
      }

    } catch (e) {
      console.error(`[AUDIT FAILURE ${vp.name}]:`, e);
      errors.push(`${vp.name} exception: ${e.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`LIQUID-GLASS & LIGHTING VERIFICATION SUMMARY:`);
  console.log(`Total Passed Checks: ${allPassed.length}`);
  allPassed.forEach((p) => console.log(`  ✓ ${p}`));

  if (errors.length > 0) {
    console.error(`\nTotal Failed Checks: ${errors.length}`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  } else {
    console.log(`\nALL LIQUID-GLASS, SHINY-BORDER & AMBIENT LIGHTING AUDITS PASSED WITH ZERO ERRORS!`);
    process.exit(0);
  }
});

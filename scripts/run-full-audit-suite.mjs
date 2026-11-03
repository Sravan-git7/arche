import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173/";
const LOCAL_DIR = "d:/arche/audit_deliverables/screenshots";
const ARTIFACT_DIR = "C:/Users/srava/.gemini/antigravity-ide/brain/b8718b67-e83f-46f3-a790-182bc6715e34/audit_deliverables/screenshots";

[LOCAL_DIR, ARTIFACT_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function saveScreenshot(page, filename) {
  const p1 = path.join(LOCAL_DIR, filename);
  const p2 = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: p1 });
  try {
    fs.copyFileSync(p1, p2);
  } catch (err) {
    console.error("Copy error:", err);
  }
  console.log(`Saved: ${filename}`);
}

async function auditDevice(deviceConfig) {
  const { name, width, height, reducedMotion } = deviceConfig;
  console.log(`\n========================================`);
  console.log(`AUDITING: ${name} (${width}x${height}, reducedMotion=${!!reducedMotion})`);
  console.log(`========================================`);

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });

  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("arche_intro", "1");
      sessionStorage.setItem("arche:booted", "1");
    } catch {}
  });

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") {
      consoleMessages.push(`[${m.type()}] ${m.text()}`);
    }
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Collect page-level metrics
  const pageMetrics = await page.evaluate(() => {
    // @ts-ignore
    const stList = window.ScrollTrigger ? window.ScrollTrigger.getAll() : [];
    const triggers = stList.map((s) => ({
      id: s.vars?.id || "unnamed",
      start: s.start,
      end: s.end,
      pin: !!s.pin,
    }));

    const chapters = Array.from(document.querySelectorAll("[data-chapter]")).map((el) => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      return {
        name: el.getAttribute("data-chapter"),
        top,
        height: rect.height,
      };
    });

    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const hasHorizontalOverflow = scrollWidth > clientWidth;

    return { triggers, chapters, hasHorizontalOverflow, scrollWidth, clientWidth };
  });

  console.log("Chapters measured:", pageMetrics.chapters);
  console.log("Horizontal overflow:", pageMetrics.hasHorizontalOverflow, `(scrollWidth: ${pageMetrics.scrollWidth}, clientWidth: ${pageMetrics.clientWidth})`);

  // Helper to scroll smoothly or jump
  const scrollToY = async (y, waitMs = 600) => {
    await page.evaluate((targetY) => window.scrollTo(0, targetY), y);
    await page.waitForTimeout(waitMs);
  };

  const pPin = pageMetrics.triggers.find((s) => s.id === "problem-pin");
  const sPin = pageMetrics.triggers.find((s) => s.id === "services-pin");
  const sysPin = pageMetrics.triggers.find((s) => s.id === "system-pin" || (s.pin && s.start > (sPin ? sPin.end : 3000)));

  // 1. Hero — initial viewport
  await scrollToY(0, 500);
  await saveScreenshot(page, `${name}_01_hero_initial.png`);

  // 2. Hero — mid-scroll animation
  await scrollToY(Math.round(height * 0.45), 500);
  await saveScreenshot(page, `${name}_02_hero_mid_scroll.png`);

  // 3. Hero -> Problem transition
  const heroBottom = pageMetrics.chapters.find((c) => c.name === "Problem")?.top || height;
  await scrollToY(Math.max(0, heroBottom - Math.round(height * 0.35)), 600);
  await saveScreenshot(page, `${name}_03_hero_to_problem_transition.png`);

  if (!reducedMotion && pPin) {
    // 4. Problem — initial state
    await scrollToY(pPin.start + 50, 600);
    await saveScreenshot(page, `${name}_04_problem_initial.png`);

    // 5. Problem — middle of animation
    const pMid = pPin.start + (pPin.end - pPin.start) * 0.50;
    await scrollToY(pMid, 700);
    await saveScreenshot(page, `${name}_05_problem_middle.png`);

    // 6. Problem — final state
    const pEnd = pPin.start + (pPin.end - pPin.start) * 0.95;
    await scrollToY(pEnd, 700);
    await saveScreenshot(page, `${name}_06_problem_final.png`);

    // 7. Problem -> Services transition
    await scrollToY(pPin.end + 10, 600);
    await saveScreenshot(page, `${name}_07_problem_to_services_transition.png`);
  } else {
    // Problem in static / reduced mode
    const probTop = pageMetrics.chapters.find((c) => c.name === "Problem")?.top || 900;
    await scrollToY(probTop, 600);
    await saveScreenshot(page, `${name}_04_problem_state.png`);
  }

  // Services tabs
  if (!reducedMotion && sPin && width >= 900) {
    const sLen = sPin.end - sPin.start;
    // 8. Services — Video Editing (tab 0)
    await scrollToY(sPin.start + 60, 800);
    await saveScreenshot(page, `${name}_08_services_video_editing.png`);

    // 9. Services — Web Development (tab 1)
    await scrollToY(sPin.start + sLen * 0.35, 800);
    await saveScreenshot(page, `${name}_09_services_web_development.png`);

    // 10. Services — AI Chatbots (tab 2)
    await scrollToY(sPin.start + sLen * 0.62, 800);
    await saveScreenshot(page, `${name}_10_services_ai_chatbots.png`);

    // 11. Services — AI Automation (tab 3)
    await scrollToY(sPin.start + sLen * 0.88, 800);
    await saveScreenshot(page, `${name}_11_services_ai_automation.png`);

    // 12. Services -> next section transition
    await scrollToY(sPin.end + 20, 600);
    await saveScreenshot(page, `${name}_12_services_to_system_transition.png`);
  } else {
    // Services on mobile or reduced
    const svcTop = pageMetrics.chapters.find((c) => c.name === "Services")?.top || 2000;
    await scrollToY(svcTop + 20, 800);
    await saveScreenshot(page, `${name}_08_services_stage.png`);

    // Click tab 1 if exists
    try {
      const tab1 = await page.$('.svc-tab[data-i="1"]');
      if (tab1) {
        await tab1.click();
        await page.waitForTimeout(600);
        await saveScreenshot(page, `${name}_09_services_tab1_click.png`);
      }
    } catch (e) {}
  }

  // 13. Remaining major sections:
  // - System
  const sysChap = pageMetrics.chapters.find((c) => c.name === "System");
  if (sysChap) {
    await scrollToY(sysChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13a_system_model.png`);
  }

  // - Work
  const workChap = pageMetrics.chapters.find((c) => c.name === "Work");
  if (workChap) {
    await scrollToY(workChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13b_work_section.png`);
  }

  // - Process
  const procChap = pageMetrics.chapters.find((c) => c.name === "Process");
  if (procChap) {
    await scrollToY(procChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13c_process_section.png`);
  }

  // - Approach
  const appChap = pageMetrics.chapters.find((c) => c.name === "Approach");
  if (appChap) {
    await scrollToY(appChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13d_approach_section.png`);
  }

  // - Ask Arche
  const askChap = pageMetrics.chapters.find((c) => c.name === "Ask Arche");
  if (askChap) {
    await scrollToY(askChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13e_ask_arche_section.png`);
  }

  // - FAQ
  const faqChap = pageMetrics.chapters.find((c) => c.name === "FAQ");
  if (faqChap) {
    await scrollToY(faqChap.top + 60, 700);
    await saveScreenshot(page, `${name}_13f_faq_section.png`);
  }

  // 14. Final CTA & Footer
  const startChap = pageMetrics.chapters.find((c) => c.name === "Start");
  if (startChap) {
    await scrollToY(startChap.top + 40, 700);
    await saveScreenshot(page, `${name}_14_final_cta_footer.png`);
  }

  // Detailed layout and inspection data
  const inspectionData = await page.evaluate(() => {
    // Check contrast of key elements
    const elementsToAudit = [
      { sel: "#hero-aperture-wrap h1", label: "Hero Headline" },
      { sel: "#problem .pf-head-line", label: "Problem Headline" },
      { sel: "#services-home .d2", label: "Services Headline" },
      { sel: "#services-home .svc-desc", label: "Services Desc" },
      { sel: "#process .d2", label: "Process Headline" },
      { sel: "#approach .d1", label: "Approach Headline" },
      { sel: "footer, [data-chapter='Start']", label: "Footer/CTA" },
    ];

    const auditResults = elementsToAudit.map((item) => {
      const el = document.querySelector(item.sel);
      if (!el) return { label: item.label, found: false };
      const comp = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        label: item.label,
        found: true,
        color: comp.color,
        fontSize: comp.fontSize,
        fontFamily: comp.fontFamily,
        lineHeight: comp.lineHeight,
        width: rect.width,
        height: rect.height,
      };
    });

    // Check for any elements wider than viewport (clipping or overflow culprits)
    const allEls = Array.from(document.querySelectorAll("*"));
    const overflowing = [];
    const vpWidth = window.innerWidth;
    for (const el of allEls) {
      const r = el.getBoundingClientRect();
      if (r.width > vpWidth + 2 && !["HTML", "BODY", "SECTION", "DIV"].includes(el.tagName) && !el.classList.contains("wrap")) {
        overflowing.push({
          tag: el.tagName,
          className: el.className,
          width: r.width,
          vpWidth,
        });
      }
    }

    return { auditResults, overflowing: overflowing.slice(0, 10) };
  });

  await browser.close();

  return {
    name,
    pageMetrics,
    inspectionData,
    consoleMessages,
    pageErrors,
  };
}

async function run() {
  const devices = [
    { name: "Desktop_1440x900", width: 1440, height: 900, reducedMotion: false },
    { name: "Laptop_1366x768", width: 1366, height: 768, reducedMotion: false },
    { name: "Mobile_390x844", width: 390, height: 844, reducedMotion: false },
    { name: "ReducedMotion_1440x900", width: 1440, height: 900, reducedMotion: true },
  ];

  console.log("\n--- AUDITING BRANDED INTRO FLOW ---");
  const introBrowser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const introCtx = await introBrowser.newContext({ viewport: { width: 1440, height: 900 } });
  const introPage = await introCtx.newPage();
  await introPage.goto(BASE);
  await introPage.waitForTimeout(1100);
  await saveScreenshot(introPage, "Desktop_00_intro_brand.png");
  await introPage.waitForTimeout(1200);
  await saveScreenshot(introPage, "Desktop_00_intro_aperture.png");
  await introBrowser.close();

  const results = {};
  for (const dev of devices) {
    results[dev.name] = await auditDevice(dev);
  }

  fs.writeFileSync(
    path.join(LOCAL_DIR, "audit_metrics.json"),
    JSON.stringify(results, null, 2)
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "audit_metrics.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n>>> FULL AUDIT RUN COMPLETED SUCCESSFULLY <<<");
}

run().catch((e) => {
  console.error("FATAL AUDIT ERROR:", e);
  process.exit(1);
});

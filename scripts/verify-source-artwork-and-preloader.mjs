import { chromium } from "playwright";
import fs from "fs";

async function verifyAll() {
  console.log("=== VERIFYING EXACT SOURCE ARTWORK LOGO & PRELOADER ===");

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    // Ensure preloader runs on fresh session
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__archeIntroTl != null);
    console.log("[1/5] Intro timeline initialized.");

    // Pause timeline for deterministic inspection
    await page.evaluate(() => {
      window.__archeIntroTl.pause();
    });

    const getStatesAtTime = async (t) => {
      return await page.evaluate((time) => {
        window.__archeIntroTl.time(time);
        const a = document.querySelector(".intro-layer-a");
        const c = document.querySelector(".intro-layer-c");
        const dot = document.querySelector(".intro-layer-dot");
        const full = document.querySelector(".intro-layer-full");

        const getStyle = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            opacity: parseFloat(s.opacity || "1"),
            clipPath: s.clipPath || "none",
          };
        };

        return {
          time,
          a: getStyle(a),
          c: getStyle(c),
          dot: getStyle(dot),
          full: getStyle(full),
        };
      }, t);
    };

    // State at t=0.25s: A reveals first. C and Dot absent.
    const s025 = await getStatesAtTime(0.25);
    console.log("State at t=0.25s:", s025);
    if (s025.a.opacity > 0 && s025.c.opacity === 0 && s025.dot.opacity === 0) {
      console.log("[PASS] t=0.25s: A reveals first. C and Dot are absent.");
    } else {
      throw new Error(`Failed t=0.25s assertion: ${JSON.stringify(s025)}`);
    }

    // State at t=0.65s: A established, C revealing, Dot absent.
    const s065 = await getStatesAtTime(0.65);
    console.log("State at t=0.65s:", s065);
    if (s065.a.opacity === 1 && s065.c.opacity > 0 && s065.dot.opacity === 0) {
      console.log("[PASS] t=0.65s: A established, C revealing. Dot is absent.");
    } else {
      throw new Error(`Failed t=0.65s assertion: ${JSON.stringify(s065)}`);
    }

    // State at t=0.88s: C complete, Dot still absent.
    const s088 = await getStatesAtTime(0.88);
    console.log("State at t=0.88s:", s088);
    if (s088.c.opacity === 1 && s088.dot.opacity === 0) {
      console.log("[PASS] t=0.88s: C complete, Dot still absent.");
    } else {
      throw new Error(`Failed t=0.88s assertion: ${JSON.stringify(s088)}`);
    }

    // State at t=1.10s: Dot appears last.
    const s110 = await getStatesAtTime(1.10);
    console.log("State at t=1.10s:", s110);
    if (s110.dot.opacity === 1) {
      console.log("[PASS] t=1.10s: Dot appears last, all elements established.");
    } else {
      throw new Error(`Failed t=1.10s assertion: ${JSON.stringify(s110)}`);
    }

    // Take screenshot at t=1.10s where monogram reveal is complete
    await page.screenshot({ path: "scripts/verified_intro_complete.png", animations: "disabled" });
    console.log("Saved scripts/verified_intro_complete.png");

    // [2/5] Check asset references: verify it references public asset, not Windows path
    const assetCheck = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll(".intro-ac-monogram img"));
      return imgs.map((img) => img.getAttribute("src"));
    });
    console.log("[2/5] Intro img src attributes:", assetCheck);
    if (assetCheck.every((src) => src.includes("arche%20logo.jpeg") || src.includes("arche logo.jpeg"))) {
      console.log("[PASS] Intro images reference public asset /arche logo.jpeg.");
    } else {
      throw new Error("Intro images do not reference /arche logo.jpeg");
    }

    // [3/5] Check Nav and Footer in live page (new page with intro skipped)
    const livePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await livePage.addInitScript(() => {
      sessionStorage.setItem("arche_intro", "1");
    });
    await livePage.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    const headerLogo = await livePage.waitForSelector("nav .ac-monogram-wrap img", { state: "attached", timeout: 5000 });
    if (headerLogo) {
      const src = await headerLogo.getAttribute("src");
      console.log("[3/5] [PASS] Nav logo found, src:", src);
    } else {
      throw new Error("Nav logo missing!");
    }

    await livePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await livePage.waitForTimeout(300);

    const footerLogo = await livePage.waitForSelector("footer .ac-monogram-wrap img", { state: "attached", timeout: 5000 });
    if (footerLogo) {
      const src = await footerLogo.getAttribute("src");
      console.log("[4/5] [PASS] Footer logo found, src:", src);
    } else {
      throw new Error("Footer logo missing!");
    }

    // Capture screenshots of nav and footer
    await livePage.screenshot({ path: "scripts/verified_desktop_header.png", clip: { x: 0, y: 0, width: 1920, height: 120 }, animations: "disabled" });
    await livePage.screenshot({ path: "scripts/verified_desktop_footer.png", clip: { x: 0, y: 960, width: 1920, height: 120 }, animations: "disabled" });

    // [5/5] Mobile check (390 x 844)
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.addInitScript(() => {
      sessionStorage.setItem("arche_intro", "1");
    });
    await mobilePage.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    const mobileLogo = await mobilePage.waitForSelector("nav .ac-monogram-wrap img", { state: "attached", timeout: 5000 });
    if (mobileLogo) {
      console.log("[5/5] [PASS] Mobile Nav logo found, src:", await mobileLogo.getAttribute("src"));
      await mobilePage.screenshot({ path: "scripts/verified_mobile_header.png", clip: { x: 0, y: 0, width: 390, height: 100 }, animations: "disabled" });
    } else {
      throw new Error("Mobile Nav logo missing!");
    }

    console.log("ALL VERIFICATIONS PASSED WITH ZERO ERRORS!");
  } finally {
    await browser.close();
  }
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

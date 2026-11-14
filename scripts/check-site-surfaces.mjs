import { chromium } from "playwright";

async function checkSiteSurfaces() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    sessionStorage.setItem("arche_intro", "1");
  });
  await page.goto("http://localhost:5173/");

  const headerInfo = await page.evaluate(() => {
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    return {
      headerBg: window.getComputedStyle(header).backgroundColor,
      headerColor: window.getComputedStyle(header).color,
      footerBg: window.getComputedStyle(footer).backgroundColor,
      footerColor: window.getComputedStyle(footer).color,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
    };
  });

  console.log("Surfaces:", headerInfo);
  await browser.close();
}

checkSiteSurfaces().catch(console.error);

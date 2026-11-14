import { chromium } from "playwright";

async function checkContrast() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const res = await page.evaluate(async () => {
    // Ivory background of page: #f4f2ed -> rgb(244, 242, 237)
    // Artwork ivory: rgb(230, 225, 215)
    // Contrast between #f4f2ed and #e6e1d7 is ~ 1.15 : 1 (essentially invisible!)
    // Whereas dark badge #0c0c0d gives contrast > 15 : 1!
    return {
      bg: "rgb(244, 242, 237)",
      artIvory: "rgb(230, 225, 215)",
      badgeBg: "rgb(12, 12, 13)"
    };
  });

  console.log("Contrast details:", res);
  await browser.close();
}

checkContrast().catch(console.error);

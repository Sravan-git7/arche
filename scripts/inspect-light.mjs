import { chromium } from "playwright";

async function inspectLightSurface() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const info = await page.evaluate(async () => {
    // Check if on light background (#f4f2ed), how does the raw artwork look vs a badge or inverted
    return "inspecting";
  });
  console.log(info);
  await browser.close();
}
inspectLightSurface().catch(console.error);

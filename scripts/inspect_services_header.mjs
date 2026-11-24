import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll so Services header is right in view
  await page.evaluate(() => {
    const el = document.querySelector('#services');
    if (el) {
      el.scrollIntoView({ block: 'start' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/inspect_services_header.png' });

  // Let's also check computed styles of "Four verticals." specifically
  const fourVertStyles = await page.evaluate(() => {
    const heading = document.querySelector('#services h2');
    if (!heading) return null;
    const spans = heading.querySelectorAll('span');
    const result = [];
    spans.forEach(s => {
      const c = window.getComputedStyle(s);
      result.push({
        text: s.innerText,
        className: s.className,
        color: c.color,
        webkitTextFillColor: c.webkitTextFillColor,
        background: c.background,
        webkitBackgroundClip: c.webkitBackgroundClip
      });
    });
    return result;
  });
  console.log('fourVertStyles:', JSON.stringify(fourVertStyles, null, 2));

  await browser.close();
}

main().catch(console.error);

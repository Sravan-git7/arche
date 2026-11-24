import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to services
  const services = page.locator('#services');
  if (await services.count()) {
    await services.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scripts/inspect_services.png' });
  }

  // Scroll to difference / studio
  const studio = page.locator('#difference, [id*="difference"], [id*="studio"]');
  if (await studio.count()) {
    await studio.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scripts/inspect_difference.png' });
  }

  // Scroll to manifesto / tension
  const tension = page.locator('#tension, [id*="tension"]');
  if (await tension.count()) {
    await tension.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scripts/inspect_tension.png' });
  }

  // Check computed styles of .shiny-ink-text
  const shinyStyles = await page.evaluate(() => {
    const el = document.querySelector('.shiny-ink-text');
    if (!el) return null;
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      webkitTextFillColor: computed.webkitTextFillColor,
      background: computed.background,
      webkitBackgroundClip: computed.webkitBackgroundClip,
      backgroundClip: computed.backgroundClip,
      display: computed.display,
      parentColor: el.parentElement ? window.getComputedStyle(el.parentElement).color : null
    };
  });
  console.log('shinyStyles:', JSON.stringify(shinyStyles, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

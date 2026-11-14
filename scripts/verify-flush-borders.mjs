import { chromium } from "playwright";

async function verifyFlushBorders() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #0c0c0d; }
        .box {
          position: relative;
          width: 700px;
          height: calc(700px / 1.185436); /* 590.5px */
          overflow: hidden;
          outline: 1px solid red;
        }
        .box img {
          position: absolute;
          width: calc(100% * 2048 / 1400);
          height: auto;
          left: calc(-100% * 368 / 1400);
          top: calc(-100% * 429 / 1400);
          mix-blend-mode: screen;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <img src="/arche%20logo.jpeg" />
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "scripts/test_flush_crop.png" });
  console.log("Saved scripts/test_flush_crop.png");
  await browser.close();
}

verifyFlushBorders().catch(console.error);

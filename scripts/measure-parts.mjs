import { chromium } from "playwright";

async function measureParts() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const parts = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/arche%20logo.jpeg";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Entire artwork: x: 368 to 1768, y: 429 to 1610 (width 1400, height 1181)
        // Let's analyze where A, C, and dot lie within this artwork box:
        // Relative to artwork box:
        // W = 1400, H = 1181.
        // Let's locate the neck / transition between A and C:
        // Around x = 1070 (in image coordinates).
        // Relative to artwork box (left = 368):
        // x_div = (1070 - 368) / 1400 = 702 / 1400 = 50.14% of the artwork width!
        // The left 50.14% is A.
        // The right 49.86% contains C and the central lime dot.
        
        // Where is the central lime dot?
        // Let's find all high green/lime pixels (g > 150, r > 100, b < 100) inside the counter of C:
        // In image coordinates:
        const idata = ctx.getImageData(0, 0, img.width, img.height);
        const data = idata.data;
        let dotMinX = 2048, dotMinY = 2048, dotMaxX = 0, dotMaxY = 0;
        let cMinX = 2048, cMinY = 2048, cMaxX = 0, cMaxY = 0;

        for (let y = 429; y <= 1610; y++) {
          for (let x = 368; x <= 1768; x++) {
            const idx = (y * 2048 + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // Check for lime dot (circular spot near x: 1200..1400, y: 950..1150)
            if (x >= 1200 && x <= 1400 && y >= 950 && y <= 1150) {
              if (g > 160 && r > 120 && b < 100) {
                if (x < dotMinX) dotMinX = x;
                if (x > dotMaxX) dotMaxX = x;
                if (y < dotMinY) dotMinY = y;
                if (y > dotMaxY) dotMaxY = y;
              }
            }
          }
        }

        // Relative coordinates to artwork box [368, 429, 1400, 1181]:
        resolve({
          artworkBox: { minX: 368, minY: 429, w: 1400, h: 1181 },
          dotBoxInImage: { minX: dotMinX, minY: dotMinY, maxX: dotMaxX, maxY: dotMaxY },
          dotBoxRelPercent: {
            x: ((dotMinX - 368) / 1400) * 100,
            y: ((dotMinY - 429) / 1181) * 100,
            w: ((dotMaxX - dotMinX + 1) / 1400) * 100,
            h: ((dotMaxY - dotMinY + 1) / 1181) * 100,
            cx: (((dotMinX + dotMaxX) / 2 - 368) / 1400) * 100,
            cy: (((dotMinY + dotMaxY) / 2 - 429) / 1181) * 100
          }
        });
      };
    });
  });

  console.log("Parts:", JSON.stringify(parts, null, 2));
  await browser.close();
}

measureParts().catch(console.error);

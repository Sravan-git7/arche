import { chromium } from "playwright";

async function inspectRegions() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const res = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/arche%20logo.jpeg";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Find connected components or islands of brightness
        // Check what exists at top-right (x > 1400, y < 800)
        let trPixels = 0;
        const idata = ctx.getImageData(0, 0, img.width, img.height);
        const data = idata.data;
        for (let y = 400; y < 800; y++) {
          for (let x = 1450; x < 1800; x++) {
            const idx = (y * img.width + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            if (luma > 50) trPixels++;
          }
        }

        // Bbox excluding the top-right corner
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            // Ignore the small triangle at x > 1460, y < 800
            if (x > 1460 && y < 800) continue;
            const idx = (y * img.width + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            if (luma > 30) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        resolve({
          trPixels,
          mainMarkBbox: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 }
        });
      };
    });
  });

  console.log("Regions:", res);
  await browser.close();
}

inspectRegions().catch(console.error);

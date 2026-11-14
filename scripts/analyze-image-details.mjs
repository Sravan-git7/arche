import { chromium } from "playwright";
import fs from "fs";

async function analyze() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const analysis = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/arche%20logo.jpeg";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const idata = ctx.getImageData(0, 0, img.width, img.height);
        const data = idata.data;

        // Histogram of dark vs light pixels
        let darkCount = 0;
        let brightCount = 0;
        let maxLuma = 0;
        let minLuma = 255;

        // Sample along borders
        let borderMaxLuma = 0;
        for (let x = 0; x < img.width; x++) {
          for (let y of [0, 1, 2, 5, 10, img.height - 1, img.height - 2, img.height - 10]) {
            const idx = (y * img.width + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            if (luma > borderMaxLuma) borderMaxLuma = luma;
          }
        }

        // Check the exact crop of the mark
        // Where is the mark located?
        // Let's find tight bounding box where luma > 30
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            if (luma > 25) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        resolve({
          borderMaxLuma,
          tightBbox: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 },
          aspectRatio: (maxX - minX + 1) / (maxY - minY + 1)
        });
      };
    });
  });

  console.log("Analysis:", analysis);
  await browser.close();
}

analyze().catch(console.error);

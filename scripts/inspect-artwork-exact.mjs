import { chromium } from "playwright";
import fs from "fs";

async function inspectArtwork() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");

  const info = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/arche%20logo.jpeg";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Find exact bounding box of the entire artwork in arche logo.jpeg including any source detail
        const idata = ctx.getImageData(0, 0, img.width, img.height);
        const data = idata.data;
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        
        // Find threshold above background
        // Background at borders is ~10-18
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // Threshold
            if (r > 24 || g > 24 || b > 24) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        resolve({
          w: img.width,
          h: img.height,
          artworkBbox: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 }
        });
      };
    });
  });

  console.log("Artwork bbox:", info);
  await browser.close();
}

inspectArtwork().catch(console.error);

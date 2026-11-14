import { chromium } from 'playwright';
import fs from 'fs';

async function zoomBreakdown() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #000; color: #fff; font-family: monospace; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { background: #111; border: 1px solid #333; padding: 10px; text-align: center; }
        .crop { width: 450px; height: 350px; overflow: hidden; position: relative; margin: 0 auto; border: 1px solid #555; }
        .crop img { position: absolute; }
      </style>
    </head>
    <body>
      <h2>Arche Logo Detailed Anatomical Breakdown</h2>
      <div class="grid">
        <div class="card">
          <h3>Full Mark</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -100px; top: -140px; width: 650px;" />
          </div>
        </div>
        <div class="card">
          <h3>A Apex & Legs</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -200px; top: -180px; width: 1100px;" />
          </div>
        </div>
        <div class="card">
          <h3>C Upper Lime Arc</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -600px; top: -280px; width: 1100px;" />
          </div>
        </div>
        <div class="card">
          <h3>Central Lime Dot & Inner C</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -650px; top: -480px; width: 1100px;" />
          </div>
        </div>
        <div class="card">
          <h3>A to C Interweave</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -420px; top: -380px; width: 1100px;" />
          </div>
        </div>
        <div class="card">
          <h3>C Lower Arc</h3>
          <div class="crop">
            <img src="http://localhost:5173/arche%20logo.jpeg" style="left: -600px; top: -650px; width: 1100px;" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync('public/test-breakdown.html', html);
  await page.goto('http://localhost:5173/test-breakdown.html');
  await page.screenshot({ path: 'public/anatomical_breakdown.png', fullPage: true });
  console.log('Saved public/anatomical_breakdown.png');
  await browser.close();
}

zoomBreakdown().catch(console.error);

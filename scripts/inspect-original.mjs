import { chromium } from 'playwright';
import fs from 'fs';

async function inspectOriginal() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  
  // Create an HTML page that crops precisely to the logo bbox and displays it clearly
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: monospace; color: #fff; }
        .crop-container { width: 900px; height: 900px; position: relative; overflow: hidden; border: 2px solid #555; }
        .crop-container img { position: absolute; left: -100px; top: -100px; width: 1100px; height: 1100px; }
      </style>
    </head>
    <body>
      <h2>Original Arche Monogram (arche logo.jpeg)</h2>
      <div class="crop-container">
        <img src="http://localhost:5173/arche%20logo.jpeg" />
      </div>
    </body>
    </html>
  `;
  
  fs.writeFileSync('public/test-inspect-hires.html', html);
  await page.goto('http://localhost:5173/test-inspect-hires.html');
  await page.screenshot({ path: 'public/hires_original_logo.png' });
  console.log('Saved public/hires_original_logo.png');
  await browser.close();
}

inspectOriginal().catch(console.error);

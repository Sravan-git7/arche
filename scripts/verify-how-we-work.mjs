import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const out = 'audit_deliverables/how-we-work';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROME_LIBS || '' } });
const report = [];
try {
  for (const width of [1440, 390]) {
    const height = width === 390 ? 844 : 900;
    for (const [label, port] of [['before', 5174], ['after', 5173]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => sessionStorage.setItem('arche_intro', '1'));
      await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1800);
      await fs.writeFile(`${out}/content-${label}-${width}.txt`, await page.locator('main').innerText());
      for (const chapter of ['Hero', 'Problem', 'Services']) {
        await page.locator(`[data-chapter="${chapter}"]`).evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY));
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${out}/${label}-${chapter}-${width}.png` });
      }
      if (label === 'after') {
        assert.equal(await page.locator('.hww [data-pv-diagram]').count(), 1);
        const chapters = await page.locator('[data-chapter]').evaluateAll(els => els.map(e => e.dataset.chapter));
        assert.equal(chapters.filter(x => x === 'Process').length, 1);
        assert.equal(chapters.filter(x => x === 'Approach').length, 1);
        // Position by document offsets, not sticky rectangles after a scroll.
        const positions = await page.locator('[data-hww-beat]').evaluateAll(els => els.map(e => { const old = e.style.position; e.style.position = 'static'; const y = e.getBoundingClientRect().top + scrollY; e.style.position = old; return y; }));
        for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]) {
          await page.evaluate(y => window.scrollTo(0, y), positions[i] - height * .5);
          await page.waitForTimeout(350);
          const state = await page.locator('.hww').evaluate(e => ({ beat: +e.dataset.beat, ink: e.classList.contains('on-ink'), diagramTop: e.querySelector('.hww-visual').getBoundingClientRect().top, state: +e.querySelector('[data-pv-diagram]').dataset.state }));
          assert.equal(state.beat, i, `beat ${i} at ${width}`);
          assert.equal(state.ink, i >= 4);
          assert.equal(state.state, Math.min(5, i));
          assert.match(await page.locator('.progress-edge-label').innerText(), i < 6 ? /Process/i : /Approach/i);
          const targetSize = await page.locator(`[data-hww-beat="${i}"] button`).boundingBox();
          assert(targetSize.height >= 44);
          assert(state.diagramTop >= 0 && state.diagramTop < height, 'diagram remains visible');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          report.push({ width, checkpoint: i, ...state });
          await page.screenshot({ path: `${out}/beat-${i}-${width}.png` });
        }
        // Mid-stage drawing must be scroll-owned, stable at rest, and reversible.
        const sample = async y => {
          await page.evaluate(y => window.scrollTo(0, y), y);
          await page.waitForTimeout(200);
          return page.locator('.hww-spoke').first().evaluate(e => parseFloat(getComputedStyle(e).strokeDashoffset));
        };
        const middleY = positions[1] - height * .72;
        const middle = await sample(middleY);
        assert(middle > 0 && middle < 1, 'partial stroke exists between steps');
        await page.waitForTimeout(500);
        assert.equal(await page.locator('.hww-spoke').first().evaluate(e => parseFloat(getComputedStyle(e).strokeDashoffset)), middle, 'scroll animation cannot drift on a timer');
        await sample(positions[2] - height * .5);
        assert.equal(await sample(middleY), middle, 'same reverse position produces same geometry');
        const launchSample = async () => {
          await page.evaluate(y => window.scrollTo(0, y), positions[4] - height * .72);
          await page.waitForTimeout(200);
          return page.locator('.hww').evaluate(e => ({ background: getComputedStyle(e).backgroundColor, wave: +e.querySelector('.hww-release').getAttribute('r') }));
        };
        const launch = await launchSample();
        assert(launch.wave > 10 && launch.wave < 46, 'Launch signal release is scrubbed');
        await page.evaluate(y => window.scrollTo(0, y), positions[5] - height * .5);
        await page.waitForTimeout(200);
        assert.deepEqual(await launchSample(), launch, 'dip and wave reverse to the exact same state');
        await page.locator('.hww-exit').evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * .4));
        await page.waitForTimeout(1500);
        assert.equal(await page.locator('.hww').evaluate(e => e.classList.contains('on-ink')), false);
        await page.screenshot({ path: `${out}/paper-exit-${width}.png` });
        await page.evaluate(() => window.scrollTo(0, document.querySelector('.hww').getBoundingClientRect().bottom + scrollY + 50));
        await page.waitForTimeout(200);
        assert.equal(await page.locator('.hww-breath').evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
        // Keyboard activation uses a real button; focus stays visible.
        await page.locator('[data-hww-beat="6"] button').focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        assert.equal(await page.locator('[data-hww-beat="6"] button').getAttribute('aria-pressed'), 'true');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(300);
        assert.equal(await page.locator('.hww [data-pv-diagram]').getAttribute('data-state'), '5');
        assert.equal(await page.locator('.hww-visual').evaluate(e => getComputedStyle(e).position), 'static');
        assert.equal(await page.locator('.hww-card').first().evaluate(e => getComputedStyle(e).position), 'static');
        assert.equal(await page.locator('.hww-spoke').first().evaluate(e => parseFloat(getComputedStyle(e).strokeDashoffset)), 0);
        assert.equal(await page.locator('.hww-breath').evaluate(e => getComputedStyle(e).animationName), 'none');
        assert.equal(await page.evaluate(() => window.ScrollTrigger.getAll().filter(t => t.vars.id === 'how-we-work').length), 0);
        await page.screenshot({ path: `${out}/reduced-${width}.png` });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForTimeout(300);
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  await fs.writeFile(`${out}/checkpoints.json`, JSON.stringify(report, null, 2));
  console.log('PASS: diagram continuity, ten beats, reverse scroll, Launch ink, paper exit, rail entries, keyboard, reduced motion, viewport overflow, runtime errors.');
} finally { await browser.close(); }

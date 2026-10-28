/**
 * Service-film and scroll-handoff regression checks.
 * Start the site first: npm run dev -- --host 0.0.0.0
 * npm run verify:motion                     # desktop
 * MOBILE=1 W=320 H=700 npm run verify:motion
 * REDUCED=1 npm run verify:motion          # reduced-motion fallback
 * CHROME_PATH and CHROME_LIBS are optional, as in scripts/verify.mjs.
 */
import { chromium } from "playwright";

const base = process.env.BASE || "http://localhost:5173/";
const mobile = process.env.MOBILE === "1";
const reduced = process.env.REDUCED === "1";
const width = Number(process.env.W || (mobile ? 390 : 1440));
const height = Number(process.env.H || (mobile ? 844 : 900));
const launch = { args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] };
if (process.env.CHROME_PATH) {
  launch.executablePath = process.env.CHROME_PATH;
  launch.env = { ...process.env, LD_LIBRARY_PATH: process.env.CHROME_LIBS || "" };
}
const browser = await chromium.launch(launch);
const context = await browser.newContext({
  viewport: { width, height }, isMobile: mobile, hasTouch: mobile,
  reducedMotion: reduced ? "reduce" : "no-preference",
});
await context.addInitScript(() => { try { sessionStorage.setItem("arche:booted", "1"); } catch {} });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const slugs = ["video-editing", "web-development", "ai-chatbots", "ai-automation"];
const plans = [
  [null, "edit-to-interface", "frames-to-intent", "tracks-to-routing"],
  ["interface-to-edit", null, "interface-to-question", "interface-to-workflow"],
  ["output-to-timeline", "intent-to-interface", null, "intent-to-routing"],
  ["workflow-to-edit", "workflow-to-interface", "workflow-to-intelligence", null],
];
const results = [];
const wait = (ms) => page.waitForTimeout(ms);
function assert(condition, message) { if (!condition) throw new Error(message); }
async function test(name, fn) {
  try { await fn(); results.push(true); console.log(`✓ ${name}`); }
  catch (e) { results.push(false); console.error(`✗ ${name}: ${e.message.split("\n")[0]}`); }
}
async function change(index) {
  await page.evaluate((i) => document.querySelectorAll("#services-home .svc-tab")[i].click(), index);
  await page.waitForFunction((slug) => document.querySelector("#services-stage")?.dataset.renderedService === slug, slugs[index], { timeout: 2000 });
}
async function details() {
  return page.evaluate(() => {
    const stage = document.querySelector("#services-stage");
    const shell = stage?.querySelector("[data-film]") || stage?.querySelector(":scope > .relative:not(.z-\\[2\\])");
    const snapshot = stage?.querySelector(".svc-film-snapshot");
    const live = snapshot?.parentElement.firstElementChild || shell?.firstElementChild;
    return {
      selected: stage?.dataset.service, rendered: stage?.dataset.renderedService,
      labelledBy: stage?.getAttribute("aria-labelledby"),
      selectedTabs: [...document.querySelectorAll('#services-home .svc-tab[aria-selected="true"]')].map((e) => e.id),
      film: stage?.querySelector("[data-film]")?.dataset.film,
      snapshots: document.querySelectorAll(".svc-film-snapshot").length,
      traces: document.querySelectorAll(".svc-film-trace").length,
      inert: snapshot?.inert, hidden: snapshot?.getAttribute("aria-hidden"),
      pointerEvents: snapshot ? getComputedStyle(snapshot).pointerEvents : null,
      duplicateIds: snapshot?.querySelectorAll("[id]").length ?? 0,
      liveOpacity: live ? getComputedStyle(live).opacity : null,
      liveMask: live ? getComputedStyle(live).maskImage : null,
      shellHeight: shell?.style.height || "", shellOverflow: shell?.style.overflow || "",
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
}
async function settled(index) {
  await wait(mobile ? 720 : 940);
  const d = await details();
  assert(d.selected === slugs[index] && d.rendered === slugs[index], `wrong final service: ${JSON.stringify(d)}`);
  assert(d.selectedTabs.length === 1 && d.selectedTabs[0] === `svc-tab-${slugs[index]}`, "selected tab is out of sync");
  assert(d.labelledBy === `svc-tab-${slugs[index]}`, "tabpanel label is out of sync");
  assert(d.snapshots === 0 && d.traces === 0 && !d.film, "transient film was not removed");
  assert(d.liveOpacity === "1" && (d.liveMask === "none" || !d.liveMask), `live demo retained visual styles: ${JSON.stringify(d)}`);
  assert(!d.shellHeight && !d.shellOverflow, `temporary stage sizing was not restored: ${JSON.stringify(d)}`);
  assert(d.overflow <= 1, `horizontal overflow: ${d.overflow}px`);
}
async function ensure(index) { await change(index); await settled(index); }

await page.goto(base, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await wait(1600);
await page.locator("#services-home").scrollIntoViewIfNeeded();
await wait(900);

for (let from = 0; from < slugs.length; from++) {
  for (let to = 0; to < slugs.length; to++) {
    if (from === to) continue;
    await test(`${slugs[from]} → ${slugs[to]}${reduced ? " (reduced)" : ""}`, async () => {
      await ensure(from);
      await change(to);
      await wait(35);
      const d = await details();
      assert(d.selected === slugs[to] && d.rendered === slugs[to], "service did not commit immediately");
      assert(d.selectedTabs.length === 1 && d.selectedTabs[0] === `svc-tab-${slugs[to]}`, "tab and demo differ during transition");
      if (reduced) assert(d.snapshots === 0 && d.traces === 0 && !d.film, "reduced motion created an animation");
      else {
        assert(d.film === plans[from][to], `wrong or absent pair plan: ${JSON.stringify(d)}`);
        assert(d.snapshots === 1 && d.traces === 1 && d.inert && d.hidden === "true", "outgoing snapshot was not inert");
        assert(d.pointerEvents === "none" && d.duplicateIds === 0, "snapshot exposes controls or duplicate IDs");
      }
      await settled(to);
    });
  }
}

if (!reduced) {
  await test("rapid reselection cancels stale films and settles on the latest tab", async () => {
    await ensure(0);
    for (const i of [1, 3, 2, 0, 3]) {
      await change(i);
      await wait(65);
      const d = await details();
      assert(d.snapshots <= 1 && d.traces <= 1 && d.selected === slugs[i], `overlapping or stale transition: ${JSON.stringify(d)}`);
    }
    await settled(3);
  });
  await test("focus immediately finishes the film without losing the input", async () => {
    await ensure(0); await change(2); await wait(40);
    assert((await details()).snapshots === 1, "no film to interrupt");
    await page.locator("#agent-demo-question").focus();
    await wait(40);
    assert((await details()).snapshots === 0, "focus did not finish the film");
    assert(await page.evaluate(() => document.activeElement?.id === "agent-demo-question"), "incoming input lost focus");
  });
  await test("first pointer or touch on an incoming control works during a film", async () => {
    await ensure(0);
    if (mobile) { await page.locator("#services-stage").scrollIntoViewIfNeeded(); await wait(200); }
    await change(3);
    const button = page.locator("#services-stage .workflow-modes button").nth(1);
    const point = await button.evaluate((el) => {
      window.motionPointerDuringFilm = false;
      document.addEventListener("pointerdown", () => { window.motionPointerDuringFilm = !!document.querySelector(".svc-film-snapshot"); }, { capture: true, once: true });
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      return { x, y, hit: el.contains(document.elementFromPoint(x, y)), film: !!document.querySelector(".svc-film-snapshot") };
    });
    assert(point.film && point.hit, `incoming control was not hit-testable during the film: ${JSON.stringify(point)}`);
    if (mobile) await page.touchscreen.tap(point.x, point.y);
    else await page.mouse.click(point.x, point.y);
    await wait(80);
    assert(await page.evaluate(() => window.motionPointerDuringFilm), "the film had ended before the interaction");
    assert(await button.getAttribute("aria-pressed") === "true", "the first interaction missed the live control");
    assert((await details()).snapshots === 0, "pointer interaction did not finish the film");
  });
  await test("resize and backgrounding remove in-flight effects", async () => {
    await ensure(0); await change(1); await wait(40);
    assert((await details()).snapshots === 1, "no film before resize");
    await page.setViewportSize({ width: width + 1, height }); await wait(100);
    assert((await details()).snapshots === 0, "resize left a snapshot behind");
    await page.setViewportSize({ width, height }); await wait(150);
    await change(0); await wait(40);
    assert((await details()).snapshots === 1, "no film before visibility change");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
      delete document.visibilityState;
    });
    await wait(40);
    assert((await details()).snapshots === 0, "backgrounding left a snapshot behind");
    await settled(0);
  });
  await test("handoffs use the demos' current interactive states", async () => {
    await ensure(1);
    await page.evaluate(() => document.querySelectorAll("#services-stage .web-phase-rail button")[3].click());
    assert(await page.locator("#services-stage .web-mini").getAttribute("data-phase") === "3", "web demo did not reach its live view");
    await change(3); await wait(40);
    assert((await details()).film === plans[1][3], "live web interface did not transform into a workflow");
    await settled(3);
    await page.evaluate(() => document.querySelectorAll("#services-stage .workflow-modes button")[1].click());
    assert(await page.locator("#services-stage .workflow-modes button").nth(1).getAttribute("aria-pressed") === "true", "workflow mode did not change");
    await change(2); await wait(40);
    assert((await details()).film === plans[3][2], "automated workflow did not transform into the agent");
    await settled(2);
    await page.evaluate(() => document.querySelector("#services-stage .agent-suggestions button").click());
    const response = await page.locator("#services-stage .agent-experience-conversation").innerText();
    assert(response.length > 30, "agent demo did not produce a local response");
    await change(0); await wait(40);
    const captured = await page.locator(".svc-film-snapshot .agent-experience-conversation").innerText();
    assert(captured.includes(response.trim()), "agent output was not carried into the timeline handoff");
    await settled(0);
  });
  if (mobile) await test("a horizontally scrolled edit timeline does not jump when it becomes the web interface", async () => {
    await ensure(0);
    const data = await page.evaluate(async () => {
      const track = document.querySelector("#services-stage .edit-stages");
      track.scrollLeft = track.scrollWidth;
      const bounds = track.getBoundingClientRect();
      const buttons = [...track.querySelectorAll("button")];
      const index = buttons.findIndex((el) => { const r = el.getBoundingClientRect(); return r.left >= bounds.left && r.right <= bounds.right; });
      const before = buttons[index].getBoundingClientRect().left;
      const scroll = track.scrollLeft;
      document.querySelectorAll("#services-home .svc-tab")[1].click();
      await new Promise(requestAnimationFrame);
      const clone = document.querySelectorAll(".svc-film-snapshot .edit-stages button")[index];
      return { before, after: clone?.getBoundingClientRect().left, scroll, film: !!document.querySelector(".svc-film-snapshot") };
    });
    assert(data.scroll > 0 && data.film && Math.abs(data.before - data.after) < 3, `scrolled timeline shifted before transforming: ${JSON.stringify(data)}`);
    await settled(1);
  });
  await test("missing mask support and missing geometry fall back safely", async () => {
    await ensure(0);
    await page.evaluate(() => {
      window.originalSupports = CSS.supports;
      CSS.supports = function (...args) { return args[0] === "mask-image" ? false : window.originalSupports.apply(CSS, args); };
    });
    try {
      await change(1); await wait(35);
      const d = await details();
      assert(d.film === plans[0][1] && d.liveMask === "none", `mask fallback failed: ${JSON.stringify(d)}`);
      await settled(1);
    } finally { await page.evaluate(() => { CSS.supports = window.originalSupports; delete window.originalSupports; }); }

    await ensure(0);
    await page.evaluate(() => {
      window.originalRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        if (this.matches(".web-phase-rail button, .web-blueprint-hero, .web-blueprint-block, .web-site-content > div") && this.closest(".web-experience")) return new DOMRect(0, 0, 0, 0);
        return window.originalRect.call(this);
      };
    });
    try {
      await change(1); await wait(35);
      const d = await details();
      assert(d.selected === slugs[1] && d.rendered === slugs[1] && d.snapshots === 0 && !d.film && d.liveOpacity === "1", `geometry fallback failed: ${JSON.stringify(d)}`);
    } finally { await page.evaluate(() => { Element.prototype.getBoundingClientRect = window.originalRect; delete window.originalRect; }); }
    await settled(1);
  });
  if (mobile) await test("leaving the section cancels its offscreen film", async () => {
    await ensure(0); await change(1); await wait(35);
    assert((await details()).snapshots === 1, "no film before leaving section");
    await page.evaluate(() => { document.querySelector("#services-home").style.display = "none"; });
    try {
      await page.waitForFunction(() => !document.querySelector(".svc-film-snapshot"), null, { timeout: 400 });
    } finally { await page.evaluate(() => { document.querySelector("#services-home").style.display = ""; }); }
    await wait(250);
  });
  if (mobile) await test("a live reduced-motion change stops demo timers without losing controls", async () => {
    try {
      await ensure(0);
      await page.evaluate(() => document.querySelector("#services-stage .edit-demo-head button").click());
      await wait(720);
      await page.emulateMedia({ reducedMotion: "reduce" }); await wait(300);
      const frame = await page.locator("#services-stage .edit-preview").getAttribute("data-stage");
      await wait(750);
      assert(await page.locator("#services-stage .edit-preview").getAttribute("data-stage") === frame, "editing preview kept playing");
      assert(/play editing preview/i.test(await page.locator("#services-stage .edit-demo-head button").getAttribute("aria-label")), "editing preview did not pause");

      await page.emulateMedia({ reducedMotion: "no-preference" }); await wait(300);
      await change(1); await wait(100);
      await page.emulateMedia({ reducedMotion: "reduce" }); await wait(300);
      const phase = await page.locator("#services-stage .web-mini").getAttribute("data-phase");
      await wait(950);
      assert(await page.locator("#services-stage .web-mini").getAttribute("data-phase") === phase, "website preview kept advancing");

      await page.emulateMedia({ reducedMotion: "no-preference" }); await wait(300);
      await ensure(3);
      await page.evaluate(() => document.querySelector("#services-stage .workflow-run").click());
      await wait(100); await page.emulateMedia({ reducedMotion: "reduce" }); await wait(250);
      assert(/complete/i.test(await page.locator("#services-stage .workflow-footer").innerText()), "workflow did not settle immediately");
    } finally { await page.emulateMedia({ reducedMotion: "no-preference" }); await wait(400); }
  });
  if (mobile) await test("reduced motion cancels an already-armed idle tour", async () => {
    const fresh = await context.newPage();
    try {
      await fresh.goto(base, { waitUntil: "load" }); await fresh.waitForTimeout(1400);
      await fresh.locator("#services-home").scrollIntoViewIfNeeded();
      await fresh.waitForFunction(() => document.querySelector("#services-home")?.textContent.includes("Auto-tour"), null, { timeout: 2000 });
      await fresh.emulateMedia({ reducedMotion: "reduce" });
      await fresh.waitForTimeout(7500);
      assert(await fresh.locator("#services-stage").getAttribute("data-service") === slugs[0], "idle tour advanced after reduced motion was enabled");
    } finally { await fresh.close(); }
  });
  await test("switching to reduced motion cancels an active film", async () => {
    await ensure(0); await change(1); await wait(40);
    assert((await details()).snapshots === 1, "no film before preference change");
    await page.emulateMedia({ reducedMotion: "reduce" });
    try {
      await page.waitForFunction(() => document.querySelectorAll(".pin-spacer").length === 0 && getComputedStyle(document.querySelector("#start .fc-text > *")).opacity === "1", null, { timeout: 4000 });
      assert((await details()).snapshots === 0, "preference change left a snapshot behind");
      const reducedState = await page.evaluate(() => ({
        pins: document.querySelectorAll(".pin-spacer").length,
        headline: getComputedStyle(document.querySelector("#hero .hl-mask")).clipPath,
        cta: getComputedStyle(document.querySelector("#start .fc-text > *")).opacity,
      }));
      assert(reducedState.pins === 0 && !reducedState.headline.includes("100%") && reducedState.cta === "1", `reduced-motion layout remained pinned or hidden: ${JSON.stringify(reducedState)}`);
      await page.locator("#services-home").scrollIntoViewIfNeeded(); await wait(300);
      await change(2); await wait(80);
      const d = await details();
      assert(d.selected === slugs[2] && d.rendered === slugs[2] && d.snapshots === 0 && !d.film, "reduced-motion selection was animated or out of sync");
    } finally {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      if (!mobile && width >= 900 && height >= 760) await page.waitForFunction(() => document.querySelectorAll(".pin-spacer").length >= 3, null, { timeout: 4000 });
      await wait(600);
    }
  });
}

await test("service tabs remain keyboard operable", async () => {
  await page.locator("#services-home").scrollIntoViewIfNeeded(); await wait(250);
  const tabs = page.locator("#services-home .svc-tab");
  await tabs.nth(0).focus(); await page.keyboard.press("End"); await wait(80);
  assert(await tabs.nth(3).getAttribute("aria-selected") === "true", "End did not select the last service");
  await page.keyboard.press("Home"); await wait(80);
  assert(await tabs.nth(0).getAttribute("aria-selected") === "true", "Home did not select the first service");
});

if (!mobile && !reduced && height < 760) await test("hover previews stay distinct from the committed tab and return cleanly", async () => {
  await ensure(0);
  await page.locator("#services-home .svc-tab").nth(1).hover();
  await page.waitForFunction(() => document.querySelector("#services-stage")?.dataset.renderedService === "web-development", null, { timeout: 2000 });
  const preview = await details();
  assert(preview.selected === slugs[0] && preview.selectedTabs[0] === `svc-tab-${slugs[0]}`, "hover preview changed the committed tab");
  await page.mouse.move(4, 4); await settled(0);
});

if (!mobile && !reduced && width >= 900 && height >= 760) {
  await test("pinned scrolling advances and reverses through the original service order", async () => {
    await wait(1800);
    for (const [progress, index] of [[.1, 0], [.35, 1], [.6, 2], [.85, 3], [.6, 2], [.35, 1], [.1, 0]]) {
      await page.evaluate((p) => {
        const section = document.querySelector("#services-home");
        const spacer = section.parentElement;
        const top = spacer.getBoundingClientRect().top + scrollY;
        const distance = spacer.getBoundingClientRect().height - section.getBoundingClientRect().height;
        window.scrollTo(0, top + distance * p);
      }, progress);
      await wait(400);
      const d = await details();
      assert(d.selected === slugs[index] && d.rendered === slugs[index], `wrong service at ${progress}: ${JSON.stringify(d)}`);
    }
  });
  await test("service signal arrives at the architecture node with scroll", async () => {
    const top = await page.evaluate(() => {
      const section = document.querySelector("#system-architecture");
      const spacer = section.parentElement;
      return spacer.getBoundingClientRect().top + scrollY;
    });
    const sample = async (fraction) => {
      await page.evaluate((y) => window.scrollTo(0, y), top - height * fraction);
      await wait(450);
      return page.evaluate(() => ({
        x: Number(document.querySelector("[data-archetype-packet]")?.getAttribute("cx")),
        offset: Number(document.querySelector("[data-archetype-arrival]")?.style.strokeDashoffset),
      }));
    };
    const first = await sample(.75); const later = await sample(.2);
    assert(first.x >= 0 && later.x > first.x && later.x <= 120, `packet did not advance: ${JSON.stringify({ first, later })}`);
    assert(later.offset < first.offset, `arrival route did not draw: ${JSON.stringify({ first, later })}`);
  });
}

if (!reduced) await test("navigation unmounts an in-flight film cleanly", async () => {
  await page.locator("#services-home").scrollIntoViewIfNeeded(); await wait(700);
  await ensure(0); await change(1); await wait(35);
  assert((await details()).snapshots === 1, "no film before navigation");
  await page.evaluate(() => { location.hash = "#/pricing"; });
  await page.locator("#services-stage").waitFor({ state: "detached", timeout: 3000 });
  assert(await page.locator(".svc-film-snapshot, .svc-film-trace").count() === 0, "film survived route unmount");
  await page.evaluate(() => { location.hash = "#/"; });
  await page.locator("#services-stage").waitFor({ state: "attached", timeout: 3000 });
  await wait(1400); // restored scroll and the home-page refresh can choose the visible tab
  const d = await details();
  assert(d.selected === d.rendered && d.selectedTabs.length === 1 && d.selectedTabs[0] === `svc-tab-${d.selected}` && d.snapshots === 0, `service did not remount cleanly: ${JSON.stringify(d)}`);
});

await test("no browser errors", async () => assert(errors.length === 0, errors.join("; ")));
await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} motion checks passed (${width}×${height}${mobile ? ", touch" : ""}${reduced ? ", reduced motion" : ""}).`);
if (passed !== results.length) process.exitCode = 1;

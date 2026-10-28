/**
 * Landmark-based browser verification for Arche.
 *
 * Start the site first: npm run dev -- --host 0.0.0.0
 *   npm run verify                       # desktop, full interaction pass
 *   MOBILE=1 npm run verify              # touch-sized layout and controls
 *   REDUCED=1 npm run verify             # static/reduced-motion experience
 *   BASE=http://localhost:5174/ FORM_MOCK=1 npm run verify
 *
 * FORM_MOCK expects a server started with a test VITE_WEB3FORMS_ACCESS_KEY;
 * Playwright intercepts that endpoint, so no real enquiry is sent. Set
 * CHROME_PATH / CHROME_LIBS when Playwright's bundled browser is unavailable.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:5173/";
const MOBILE = process.env.MOBILE === "1";
const REDUCED = process.env.REDUCED === "1";
const FORM_MOCK = process.env.FORM_MOCK === "1";
const WIDTH = Number(process.env.W || (MOBILE ? 390 : 1440));
const HEIGHT = Number(process.env.H || (MOBILE ? 844 : 900));
const launch = { args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] };
if (process.env.CHROME_PATH) {
  launch.executablePath = process.env.CHROME_PATH;
  launch.env = { ...process.env, LD_LIBRARY_PATH: process.env.CHROME_LIBS || "" };
}
const browser = await chromium.launch(launch);
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  isMobile: MOBILE,
  hasTouch: MOBILE,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});
await context.addInitScript(() => { try { sessionStorage.setItem("arche:booted", "1"); } catch {} });
const page = await context.newPage();
page.setDefaultTimeout(7000);
const errors = [];
let expectNetworkFailure = false;
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_CLOSED") && !(expectNetworkFailure && /ERR_FAILED/.test(m.text()))) errors.push(`console: ${m.text()}`);
});
const results = [];
function assert(condition, message) { if (!condition) throw new Error(message); }
async function test(name, fn) {
  try { await fn(); results.push({ name, pass: true }); console.log(`✓ ${name}`); }
  catch (e) { results.push({ name, pass: false, detail: e.message }); console.error(`✗ ${name}: ${e.message.split("\n")[0]}`); }
}
const wait = (ms = 500) => page.waitForTimeout(ms);
async function goto(hash = "") {
  const url = `${BASE}${hash}`;
  if (page.url() === url) await page.reload({ waitUntil: "load" });
  else await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await wait(1500); // allow initial ScrollTrigger measurements and intro cleanup
}
async function reveal(selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await wait(500);
}
async function assertNoOverflow() {
  const d = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert(d.actual <= d.viewport + 1, `horizontal overflow: ${d.actual}px > ${d.viewport}px`);
}
async function selectService(index, innerSelector) {
  const tab = page.locator("#services-home .svc-tab").nth(index);
  await tab.click();
  await page.locator(`#services-stage ${innerSelector}`).waitFor({ state: "visible" });
  await wait(REDUCED || MOBILE ? 100 : 1500); // complete the pinned tab's deliberate scroll
}
async function scrollPinned(selector, progress) {
  await page.evaluate(({ selector, progress }) => {
    const section = document.querySelector(selector);
    const parent = section.parentElement;
    const top = parent.getBoundingClientRect().top + window.scrollY;
    const distance = parent.getBoundingClientRect().height - section.getBoundingClientRect().height;
    window.scrollTo(0, top + distance * progress);
  }, { selector, progress });
  await wait(600);
}

await goto();
await test("global: fonts, accessible controls and no horizontal overflow", async () => {
  await assertNoOverflow();
  const fonts = await page.evaluate(() => document.fonts.check('500 40px Archivo') && document.fonts.check('400 12px "JetBrains Mono"'));
  assert(fonts, "local typefaces did not load");
  const unnamed = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => !b.disabled && !b.getAttribute("aria-label") && !b.textContent.trim() && !b.title).length);
  assert(unnamed === 0, `${unnamed} buttons have no accessible name`);
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => document.activeElement !== document.body && getComputedStyle(document.activeElement).outlineStyle !== "none");
  assert(focus, "keyboard focus indicator not visible");
});
if (MOBILE) await test("mobile menu: touch, Escape, focus return and same-route close", async () => {
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.tap(); await wait(750);
  assert(await page.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded") === "true", "mobile menu did not open");
  assert(await page.evaluate(() => document.body.style.overflow) === "hidden", "open menu did not contain the background");
  await page.keyboard.press("Escape"); await wait(100);
  assert(await page.getByRole("button", { name: "Open menu" }).evaluate((el) => el === document.activeElement), "Escape did not return focus to the toggle");
  assert(await page.evaluate(() => document.body.style.overflow) === "", "closing the menu left scrolling locked");
  await menu.tap(); await wait(750);
  await page.locator("nav").first().getByRole("link", { name: "Arche", exact: true }).tap(); await wait(350);
  assert(await page.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded") === "false", "same-route logo did not close the menu");
  assert(await page.evaluate(() => document.body.style.overflow) === "", "same-route navigation left scrolling locked");
});
if (REDUCED) {
  await test("reduced motion: content remains visible without pinned sequences", async () => {
    const state = await page.evaluate(() => ({
      hidden: [...document.querySelectorAll("[data-r]")].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.15 || getComputedStyle(e).clipPath.includes("100%")).length,
      pin: document.querySelectorAll(".pin-spacer").length,
    }));
    assert(state.hidden === 0, `${state.hidden} reveal elements remain hidden`);
    assert(state.pin === 0, `${state.pin} scroll pins remain under reduced motion`);
  });
}

await test("problem: inspect a tool and close with Escape", async () => {
  await reveal("#problem");
  const card = page.getByRole("button", { name: /inspect the website tool/i });
  await card.focus(); await page.keyboard.press("Enter");
  assert(await page.getByText(/entry point — captures intent/i).count() === 1, "tool detail did not open");
  await page.keyboard.press("Escape");
  assert(await page.getByText(/target state · conceptual model/i).count() === 1, "Escape did not close inspection");
});
if (!MOBILE && !REDUCED && WIDTH >= 900 && HEIGHT >= 760) {
  await test("problem: scrolling resolves the request into a connected workflow", async () => {
    await scrollPinned("#problem", 0.99);
    const state = await page.evaluate(() => ({
      text: document.querySelector("#problem").innerText,
      sheet: document.querySelector('#problem [data-card="sheet"]')?.dataset.flip,
      compact: getComputedStyle(document.querySelector(".pf-compact-anchor")).opacity,
    }));
    assert(/one system/i.test(state.text), "resolved system status did not appear");
    assert(state.sheet === "1", "spreadsheet did not resolve with the other tools");
    assert(Number(state.compact) > 0.8, `compact workflow was not revealed (${state.compact})`);
  });
}

await test("video: keyboard scrub and play/pause change the editorial composition", async () => {
  await selectService(0, ".edit-demo");
  const range = page.getByRole("slider", { name: /video timeline scrubber/i });
  await range.focus(); await page.keyboard.press("End");
  assert(await page.locator(".edit-preview").getAttribute("data-stage") === "6", "End did not reach final export");
  assert(/FINAL COMPOSITION/i.test(await page.locator(".edit-preview").innerText()), "final composition label absent");
  await page.getByRole("button", { name: /play editing preview/i }).click();
  if (!REDUCED) {
    await wait(800);
    assert(Number(await page.locator(".edit-preview").getAttribute("data-stage")) > 0, "play did not advance");
    await page.getByRole("button", { name: /pause editing preview/i }).click();
  }
});
await test("web: build phases, miniature navigation and honest visit preview", async () => {
  await selectService(1, ".web-experience");
  const web = page.locator("#services-stage .web-experience");
  await web.getByRole("button", { name: /live/i }).click();
  await web.getByRole("button", { name: "studio", exact: true }).click();
  assert(/Made for/.test(await web.innerText()), "miniature navigation did not change page content");
  await web.getByRole("button", { name: /explore a visit/i }).click();
  assert(/No visit has been booked/i.test(await web.innerText()), "visit did not show the honest local preview");
  await web.getByRole("button", { name: /close visit preview/i }).click();
});
let demoAnswer = "";
await test("agent: shared rules-based lead route and reset", async () => {
  await selectService(2, ".agent-experience");
  const agent = page.locator("#services-stage .agent-experience");
  await agent.getByRole("button", { name: /can you automate lead management/i }).click();
  demoAnswer = (await agent.locator(".agent-experience-answer p").innerText()).trim();
  assert(/lead workflow/i.test(demoAnswer), "lead intent was not matched");
  assert(/WEBSITE.*AGENT.*QUALIFY.*CRM/s.test(await agent.locator(".agent-route").innerText()), "lead route not represented");
  await agent.getByRole("button", { name: "Reset", exact: true }).click();
  assert(await agent.locator(".agent-experience-empty").count() === 1, "reset did not restore empty state");
});
await test("automation: cancel stale runs, complete both modes, and reset", async () => {
  await selectService(3, ".workflow-demo");
  const flow = page.locator("#services-stage .workflow-demo");
  const run = () => flow.getByRole("button", { name: /^run(?: again)?$/i });
  await flow.getByRole("button", { name: "Automated", exact: true }).click();
  await run().click();
  if (!REDUCED) {
    await wait(300);
    await flow.getByRole("button", { name: "Manual", exact: true }).click();
    await wait(750);
    assert(await flow.locator('.workflow-step[data-state="complete"]').count() === 0, "cancelled automatic steps leaked into manual mode");
  }
  await flow.getByRole("button", { name: "Manual", exact: true }).click();
  await run().click();
  await page.waitForFunction(() => document.querySelectorAll('#services-stage .workflow-step[data-state="complete"]').length === 7, null, { timeout: 8000 });
  assert(/Example task ready/i.test(await flow.innerText()), "manual outcome did not populate");
  await flow.getByRole("button", { name: "Reset", exact: true }).click();
  assert(await flow.locator('.workflow-step[data-state="complete"]').count() === 0, "reset did not clear the run");
  await flow.getByRole("button", { name: "Automated", exact: true }).click();
  await run().click();
  await page.waitForFunction(() => document.querySelectorAll('#services-stage .workflow-step[data-state="complete"]').length === 7, null, { timeout: 8000 });
  assert(/SIMULATION · NO LIVE DATA/i.test(await flow.innerText()), "simulation disclosure missing");
  await flow.getByRole("button", { name: "Reset", exact: true }).click();
});

await test("architecture: inspect all five meaningful system states", async () => {
  // Wait for the previous service tab's scroll before leaving its pinned area.
  await wait(1700);
  await reveal("#system-architecture .archetype-node");
  for (const [i, heading] of ["It starts with a question", "Make sense of the signal", "Connect the right pieces", "Turn understanding into action", "A connection becomes momentum"].entries()) {
    const node = page.locator("#system-architecture .archetype-node").nth(i);
    await node.focus(); await page.keyboard.press("Enter");
    assert(await node.getAttribute("aria-pressed") === "true", `node ${i + 1} is not selected`);
    assert((await page.locator(".archetype-detail h3").innerText()).includes(heading), `wrong explanation for node ${i + 1}`);
  }
});
if (!MOBILE && !REDUCED && WIDTH >= 900 && HEIGHT >= 760) {
  await test("architecture: scroll carries the signal all the way to output", async () => {
    await scrollPinned("#system-architecture", 0.995);
    const state = await page.evaluate(() => ({
      x: Number(document.querySelector("#system-architecture svg circle[fill='var(--accent)']")?.getAttribute("cx")),
      selected: document.querySelectorAll('#system-architecture .archetype-node')[4].getAttribute('aria-pressed'),
    }));
    assert(state.selected === "true" && state.x > 1000, `packet did not reach output: ${JSON.stringify(state)}`);
  });
}
await test("connected system: keyboard links, connect all and reset", async () => {
  await reveal("#connected-system");
  const model = page.locator("#connected-system");
  const video = model.getByRole("button", { name: /^video module/i });
  const website = model.getByRole("button", { name: /^website module/i });
  const canvas = model.locator(".select-none").first();
  const canvasBox = await canvas.boundingBox();
  for (const button of await model.getByRole("button", { name: /module —/i }).all()) {
    const rect = await button.boundingBox();
    assert(rect && canvasBox && rect.x >= canvasBox.x && rect.x + rect.width <= canvasBox.x + canvasBox.width, "a module is clipped by the canvas edge");
  }
  if (MOBILE) {
    await video.tap(); await website.tap();
    assert(/2 \/ 4 connections/i.test(await model.innerText()), "touch selection did not connect modules");
    await model.getByRole("button", { name: /^reset$/i }).tap();
  }
  await video.focus(); await page.keyboard.press("Enter");
  assert(await video.getAttribute("aria-pressed") === "true", "keyboard did not select a module");
  await website.focus(); await page.keyboard.press("Enter");
  assert(/2 \/ 4 connections/i.test(await model.innerText()), "compatible keyboard connection did not register");
  if (!MOBILE) {
    await model.getByRole("button", { name: /^reset$/i }).click();
    const from = await video.boundingBox(), to = await website.boundingBox();
    assert(from && to, "module positions unavailable for drag test");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await page.mouse.down();
    await wait(100); await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 }); await wait(150); await page.mouse.up();
    assert(/2 \/ 4 connections/i.test(await model.innerText()), "dragging compatible modules did not connect them");
    await model.getByRole("button", { name: /^reset$/i }).click();
  }
  await model.getByRole("button", { name: /^connect all$/i }).click();
  assert(/example system connected/i.test(await model.innerText()), "complete conceptual model did not appear");
  await model.getByRole("button", { name: /^rearrange$/i }).click();
  assert(/1 \/ 4 connections/i.test(await model.innerText()), "reset did not restore the starting model");
  await assertNoOverflow();
});
await test("work: keyboard-accessible project details are honestly labelled", async () => {
  await reveal('[data-chapter="Work"]');
  const work = page.locator('[data-chapter="Work"]');
  const project = work.getByRole("button", { name: /(open|close) retention edit system details/i });
  await project.focus(); await page.keyboard.press("Enter");
  assert(await project.getAttribute("aria-expanded") === "true", "keyboard did not open the project");
  assert(/not a client case study/i.test(await work.innerText()), "project details did not distinguish conceptual work");
  await project.focus(); await page.keyboard.press("Enter");
  assert(await project.getAttribute("aria-expanded") === "false", "keyboard did not close the project");
});
await test("process and approach: every selected stage has a distinct state", async () => {
  await reveal("#process .pr-step");
  const models = [];
  for (let i = 0; i < 6; i++) {
    const step = page.locator("#process .pr-step").nth(i);
    await step.focus(); await page.keyboard.press("Enter");
    assert(await page.locator("#process .process-model").first().getAttribute("data-state") === String(i), `process stage ${i + 1} did not update`);
    models.push(await page.locator("#process .process-model-foot strong").first().textContent());
  }
  assert(new Set(models).size === 6, "process descriptions are not distinct");
  if (MOBILE) {
    const compact = page.locator("#process .process-model-compact");
    assert(await compact.isVisible(), "mobile process diagram is hidden");
    const bounds = await compact.boundingBox();
    assert(bounds && bounds.y < HEIGHT && bounds.y + bounds.height > 0, "mobile process diagram did not stay with the stages");
  }
  await reveal("#approach .approach-principle");
  for (let i = 0; i < 4; i++) {
    const principle = page.locator("#approach .approach-principle").nth(i);
    await principle.focus(); await page.keyboard.press("Enter");
    assert(await principle.getAttribute("aria-pressed") === "true", `approach ${i + 1} did not activate`);
  }
});
await test("labs: five playable, local sketches with keyboard controls", async () => {
  await reveal("#labs");
  const labs = page.locator("#labs");
  const load = labs.locator(".lab-card-v2").filter({ has: page.getByRole("heading", { name: "Load Balancer", exact: true }) });
  const traffic = load.getByRole("slider", { name: /incoming traffic/i });
  await traffic.focus(); await page.keyboard.press("End");
  await page.waitForFunction(() => {
    const card = [...document.querySelectorAll('#labs .lab-card-v2')].find((el) => /Load Balancer/i.test(el.innerText));
    return /[1-8]\/8 workers active/i.test(card?.innerText || '');
  }, null, { timeout: 4000 });
  await traffic.focus(); await page.keyboard.press("Home");

  const failover = labs.locator(".lab-card-v2").filter({ has: page.getByRole("heading", { name: "Failover", exact: true }) });
  const primary = failover.getByRole("button", { name: /primary node.*click to kill/i });
  await primary.focus();
  assert(await primary.evaluate((el) => getComputedStyle(el).outlineStyle !== "none"), "failover node has no visible keyboard focus");
  await page.keyboard.press("Enter");
  assert(/rerouting through BACKUP/i.test(await failover.innerText()), "failover did not route to backup");
  const backup = failover.getByRole("button", { name: /backup node.*click to kill/i });
  await backup.focus(); await page.keyboard.press("Enter");
  assert(/both nodes down.*no path/i.test(await failover.innerText()), "failover did not report an unavailable route");

  const input = labs.getByRole("textbox", { name: /message to parse/i });
  await input.fill("Need a website for my bakery, budget 50k, contact me at a@b.com");
  assert(/WEBSITE/i.test(await labs.innerText()) && /a@b.com/i.test(await labs.innerText()), "parser did not extract sample fields");
  assert(!/₹50,000/.test(await labs.innerText()), "parser invented a currency");

  const race = labs.locator(".lab-card-v2").filter({ has: page.getByRole("heading", { name: "Manual vs Automated", exact: true }) });
  await race.getByRole("button", { name: /^start$/i }).focus(); await page.keyboard.press("Enter");
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "PROCESS", null, { timeout: 4000 });
    await page.keyboard.press("Enter");
  }
  await race.getByRole("button", { name: /^retry$/i }).waitFor({ state: "visible", timeout: 5000 });
  assert(/game.*not a benchmark/i.test(await race.innerText()), "race timing was not labelled as a game");

  const flow = labs.locator(".lab-card-v2").filter({ has: page.getByRole("heading", { name: "Build a Flow", exact: true }) });
  await flow.getByRole("button", { name: /^run/i }).click();
  assert(/nothing to run/i.test(await flow.innerText()), "empty flow did not report a validation error");
  const add = (name) => flow.getByRole("button", { name: `Add ${name} block` });
  await add("TRIGGER").focus(); await page.keyboard.press("Enter");
  await add("ACTION").focus(); await page.keyboard.press("Enter");
  assert(await flow.locator("[data-block]").count() === 2, "keyboard could not add flow blocks");
  const actionBlock = flow.getByRole("group", { name: /action block/i });
  await actionBlock.focus(); await page.keyboard.press("ArrowLeft");
  assert(/ACTION/.test(await flow.locator("[data-block]").first().innerText()), "keyboard could not reorder blocks");
  await flow.getByRole("button", { name: /^run/i }).click();
  assert(/has to start with a trigger/i.test(await flow.innerText()), "invalid order was not explained");
  await actionBlock.focus(); await page.keyboard.press("ArrowRight");
  await flow.getByRole("button", { name: /remove action block/i }).focus(); await page.keyboard.press("Enter");
  assert(await flow.locator("[data-block]").count() === 1, "keyboard could not remove an individual block");
  await add("ACTION").focus(); await page.keyboard.press("Enter");
  await flow.getByRole("button", { name: /^run/i }).click();
  await page.waitForFunction(() => /example flow complete/i.test(document.querySelector('#labs').innerText), null, { timeout: 4000 });
  await flow.getByRole("button", { name: /^clear$/i }).click();
  if (MOBILE) {
    await add("TRIGGER").tap();
    assert(await flow.locator("[data-block]").count() === 1, "touch could not add a flow block");
  } else {
    const source = await add("CONDITION").boundingBox(), target = await flow.locator(".border-dashed").boundingBox();
    assert(source && target, "flow drag targets unavailable");
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2); await page.mouse.down();
    await wait(100); await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 }); await wait(150); await page.mouse.up();
    assert(await flow.locator("[data-block]").count() === 1, "dragging a palette block did not add it to the flow");
  }
  await assertNoOverflow();
});
await test("ask arche: same resolver, unknown fallback and reset", async () => {
  await reveal("#ask-arche");
  const ask = page.locator("#ask-arche");
  const field = ask.getByRole("textbox", { name: /ask arche/i });
  await field.fill("Can you automate lead management?"); await field.press("Enter");
  const lastAnswer = (await ask.locator(".chat-line").allTextContents()).join(" ").replace(/\s+/g, " ");
  assert(demoAnswer && lastAnswer.includes(demoAnswer.replace(/\s+/g, " ")), "Ask Arche and the agent gave different lead answers");
  await field.fill("What is the weather in Tokyo?"); await field.press("Enter");
  assert(/not sure|not matched|couldn.t match|don.t have/i.test(await ask.innerText()), "unknown question did not get a fallback");
  await ask.getByRole("button", { name: /^reset$/i }).click();
  assert(!(await ask.innerText()).includes("weather in Tokyo"), "conversation reset failed");
});
await test("FAQ: keyboard accordion and panel accessibility", async () => {
  await reveal("#faq");
  const faq = page.locator("#faq");
  const second = faq.getByRole("button", { name: /which services are currently available/i });
  await second.focus(); await page.keyboard.press("Enter");
  assert(await second.getAttribute("aria-expanded") === "true", "FAQ did not expand");
  const panel = await second.getAttribute("aria-controls");
  assert(await page.locator(`#${panel}`).getAttribute("aria-hidden") === "false", "expanded panel is hidden from assistive technology");
  await page.keyboard.press("Enter");
  assert(await second.getAttribute("aria-expanded") === "false", "FAQ did not collapse");
});

await test("navigation: pricing route, browser history and home logo", async () => {
  await goto();
  if (MOBILE) {
    await page.getByRole("button", { name: /open menu/i }).click();
    assert(await page.getByRole("button", { name: /close menu/i }).getAttribute("aria-expanded") === "true", "mobile menu did not open");
    await page.locator('div[aria-hidden="false"] a[href="#/pricing"]').first().click();
  } else {
    await page.locator('nav a[href="#/pricing"]').first().click();
  }
  await page.waitForURL(/#\/pricing$/, { timeout: 5000 });
  await wait(900);
  assert(/Confirm.*proposal/i.test(await page.locator("main").innerText()), "pricing confirmation caveat is missing");
  await page.goBack(); await wait(500);
  assert(!page.url().includes("#/pricing"), "browser back did not return home");
  await page.goForward(); await wait(500);
  assert(page.url().includes("#/pricing"), "browser forward did not return to pricing");
  await page.locator('nav a[href="#/"]').first().click();
  await page.waitForURL(/#\/$/, { timeout: 5000 });
});

await test("work route: filters show the chosen service", async () => {
  await goto("#/work");
  const main = page.locator("main");
  await main.getByRole("button", { name: "AI Chatbots", exact: true }).click();
  const text = await main.innerText();
  assert(/Grounded Support Agent/i.test(text) && !/Retention Edit System/i.test(text), "work filter did not select the chatbot projects");
  await assertNoOverflow();
});
await test("service routes: all four demos and the honest comparison remain usable", async () => {
  for (const [slug, selector] of [["video-editing", ".edit-demo"], ["web-development", ".web-experience"], ["ai-chatbots", ".agent-experience"], ["ai-automation", ".workflow-demo"]]) {
    await goto(`#/services/${slug}`);
    assert(await page.locator(`main ${selector}`).count() === 1, `${slug} demo missing from its service page`);
    await assertNoOverflow();
  }
  const slider = page.getByRole("slider", { name: /compare the example manual/i });
  await slider.focus(); await page.keyboard.press("End"); await wait(600);
  assert(await slider.getAttribute("aria-valuenow") === "100", "comparison slider did not reach its end by keyboard");
  assert(/no live systems were updated/i.test(await page.locator("main").innerText()), "comparison implies a real system update");
});
await test("pricing: a chosen scope carries into the contact flow", async () => {
  await goto("#/pricing");
  const category = page.locator("#web-development");
  await category.getByRole("button", { name: /request this scope/i }).first().click();
  await page.waitForURL(/#\/contact$/, { timeout: 5000 }); await wait(800);
  const continueButton = page.getByRole("button", { name: /continue with website/i });
  assert(await continueButton.count() === 1, "selected service was not carried to contact");
  await continueButton.click(); await wait(650);
  assert(/interested in/i.test(await page.locator("textarea.field").inputValue()), "selected scope was not prefilled");
});

async function fillContact() {
  await page.getByRole("button", { name: /^Website/i }).first().click(); await wait(650);
  await page.locator("textarea.field").fill("Our inquiries arrive in several places and need a clear owner.");
  await page.getByRole("button", { name: /^Continue/i }).first().click(); await wait(650);
  await page.getByRole("button", { name: /1–3 months/i }).first().click(); await wait(650);
  const fields = page.locator("input.field");
  assert(await fields.count() >= 2, "contact details step was not reached");
  await fields.nth(0).fill("A"); await fields.nth(0).blur();
  assert(await page.getByText(/please add a name/i).count() === 1, "name validation did not appear");
  await fields.nth(0).fill("Alex Rivera"); await fields.nth(1).fill("alex@example.com");
}
let sentPayload = null;
let postCount = 0;
await test("contact: four steps, validation and honest delivery state", async () => {
  if (!FORM_MOCK) await context.route("https://api.web3forms.com/submit", (route) => route.fulfill({ status: 400, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ success: false, message: "Verification does not send real enquiries." }) }));
  if (FORM_MOCK) {
    await context.route("https://api.web3forms.com/submit", async (route) => {
      if (route.request().method() === "POST") { postCount += 1; sentPayload = route.request().postDataJSON(); }
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true }) });
    });
  }
  await goto("#/contact");
  await fillContact();
  await page.getByRole("button", { name: /send request/i }).click();
  if (FORM_MOCK) assert(await page.getByRole("button", { name: /sending/i }).isDisabled(), "sending state did not prevent duplicates");
  await wait(700);
  const text = await page.locator("main").innerText();
  if (FORM_MOCK) {
    assert(/request received/i.test(text), "provider-confirmed response did not produce success");
    assert(postCount === 1 && sentPayload?.name === "Alex Rivera" && sentPayload?.email === "alex@example.com" && sentPayload?.building === "Website" && sentPayload?.timeline === "1–3 months" && /clear owner/i.test(sentPayload?.what_needs_to_change), "the complete enquiry was not sent exactly once");
  }
  else {
    assert(/didn't reach us|not connected|email us directly/i.test(text), "unconfigured form did not show its honest fallback");
    assert(!/request received/i.test(text), "unconfigured form falsely claimed delivery");
    const fallback = await page.locator('main a[href^="mailto:"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    assert(fallback.some((href) => href.includes("alex%40example.com")), "email fallback omitted the enquiry details");
  }
  assert(await page.evaluate(() => !Object.keys(localStorage).some((k) => /inquir|lead/i.test(k))), "contact details were stored locally");
});
if (FORM_MOCK) {
  await test("contact: provider rejection never claims delivery", async () => {
    await context.unroute("https://api.web3forms.com/submit");
    await context.route("https://api.web3forms.com/submit", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false }) }));
    await page.reload({ waitUntil: "load" }); await wait(1500); await fillContact();
    await page.getByRole("button", { name: /send request/i }).click(); await wait(700);
    const text = await page.locator("main").innerText();
    assert(/didn't reach us/i.test(text) && !/request received/i.test(text), "rejected provider response appeared successful");
  });
  await test("contact: a network failure offers a real email fallback", async () => {
    await context.unroute("https://api.web3forms.com/submit");
    expectNetworkFailure = true;
    await context.route("https://api.web3forms.com/submit", (route) => route.abort("failed"));
    await page.reload({ waitUntil: "load" }); await wait(1500); await fillContact();
    await page.getByRole("button", { name: /send request/i }).click(); await wait(700);
    const text = await page.locator("main").innerText();
    expectNetworkFailure = false;
    assert(/connection dropped/i.test(text) && /email us directly/i.test(text) && !/request received/i.test(text), "network failure was not handled honestly");
  });
}
await test("runtime: no browser errors", async () => { assert(errors.length === 0, errors.join(" | ")); });

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed (${WIDTH}×${HEIGHT}${MOBILE ? ", touch" : ""}${REDUCED ? ", reduced motion" : ""}).`);
if (failed.length) {
  for (const f of failed) console.error(`\n${f.name}: ${f.detail}`);
  process.exitCode = 1;
}

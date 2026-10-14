import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..", "out");
const basePath = "/tailor-cricket-academy-site";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".md": "text/markdown", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".glb": "model/gltf-binary", ".webm": "video/webm", ".vtt": "text/vtt" };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (!pathname.startsWith(`${basePath}/`)) { response.writeHead(404).end(); return; }
  let file = path.resolve(root, `.${pathname.slice(basePath.length)}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== root) { response.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT") response.writeHead(404).end();
    else { console.error(error); response.writeHead(500).end(); }
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const localUrl = `${origin}${basePath}/`;
const url = process.env.PAGES_TEST_URL ?? localUrl;
const browser = await chromium.launch({ headless: true, ...(process.env.PAGES_TEST_CHANNEL ? { channel: process.env.PAGES_TEST_CHANNEL } : {}), args: ["--disable-gpu"] });
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith(new URL(url).origin) && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  const apiRequests = [];
  page.on("request", request => { if (request.url().includes("/api/")) apiRequests.push(request.url()); });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    };
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector('.coach-scroll-backdrop[data-scroll-ready="true"]');
  assert.match(await page.title(), /Tailor Cricket Academy/);
  assert.equal(await page.locator(".media-edit-button, .media-admin-bar, form").count(), 0);
  const coach = page.locator(".coach-subject");
  await coach.locator("img").evaluate(image => image.decode());
  const before = await coach.getAttribute("style");
  await page.evaluate(() => window.scrollTo({ top: innerHeight, behavior: "instant" }));
  await page.waitForFunction(old => document.querySelector(".coach-subject").getAttribute("style") !== old, before);
  await page.locator("#home").getByRole("button", { name: "Book a trial session" }).click();
  await page.getByRole("dialog").getByText("Enquiries and bookings are not available", { exact: false }).waitFor();
  assert.equal(await page.locator("form, input, textarea").count(), 0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Ground photo", exact: true }).click();
  await page.getByRole("dialog").locator("img").evaluate(image => image.decode());
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Play Watch the setup" }).click();
  await page.locator("video").evaluate(async video => { video.muted = true; await video.play(); });
  await page.waitForFunction(() => document.querySelector("video").currentTime > 0.1);
  await page.keyboard.press("Escape");
  await page.locator("#home").getByRole("button", { name: "Enter the crease", exact: false }).click();
  assert.equal(new URL(page.url()).pathname, `${basePath}/`);
  await page.getByRole("button", { name: "Skip intro" }).click();
  for (const route of ["privacy", "terms", "credits", "editor", "simulator"]) {
    const response = await page.goto(`${url}${route}/`, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200, route);
    await page.getByRole("heading", { level: 1 }).waitFor();
    if (route === "simulator") await page.getByText("3D view unavailable", { exact: false }).first().waitFor();
  }
  await page.getByRole("button", { name: "Replay the cricket experience", exact: false }).click();
  await page.getByRole("button", { name: "Skip intro" }).waitFor();
  assert.equal(new URL(page.url()).pathname, `${basePath}/`);
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.goto(url);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
  const links = await page.locator('a[href^="/"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute("href")));
  assert.ok(links.every(link => link.startsWith(`${basePath}/`)), JSON.stringify(links));
  for (const file of ["images/coach-depth.webp", "images/coach-ground.webp", "models/crease-player.glb", "models/cricketer.glb", "media/cricket-sample.vtt", "Tailor-Cricket-Academy.md"]) {
    assert.equal((await page.request.get(`${url}${file}`)).status(), 200, file);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".coach-subject")).transform === "none");
  assert.deepEqual(apiRequests, []);
  assert.deepEqual(failures, []);
  console.log("PASS: public routes, base-path links/assets, coach motion, read-only forms, gallery, video, intro replay, simulator fallback and responsive layouts.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

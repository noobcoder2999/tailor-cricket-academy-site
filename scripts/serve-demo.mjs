import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";

const root = await realpath(path.resolve(import.meta.dirname, "..", "out"));
const base = "/tailor-cricket-academy-site";
const port = Number(process.env.DEMO_PORT || 3010);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("DEMO_PORT must be between 1024 and 65535.");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".glb": "model/gltf-binary", ".webm": "video/webm", ".mp4": "video/mp4", ".vtt": "text/vtt", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("X-Tailor-Demo", "read-only-v1");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405, { Allow: "GET, HEAD" }).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end("Invalid path"); return; }
  if (pathname === "/" || pathname === base) { response.writeHead(302, { Location: `${base}/` }).end(); return; }
  if (!pathname.startsWith(`${base}/`) || pathname.includes("\\") || pathname.split("/").some(part => part.startsWith("."))) {
    response.writeHead(404).end("Not found"); return;
  }
  const relative = pathname.slice(base.length + 1);
  if (/^(api|editor)(\/|$)/.test(relative)) { response.writeHead(404).end("Not available in the client demo"); return; }
  try {
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) { response.writeHead(404).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    file = await realpath(file);
    if (!file.startsWith(`${root}${path.sep}`) || !types[path.extname(file)]) { response.writeHead(404).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404).end(); return; }
    response.setHeader("Content-Type", types[path.extname(file)]);
    response.setHeader("Accept-Ranges", "bytes");
    let start = 0, end = info.size - 1, status = 200;
    if (request.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!range || (!range[1] && !range[2])) { response.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end(); return; }
      start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start < 0) {
        response.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end(); return;
      }
      status = 206;
      response.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
    }
    response.setHeader("Content-Length", Math.max(0, end - start + 1));
    response.writeHead(status);
    if (request.method === "HEAD" || info.size === 0) { response.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on("error", error => { console.error("DEMO_FILE_READ_FAILED", error.code); response.destroy(); });
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") response.writeHead(404).end("Not found");
    else { console.error("DEMO_REQUEST_FAILED", error.code); response.writeHead(500).end("Demo file unavailable"); }
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Read-only demo: http://127.0.0.1:${port}${base}/`));
server.on("error", error => { console.error(error); process.exitCode = 1; });

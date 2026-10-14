const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]);
export function isLocalRequest(request: Request, requireOrigin = false) {
  const host = request.headers.get("host");
  if (!host) return false;
  let hostUrl: URL;
  try { hostUrl = new URL(`http://${host}`); } catch { return false; }
  if (!loopback.has(hostUrl.hostname) || hostUrl.username || hostUrl.password || hostUrl.pathname !== "/") return false;
  if (!loopback.has(new URL(request.url).hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return !requireOrigin;
  try {
    const url = new URL(origin);
    return loopback.has(url.hostname) && url.host === hostUrl.host && ["http:", "https:"].includes(url.protocol) && url.origin === origin;
  } catch { return false; }
}

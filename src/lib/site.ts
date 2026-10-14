import type { MediaState } from "./media-schema";

export const basePath = "/tailor-cricket-academy-site";
export const siteUrl = `https://noobcoder2999.github.io${basePath}/`;
export const publicMedia: MediaState = { revision: "public-read-only", photos: [], videos: [] };

export function sitePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}

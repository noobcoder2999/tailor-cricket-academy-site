export const basePath = "/tailor-cricket-academy-site";
export const siteUrl = `https://noobcoder2999.github.io${basePath}/`;

export function sitePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}

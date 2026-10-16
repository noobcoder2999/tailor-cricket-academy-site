import type { MetadataRoute } from "next";
import { basePath, siteUrl } from "../lib/site";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: `${basePath}/`, disallow: [`${basePath}/editor/`, `${basePath}/api/`] }, sitemap: new URL("sitemap.xml", siteUrl).toString() };
}

import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/site";
import { coachingGuide } from "../content/journal";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "privacy/", "terms/", "credits/", "simulator/", `${coachingGuide.path.slice(1)}/`].map(path => ({ url: new URL(path, siteUrl).toString() }));
}

import type { Metadata, Viewport } from "next";
import { academy, images } from "../content/academy";
import "./globals.css";
import "./pavilion.css";
import "./academy-editing.css";
import "./coach-scroll.css";
import "./public-preview.css";
import "./ball-details.css";
import ContactBall from "../components/ContactBall";
import { siteUrl, sitePath } from "../lib/site";
import { publicMedia } from "../lib/public-media";
import { MediaEditingProvider } from "../components/MediaEditing";
import { PageMotionProvider } from "../components/PageMotion";
import EnquiryDialog from "../components/EnquiryDialog";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: `${academy.name} | Find your game`, template: `%s | ${academy.name}` },
  description: academy.description,
  icons: { icon: images.crest },
  robots: { index: false, follow: false },
  openGraph: { title: academy.name, description: "An independent cricket academy website concept. Develop your game, from first steps to performance.", type: "website", ...(siteUrl ? { url: siteUrl } : {}) }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#25382b" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PageMotionProvider><MediaEditingProvider initial={publicMedia} editable={false}><a className="skip-link" href="#main-content">Skip to main content</a>{children}<aside className="public-edition-notice" aria-label="Public edition">Public preview · No bookings or uploads <a href={sitePath("/Tailor-Cricket-Academy.md")} download>Download guide</a></aside><ContactBall /><EnquiryDialog mode="public-preview" /></MediaEditingProvider></PageMotionProvider></body></html>;
}

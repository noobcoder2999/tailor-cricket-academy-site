import type { Metadata } from "next";
import Link from "../../../components/SiteLink";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { academy } from "../../../content/academy";
import { coachingGuide } from "../../../content/journal";
import { siteUrl } from "../../../lib/site";

export const metadata: Metadata = {
  title: coachingGuide.title,
  description: coachingGuide.description,
  alternates: { canonical: new URL(`${coachingGuide.path.slice(1)}/`, siteUrl).toString() },
  openGraph: { type: "article", title: coachingGuide.title, description: coachingGuide.description }
};

export default function CoachingGuide() {
  return <><Header /><main id="main-content" className="legal-page journal-page">
    <nav aria-label="Breadcrumb"><Link href="/#home">Home</Link><span aria-hidden="true"> / </span><Link href="/#journal">Cricket journal</Link></nav>
    <article>
      <header><p className="eyebrow">CRICKET COACHING / JAIPUR</p><h1>{coachingGuide.title}</h1><p className="journal-byline">{academy.name} · Player guide</p><p className="lead">{coachingGuide.introduction}</p></header>
      {coachingGuide.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <aside className="journal-next"><h2>Explore a pathway at Tailor</h2><p>Browse the nine programs or speak with the academy about coaching in Sanganer, Jaipur. Session availability and suitability require confirmation.</p><div className="button-row"><Link href="/#programs" className="button button-dark">Explore programs</Link><Link href="/#contact" className="text-link">Contact the academy ↗</Link></div></aside>
    </article>
  </main><Footer /></>;
}

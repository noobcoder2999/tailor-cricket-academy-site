import Link from "./SiteLink";
import { coachingGuide } from "../content/journal";
import { SectionHeading } from "./ui";

export default function CricketJournal() {
  return <section id="journal" className="section cricket-journal">
    <SectionHeading eyebrow="THE CRICKET JOURNAL / JAIPUR" title={<>Find your focus.<br /><em>Build your game.</em></>} text="Practical guidance for players and families exploring cricket coaching in Sanganer and across Jaipur." />
    <article className="journal-card"><div><p className="eyebrow">COACHING & PLAYER DEVELOPMENT</p><h3>{coachingGuide.title}</h3><p>{coachingGuide.description}</p></div><Link href={coachingGuide.path} className="text-link">Read the guide <span aria-hidden="true">↗</span></Link></article>
  </section>;
}

import { EditPhotoButton, SiteImage } from "./MediaEditing";
import Link from "./SiteLink";
import { academy, images, navigation, programs } from "../content/academy";
import { ReplayIntro } from "./ui";
import AcademyContact from "./AcademyContact";

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-top">
      <div><Link className="brand footer-brand" href="/#home"><SiteImage slotId="brand-logo" src={images.crest} alt="" width={48} height={56} /><span>{academy.shortName}<small>CRICKET ACADEMY</small></span></Link><EditPhotoButton slotId="brand-logo" label="Footer logo" /><p>A place to find your game.<br />A community to grow with.</p><ReplayIntro /></div>
      <div><h2>Explore</h2>{navigation.map(([id, label]) => <Link href={`/#${id}`} key={id}>{label}</Link>)}</div>
      <div><h2>At the crease</h2>{programs.filter(p => ["beginner", "batting", "fast-bowling", "spin", "girls", "high-performance"].includes(p.id)).map(p => <Link href="/#programs" key={p.id}>{p.title}</Link>)}</div>
      <div><h2>Stay connected</h2><AcademyContact />{academy.contact.socials.length ? academy.contact.socials.map(s => <a href={s.url} key={s.label} rel="noopener noreferrer">{s.label} ↗</a>) : <p>Social profiles not configured.</p>}<Link href="/#contact">About this read-only preview ↗</Link></div>
    </div>
    <div className="footer-wordmark" aria-hidden="true">{academy.shortName.toUpperCase()}</div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {academy.name} · Fictional concept</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/credits">Media credits</Link></div></div>
  </footer>;
}

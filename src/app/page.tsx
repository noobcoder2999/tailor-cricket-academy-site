import Image from "next/image";
import { academy, achievements, images, testimonials } from "../content/academy";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Programs from "../components/Programs";
import { Gallery, VideoLibrary } from "../components/MediaLibrary";
import Tournaments from "../components/Tournaments";
import EnquiryForm from "../components/EnquiryForm";
import Counter from "../components/Counter";
import { Reveal, SectionHeading } from "../components/ui";
import CricketIntro from "../components/intro/CricketIntro";
import CricketHero from "../components/CricketHero";
import CoachScrollBackdrop from "../components/CoachScrollBackdrop";
import PlayerStories from "../components/PlayerStories";
import Coaches from "../components/Coaches";
import { TeamProfiles, MeetingMoments } from "../components/OwnerSections";
import { sitePath, siteUrl } from "../lib/site";
import { publicMedia } from "../lib/public-media";
import { EditPhotoButton, SiteImage, PhotoCredit } from "../components/MediaEditing";
import Facilities from "../components/Facilities";
import AcademyContact from "../components/AcademyContact";
import CricketJournal from "../components/CricketJournal";

export const dynamic = "force-static";
export const metadata = { alternates: { canonical: siteUrl } };
export default async function Home() {
  const mode = "public-preview";
  const media = publicMedia;
  const editable = false;
  return <>
    <Header />
    <main id="main-content" className="coach-scroll-site" tabIndex={-1}>
      <CoachScrollBackdrop />
      <CricketHero photos={media.photos.filter(p => p.target === "hero")} editable={editable} />
      <div className="intro-strip match-ribbon"><p className="sr-only">Play with intent. Train with fire. Belong to the game. All abilities, every ambition.</p><div className="ribbon-track" aria-hidden="true">{[0, 1].map(copy => <span key={copy}>PLAY WITH INTENT <b>✳</b> TRAIN WITH FIRE <b>✳</b> BELONG TO THE GAME <b>✳</b> ALL ABILITIES. EVERY AMBITION. <b>✳</b></span>)}</div></div>
      <div className="concept-notice">Public read-only preview. No enquiries, bookings or uploads are accepted here. {academy.sampleNotice} <a href={sitePath("/credits/")}>About the sample media ↗</a></div>
      <section id="about" className="section about-section"><Reveal className="about-copy"><SectionHeading eyebrow="01 / THE TAILOR WAY" title={<>Cricket is the start.<br /><em>Character is the legacy.</em></>} /><p className="lead">{academy.description}</p><p>{academy.history}</p><div className="about-points"><div><h3>Our mission</h3><p>{academy.mission}</p></div><div><h3>Our vision</h3><p>{academy.vision}</p></div></div><details className="editorial-details"><summary>Our philosophy & player development</summary><p>{academy.philosophy}</p><p>Players aged 6-80 are grouped by readiness, experience and training goals. Early sessions prioritise fun and movement; later pathways introduce tactical work and individual reviews. All pathways are illustrative.</p></details><div className="values">{academy.values.map(value => <span key={value}>{value}</span>)}</div></Reveal><div className="about-visual"><div className="about-photo"><SiteImage slotId="about" src={images.nets} alt="Sunlit practice nets at Bayford Cricket Club, used as a sample training setting" fill sizes="(max-width: 800px) 100vw, 45vw" /><EditPhotoButton slotId="about" label="About photo" className="media-edit-overlay" /></div><blockquote><span className="quote-mark">“</span>{academy.founder.message}<cite>{academy.founder.name} <small>Sample founder · fictional identity</small></cite></blockquote><p className="sample-note"><PhotoCredit slotId="about" fallback="Illustrative venue · Acabashi / CC BY-SA 4.0" /></p></div></section>
      <Coaches photos={media.photos.filter(p => p.target === "coach")} />
      <TeamProfiles photos={media.photos.filter(p => p.target === "staff")} editable={editable} />
      <section id="programs" className="section"><div className="heading-row"><SectionHeading eyebrow="03 / CRICKET COACHING IN JAIPUR" title={<>Start where you are.<br /><em>See how far you can go.</em></>} /><p>Nine ways to develop your game.<br />One commitment to your potential.</p></div><Programs /></section>
      <CricketJournal />
      <section className="coach-interlude" aria-labelledby="coach-interlude-title"><p className="eyebrow">THE WORK BETWEEN THE HIGHLIGHTS</p><h2 id="coach-interlude-title">No shortcuts.<br /><em>Just good cricket.</em></h2><a href="#trial" className="coach-text-link">Take the next step <span aria-hidden="true">↗</span></a></section>
      <section id="facilities" className="section facilities-section"><SectionHeading light eyebrow="04 / THE RIGHT ENVIRONMENT" title={<>Room to practise.<br /><em>Space to dream.</em></>} text="Explore the spaces behind your training. The area cards are ready for the owner's own photographs; amenities remain proposed until confirmed." /><div className="facility-feature"><SiteImage slotId="facilities" src={images.pavilion} alt="Sample clubhouse and green outfield at Walker Cricket Ground" fill sizes="100vw" /><div><span className="eyebrow">THE HEART OF THE CLUB</span><h3>Where every innings<br />feels like home.</h3></div><EditPhotoButton slotId="facilities" label="Facilities ground" className="media-edit-overlay" /></div><Facilities /></section>
      <section id="videos" className="section"><SectionHeading eyebrow="05 / WATCH. UNDERSTAND. IMPROVE." title={<>The game, <em>in focus.</em></>} text="Choose a category, play a lesson or read its transcript. Owner-provided recordings are labeled; remaining sample clips are licensed archival examples, not academy lessons." /><VideoLibrary /></section>
      <section id="achievements" className="section achievements-section"><SectionHeading light eyebrow="06 / MILESTONES THAT MATTER" title={<>Small steps.<br /><em>Remarkable journeys.</em></>} text={media.photos.some(photo => photo.target === "achievement") ? "Milestones documented by the academy owner. Photographs, names and achievement details are owner-supplied." : "Every number represents a story — once real academy records are supplied. All figures and awards below are demonstration data, not real achievements."} />{media.photos.some(photo => photo.target === "achievement") ? <div className="moments-grid owner-awards">{media.photos.filter(photo => photo.target === "achievement").map(photo => <figure key={photo.id}><div className="moment-photo"><Image src={photo.src} alt={photo.alt} fill unoptimized sizes="(max-width:650px) 100vw, 50vw" /><EditPhotoButton target="achievement" photoId={photo.id} label={photo.name} className="media-edit-overlay" /></div><figcaption><span className="eyebrow">{photo.role || "Academy milestone"}</span><h3>{photo.name}</h3><p>{photo.caption}</p><p className="sample-note">Owner-documented · Photo: {photo.credit}</p></figcaption></figure>)}</div> : <><div className="stats">{achievements.metrics.map(metric => <Counter key={metric.label} {...metric} />)}</div><div className="awards">{achievements.awards.map(award => <article key={award.title}><span className="award-icon" aria-hidden="true">♜</span><div><span className="eyebrow">{award.year} · SAMPLE</span><h3>{award.title}</h3><p>{award.detail}</p></div></article>)}</div></>}{editable && <EditPhotoButton target="achievement" label="Add achievement photo" />}</section>
      <MeetingMoments photos={media.photos.filter(p => p.target === "moment")} editable={editable} />
      <PlayerStories />
      <section id="tournaments" className="section section-sand"><SectionHeading eyebrow="08 / TAKE IT TO THE MIDDLE" title={<>Train with purpose.<br /><em>Play with heart.</em></>} text="Fixtures, results and the thrill of match day. These are populated demonstration events, not actual competitions." /><Tournaments /></section>
      <section id="gallery" className="section"><SectionHeading eyebrow="09 / LIFE AT TAILOR" title={<>The moments<br /><em>between the milestones.</em></>} /><Gallery /></section>
      <section id="testimonials" className="section section-sand"><SectionHeading eyebrow="10 / VOICES FROM THE BOUNDARY" title={<>A shared love<br /><em>for the game.</em></>} text="All quotations and identities are sample placeholders. Replace only with verified testimonials and permission." /><div className="testimonial-grid">{testimonials.map(testimonial => <figure key={testimonial.name}><span className="quote-mark" aria-hidden="true">“</span><blockquote>{testimonial.quote}</blockquote><figcaption><strong>{testimonial.name}</strong><span>{testimonial.role} · Sample testimonial</span></figcaption></figure>)}</div></section>
      <section id="trial" className="section trial-section"><div className="trial-copy"><p className="eyebrow">11 / YOUR NEXT INNINGS</p><h2>It starts with<br /><em>showing up.</em></h2><p className="lead">Explore the possibilities.<br />Find a place to begin.</p><ol className="trial-steps"><li><span>01</span><div><h3>Explore a program</h3><p>Read the sample pathways and training goals.</p></div></li><li><span>02</span><div><h3>Imagine your next step</h3><p>A real academy would discuss suitability and availability with you.</p></div></li><li><span>03</span><div><h3>Know the difference</h3><p>This preview does not offer or arrange actual sessions.</p></div></li></ol><p className="sample-note">Read-only public edition: no registration or personal information is collected.</p></div><div className="trial-form-card"><EnquiryForm mode={mode} /></div></section>
      <section id="contact" className="section contact-section"><div><SectionHeading eyebrow="12 / THE CONVERSATION STARTS HERE" title={<>There&apos;s a place<br /><em>for you here.</em></>} /><AcademyContact expanded /><div className="map-placeholder"><span className="map-marker" aria-hidden="true">⌖</span><strong>Your route to the crease</strong><p>Map location not configured.<br />No location data is shared with a map provider.</p></div></div><div className="contact-form-card"><h3>About this preview</h3><EnquiryForm kind="contact" mode={mode} /></div></section>
    </main><Footer /><CricketIntro autoPlay={false} />
  </>;
}

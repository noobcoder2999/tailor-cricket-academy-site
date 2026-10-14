import type { PhotoRecord } from "../lib/media-schema";
import HeroMedia from "./HeroMedia";
import { MotionToggle } from "./PageMotion";
import { EnquireButton, ReplayIntro } from "./ui";
import { academy } from "../content/academy";
import { EditPhotoButton, PhotoCredit } from "./MediaEditing";

export default function CricketHero({ photos, editable }: { photos: PhotoRecord[]; editable: boolean }) {
  return <section id="home" className="coach-hero-sequence" aria-labelledby="hero-title">
    <div className="coach-chapter coach-opening">
      <div className="coach-edition"><span><i /> FROM THE GROUND UP</span><span>CRICKET. CHARACTER. COMMUNITY.</span></div>
      <h1 id="hero-title" className="coach-wordmark">{academy.shortName.toUpperCase()}<span className="sr-only"> Cricket Academy</span><span aria-hidden="true" className="coach-wordmark-dot">.</span></h1>
      <div className="coach-opening-copy">
        <p className="eyebrow">A COACH IN YOUR CORNER.</p>
        <h2>Great cricket.<br />Starts with <em>belief.</em></h2>
        <p>On the field. In the moment. Behind every player.<br />Find your game, one ball at a time.</p>
        <div className="button-row"><EnquireButton className="button button-cream">Book a trial session</EnquireButton><a href="#programs" className="coach-text-link">Explore programs <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="coach-photo-tag"><span className="coach-live-dot" /> THE COACH&apos;S PERSPECTIVE <small>ON THE GROUND / IN YOUR CORNER</small></div>
      <div className="coach-photo-controls"><EditPhotoButton slotId="coach-scene" label="Immersive coach photo" /><MotionToggle /></div>
      <div className="coach-opening-bottom"><a href="#coach-approach" className="coach-scroll-cue"><span aria-hidden="true">↓</span> SCROLL INTO THE SESSION</a><div><a href="#about">Skip to the academy</a><ReplayIntro label="Enter the crease" /></div><span className="coach-chapter-count">01 <i>/ 03</i></span></div>
    </div>
    <div id="coach-approach" className="coach-chapter coach-approach">
      <div className="coach-story-copy"><p className="eyebrow"><span>02</span> / THE ART OF GETTING BETTER</p><h2>Small details.<br /><em>Big difference.</em></h2><p>A quieter head. A better balance. That one adjustment that makes the next ball feel different.</p><p>Purposeful practice, with someone who sees the player you can become.</p><div className="coach-session-notes"><span>01 / WATCH CLOSELY</span><span>02 / FIND YOUR RHYTHM</span><span>03 / GO AGAIN</span></div></div>
      <span className="coach-margin-note" aria-hidden="true">LESS NOISE. MORE CRICKET.</span>
    </div>
    <div className="coach-chapter coach-invitation">
      <div className="coach-story-copy"><p className="eyebrow"><span>03</span> / YOUR NEXT INNINGS</p><h2>Not just a session.<br /><em>A starting point.</em></h2><p>First-time player or finding your next level. There is a place to begin, and a reason to keep going.</p><div className="button-row"><EnquireButton className="button button-cream">Find your starting point</EnquireButton><a href="#coaches" className="coach-text-link">Meet the coaches <span aria-hidden="true">↗</span></a></div></div>
      <div className="coach-ground-card"><div className="coach-ground-card-image"><HeroMedia photos={photos} editable={editable} /></div><div className="coach-ground-caption"><span>IT ALL STARTS AT THE GROUND.</span><a href="#facilities">Explore the facilities ↗</a></div></div>
      <p className="coach-scene-credit"><PhotoCredit slotId="coach-scene" fallback="Coach photograph supplied by the academy. A layered still image, brought to life by your scroll." /></p>
    </div>
  </section>;
}

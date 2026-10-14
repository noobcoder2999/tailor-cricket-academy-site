import { successStories } from "../content/academy";
import { EditPhotoButton, SiteImage } from "./MediaEditing";
import { ProfileCard } from "./PageMotion";
import { SectionHeading } from "./ui";

export default function PlayerStories() {
  return <section id="success" className="section players-section">
    <SectionHeading eyebrow="07 / THE NEXT GENERATION" title={<>Not born ready.<br /><em>Built, ball by ball.</em></>} text="Every player's path is different. These fictional stories show the possibilities, not verified selections or testimonials. Replacing a photo does not verify its story." />
    <div className="success-grid">{successStories.map((player, index) => <ProfileCard key={player.name} index={index} className="success-card">
      <div className="success-photo"><SiteImage slotId={`success:${player.name}`} src={player.image} alt="Original player silhouette placeholder" fill sizes="(max-width: 650px) 100vw, 33vw" /><span>{player.age} / {player.role}</span><EditPhotoButton slotId={`success:${player.name}`} label={`${player.name} player story`} className="media-edit-overlay" /></div>
      <span className="eyebrow">FICTIONAL PLAYER STORY</span><h3>{player.name}</h3><p className="achievement-label">{player.achievement}</p><blockquote>&ldquo;{player.quote}&rdquo;</blockquote><p className="sample-note">Coach&apos;s comment: {player.coach}</p>
    </ProfileCard>)}</div>
  </section>;
}

import Image from "next/image";
import type { PhotoRecord } from "../lib/media-schema";
import { SectionHeading } from "./ui";
import { EditPhotoButton } from "./MediaEditing";

export function TeamProfiles({ photos, editable }: { photos: PhotoRecord[]; editable: boolean }) {
  return <section id="staff" className="section team-section"><SectionHeading eyebrow="THE TEAM BEHIND THE TEAM" title={<>Good people.<br /><em>A stronger academy.</em></>} text="The coaches, support staff and people who make every training day possible." />
    {photos.length ? <div className="coach-grid">{photos.map(photo => <article className="coach-card" key={photo.id}><div className="coach-photo"><Image src={photo.src} alt={photo.alt} fill unoptimized sizes="(max-width:650px) 100vw, 33vw" /><EditPhotoButton target="staff" photoId={photo.id} label={photo.name} className="media-edit-overlay" /></div><p className="eyebrow">{photo.role || "Academy team"}</p><h3>{photo.name}</h3><p>{photo.caption}</p><p className="sample-note">Owner-supplied profile · Photo: {photo.credit}</p></article>)}</div> : <div className="owner-empty"><span className="eyebrow">YOUR PEOPLE BELONG HERE</span><h3>Introduce the team behind every session.</h3><p>No staff identities or portraits have been supplied. Add your real team&apos;s photos, roles and short biographies here.</p></div>}
    {editable && <EditPhotoButton target="staff" label="Add staff photo" />}
  </section>;
}
export function MeetingMoments({ photos, editable }: { photos: PhotoRecord[]; editable: boolean }) {
  return <section id="coach-moments" className="section section-sand"><SectionHeading eyebrow="MOMENTS WITH THE GAME'S FINEST" title={<>Shared frames.<br /><em>Lasting inspiration.</em></>} text="A place for genuine photographs of your coaches with Indian players — with accurate names, occasions and credits. A photograph does not imply a professional association or endorsement." />
    {photos.length ? <div className="moments-grid">{photos.map(photo => <figure key={photo.id}><div className="moment-photo"><Image src={photo.src} alt={photo.alt} fill unoptimized sizes="(max-width:650px) 100vw, 50vw" /><EditPhotoButton target="moment" photoId={photo.id} label={photo.name} className="media-edit-overlay" /></div><figcaption><span className="eyebrow">{photo.role || "Owner-documented moment"}</span><h3>{photo.name}</h3><p>{photo.caption}</p><span className="sample-note">Owner-supplied identification · Photo: {photo.credit}</span></figcaption></figure>)}</div> : <div className="owner-empty moment-empty"><div className="photo-frame-mark" aria-hidden="true">＋</div><div><h3>Your real cricket memories, not invented claims.</h3><p>No coach-player meeting photographs have been supplied yet. Upload the actual photo, identify the people and add the event/date. We have not fabricated a meeting or composited a coach beside a player.</p></div></div>}
    {editable && <EditPhotoButton target="moment" label="Add coach & player photo" />}
  </section>;
}

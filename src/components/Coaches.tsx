import Image from "next/image";
import { coaches } from "../content/academy";
import type { PhotoRecord } from "../lib/media-schema";
import { SectionHeading } from "./ui";
import { EditPhotoButton } from "./MediaEditing";
import { MotionToggle, ProfileCard } from "./PageMotion";

export default function Coaches({ photos }: { photos: PhotoRecord[] }) {
  const profiles = coaches.map(coach => {
    const photo = photos.filter(p => p.profileId === coach.id).at(-1);
    return { ...coach, name: photo?.name ?? coach.name, role: photo ? photo.role || "Coach" : coach.role, photo: photo?.src ?? coach.photo, bio: photo?.caption ?? coach.bio, ownerPhoto: photo };
  });
  return <section id="coaches" className="section coach-section"><div className="profile-section-top"><SectionHeading eyebrow="02 / IN YOUR CORNER" title={<>Good players.<br /><em>Great people.</em></>} text="A little belief. A different perspective. The right person in your corner. Get to know the people behind your next breakthrough." /><MotionToggle /></div>
    <div className="coach-grid">{profiles.map((coach, index) => <ProfileCard className={`coach-card ${coach.ownerPhoto ? "owner-coach" : ""}`} index={index} key={coach.id}>
      <div className="coach-photo"><Image src={coach.photo} alt={coach.ownerPhoto?.alt ?? `Illustration placeholder for ${coach.name}; not a photograph`} fill unoptimized={Boolean(coach.ownerPhoto)} sizes="(max-width: 650px) 100vw, 33vw" /><span className="profile-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="image-pill">{coach.ownerPhoto ? "OWNER-SUPPLIED PROFILE" : "SAMPLE IDENTITY"}</span><EditPhotoButton label={coach.name} target="coach" profileId={coach.id} photoId={coach.ownerPhoto?.id} className="media-edit-overlay" /></div>
      <div className="profile-copy">
      <p className="eyebrow">{coach.role}</p><h3>{coach.name}</h3><p>{coach.ownerPhoto ? coach.ownerPhoto.caption : coach.specialization}</p>
      <details><summary>Meet the coach <span aria-hidden="true">+</span></summary><p>{coach.bio}</p>{coach.ownerPhoto ? <p className="sample-note">Photo: {coach.ownerPhoto.credit}. Experience and qualifications must be supplied and verified by the owner.</p> : <><p>{coach.experience}</p><p>{coach.qualifications}</p></>}{coach.contact ? <a href={coach.contact}>Contact coach ↗</a> : <p className="sample-note">Coach contact is not configured.</p>}</details>
      </div>
    </ProfileCard>)}
    {photos.filter(photo => photo.profileId === "new").map((photo, index) => <ProfileCard className="coach-card owner-coach" index={index + profiles.length} key={photo.id}><div className="coach-photo"><Image src={photo.src} alt={photo.alt} fill unoptimized sizes="(max-width:650px) 100vw, 33vw" /><span className="profile-number" aria-hidden="true">{String(index + profiles.length + 1).padStart(2, "0")}</span><EditPhotoButton label={photo.name} target="coach" photoId={photo.id} className="media-edit-overlay" /></div><div className="profile-copy"><p className="eyebrow">{photo.role || "Coach"}</p><h3>{photo.name}</h3><p>{photo.caption}</p><p className="sample-note">Owner-supplied profile · Photo: {photo.credit}</p></div></ProfileCard>)}</div><EditPhotoButton target="coach" profileId="new" label="Add coach photo" />
    <p className="coach-disclaimer">Uploaded profiles use owner-supplied identities. Remaining sample profiles are fictional, not verified academy appointments.</p>
  </section>;
}

"use client";
import Image from "next/image";
import { facilities } from "../content/academy";
import { EditPhotoButton, useSiteMedia } from "./MediaEditing";
import CreditLink from "./CreditLink";

export default function Facilities() {
  const { media, editing } = useSiteMedia();
  return <div className="facility-grid">{facilities.map((facility, index) => {
    const slotId = `facility:${facility.id}`;
    const photo = media.photos.filter(item => item.target === "site" && item.slotId === slotId).at(-1);
    return <article key={facility.id} data-facility={facility.id}>
      <div className={`facility-photo ${photo ? "" : "facility-photo-empty"}`}>
        {photo ? <Image src={photo.src} alt={photo.alt} fill unoptimized sizes="(max-width:650px) 100vw, (max-width:1000px) 50vw, 25vw" /> :
          <div><span aria-hidden="true">+</span><p>{facility.title}</p><small>{editing ? "Add your own area photo" : "Academy photo coming soon"}</small></div>}
        <EditPhotoButton slotId={slotId} label={facility.title} className="media-edit-overlay" />
      </div>
      <span className="facility-index">{String(index + 1).padStart(2, "0")}</span>
      <h3>{facility.title}</h3><p>{facility.description}</p>
      {photo && <p className="facility-credit"><CreditLink photoId={photo.id} /></p>}
    </article>;
  })}</div>;
}

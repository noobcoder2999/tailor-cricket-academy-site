"use client";
import Image from "next/image";
import { useState } from "react";
import { images } from "../content/academy";
import type { PhotoRecord } from "../lib/media-schema";
import { EditPhotoButton } from "./MediaEditing";

export default function HeroMedia({ photos, editable }: { photos: PhotoRecord[]; editable: boolean }) {
  const [index, setIndex] = useState(0);
  const photo = photos[index] ?? photos[0];
  const src = photo?.src ?? images.pavilion;
  return <>
    <div className="hero-photo"><Image key={src} className="hero-image" src={src} alt={photo?.alt ?? "Walker Cricket Ground clubhouse, a licensed illustrative venue"} fill unoptimized={Boolean(photo)} loading="eager" fetchPriority="high" sizes="(max-width: 600px) 120px, 236px" />
    <span className="hero-credit">{photo ? `${photo.caption} · Photo: ${photo.credit}` : "Sample venue · Walker Cricket Ground · Acabashi / CC BY-SA 4.0"}</span></div>
    <div className="hero-photo-tools">{photos.length > 1 && <div role="group" aria-label="Choose ground background">{photos.map((p, i) => <button key={p.id} onClick={() => setIndex(i)} aria-pressed={index === i} aria-label={`Show background ${i + 1}: ${p.name}`}>{String(i + 1).padStart(2, "0")}</button>)}</div>}{editable && <><EditPhotoButton target="hero" photoId={photo?.id} label="Ground background" /><EditPhotoButton target="hero" label="Add ground photo" /></>}</div>
  </>;
}

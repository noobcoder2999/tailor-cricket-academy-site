"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gallery, galleryCategories, images, videos, videoCategories } from "../content/academy";
import { Dialog, FilterBar } from "./ui";
import { EditPhotoButton, EditVideoButton, SiteImage, useSiteMedia } from "./MediaEditing";
import type { MediaState } from "../lib/media-schema";
import { sitePath } from "../lib/site";

function galleryPhoto(item: typeof gallery[number], media: MediaState) {
  const photo = media.photos.filter(photo => photo.id === item.id || (photo.target === "site" && photo.slotId === `gallery:${item.id}`)).at(-1);
  return photo ? { ...item, src: photo.src, alt: photo.alt, caption: `${photo.caption} · Photo: ${photo.credit}`, category: photo.target === "gallery" ? photo.role : item.category } : item;
}
function GalleryEdit({ item }: { item: typeof gallery[number] }) {
  const owner = !gallery.some(photo => photo.id === item.id);
  return <EditPhotoButton label={`${item.category} gallery photo`} target={owner ? "gallery" : "site"} photoId={owner ? item.id : undefined} slotId={owner ? undefined : `gallery:${item.id}`} className="media-edit-overlay" />;
}

export function GalleryLightbox({ items, start = 0, onClose }: { items: typeof gallery; start?: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const { media } = useSiteMedia();
  const touch = useRef<number | null>(null);
  const item = galleryPhoto(items[index], media);
  const move = (step: number) => setIndex(i => (i + step + items.length) % items.length);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex(i => (i + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [items.length]);
  return <Dialog wide title={`${item.category} · ${index + 1} / ${items.length}`} onClose={onClose}>
    <div className="lightbox-image" onTouchStart={event => { touch.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touch.current !== null) { const diff = touch.current - event.changedTouches[0].clientX; if (Math.abs(diff) > 45) move(diff > 0 ? 1 : -1); } touch.current = null; }}>
      <Image src={item.src} alt={item.alt} fill unoptimized={item.src.startsWith("/uploads/")} sizes="90vw" /><GalleryEdit item={item} />
    </div>
    <div className="lightbox-controls"><button className="icon-button" aria-label="Previous image" onClick={() => move(-1)}>←</button><p aria-live="polite">{item.caption}</p><button className="icon-button" aria-label="Next image" onClick={() => move(1)}>→</button></div>
    <p className="sample-note">Use arrow keys or swipe. Escape closes. <a href={sitePath("/credits/")}>Media credits & licenses</a></p>
  </Dialog>;
}
export function Gallery() {
  const { media } = useSiteMedia();
  const [category, setCategory] = useState("All photos");
  const [selected, setSelected] = useState<{ items: typeof gallery; start: number } | null>(null);
  const items = [...gallery, ...media.photos.filter(photo => photo.target === "gallery").map(photo => ({ id: photo.id, category: photo.role, src: photo.src, alt: photo.alt, caption: photo.caption }))].map(item => galleryPhoto(item, media));
  const visible = items.filter(item => category === "All photos" || item.category === category);
  return <>
    <FilterBar options={["All photos", ...galleryCategories]} label="Filter gallery" value={category} onChange={setCategory} />
    <div className="gallery-grid">{visible.map((item, index) => <div className={`gallery-item gallery-item-${index % 5}`} key={item.id}><button className="gallery-open" onClick={() => setSelected({ items: visible, start: index })} aria-label={`Open ${item.category} photo`}>
      <Image src={item.src} alt={item.alt} fill unoptimized={item.src.startsWith("/uploads/")} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" /><span>{item.category}<span aria-hidden="true">↗</span></span>
    </button><GalleryEdit item={item} /></div>)}</div>
    <EditPhotoButton target="gallery" role={category === "All photos" ? undefined : category} label="Add gallery photo" />
    <p className="sample-note">Built-in images are licensed examples, not academy photographs. <a href={sitePath("/credits/")}>View credits.</a></p>
    {selected !== null && <GalleryLightbox items={selected.items} start={selected.start} onClose={() => setSelected(null)} />}
  </>;
}
type LibraryVideo = typeof videos[number] & { ownerProvided?: boolean; credit?: string; ownerId?: string; slotId?: string };
function VideoPlayer({ item, onClose }: { item: LibraryVideo; onClose: () => void }) {
  const [error, setError] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (video) { video.src = item.src; video.load(); }
    return () => { if (video) { video.pause(); video.removeAttribute("src"); video.load(); } };
  }, [item.src]);
  return <Dialog wide title={item.title} onClose={onClose}>
    <video ref={ref} className="video-player" src={item.src} controls playsInline preload="metadata" onError={() => setError(true)} aria-label={item.ownerProvided ? item.title : "Licensed archival cricket sample"}>
      {!item.ownerProvided && <track kind="captions" src={sitePath("/media/cricket-sample.vtt")} srcLang="en" label="English descriptions" default />}
    </video>
    <EditVideoButton label={item.title} videoId={item.ownerId} slotId={item.slotId ?? (item.ownerProvided ? undefined : item.id)} />
    {error && <p role="alert" className="field-error">Video playback is unavailable in this browser. The transcript below remains available.</p>}
    <p className="sample-note">{item.description}</p><details className="transcript"><summary>Transcript & visual description</summary><p>{item.transcript}</p></details>
    <p className="sample-note">{item.ownerProvided ? `Owner-provided training video. Credit: ${item.credit}. Transcript supplied by the owner.` : <>Nomadtales · CC BY-SA 3.0 · 240p archival footage. No endorsement. <a href={sitePath("/credits/")}>Source and license</a></>}</p>
  </Dialog>;
}
export function VideoLibrary() {
  const { media } = useSiteMedia();
  const ownerVideos = media.videos;
  const [category, setCategory] = useState("All videos");
  const [selected, setSelected] = useState<string | null>(null);
  const ownerItems: LibraryVideo[] = ownerVideos.map(video => ({
    ...video, id: video.slotId ?? video.id, ownerId: video.id, thumbnail: images.equipment, ownerProvided: true,
    duration: `${Math.floor(video.seconds / 60)}:${String(Math.floor(video.seconds % 60)).padStart(2, "0")}`
  }));
  const items: LibraryVideo[] = ownerVideos.some(video => !video.slotId) ? ownerItems : videos.map(video => ownerItems.filter(item => item.slotId === video.id).at(-1) ?? video);
  const playing = items.find(item => item.id === selected);
  return <>
    <FilterBar options={["All videos", ...videoCategories]} label="Filter videos" value={category} onChange={setCategory} />
    <div className="video-grid">{items.filter(video => category === "All videos" || category === video.category).map(video => <article className="video-card" key={video.id}>
      <div className="video-media"><button className="video-thumbnail" aria-label={`Play ${video.title}`} onClick={() => setSelected(video.id)}><SiteImage slotId={`video-poster:${video.id}`} src={video.thumbnail} alt={video.ownerProvided ? "Cricket equipment illustration; play to view the training video" : "Illustrative cricket venue thumbnail; not a frame from this video"} fill sizes="(max-width: 650px) 100vw, 33vw" /><span className="play-icon" aria-hidden="true">▶</span><span className="duration">{video.duration}</span></button><EditPhotoButton slotId={`video-poster:${video.id}`} label={`${video.title} thumbnail`} className="media-edit-overlay" /></div>
      <EditVideoButton label={video.title} videoId={video.ownerId} slotId={video.slotId ?? (video.ownerProvided ? undefined : video.id)} />
      <p className="eyebrow">{video.category}</p><h3>{video.title}</h3><p>{video.coach}</p><p className="sample-note">{video.ownerProvided ? `Owner-provided · ${video.credit}` : "Licensed sample clip · replaceable category placeholder"}</p>
    </article>)}</div>
    {!items.some(video => category === "All videos" || category === video.category) && <p className="sample-note">No training videos in this category yet. Choose All videos to view the library.</p>}
    <EditVideoButton label="Add training video" />
    {playing && <VideoPlayer key={playing.src} item={playing} onClose={() => setSelected(null)} />}
  </>;
}

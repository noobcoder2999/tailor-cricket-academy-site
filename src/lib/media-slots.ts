import { facilities, gallery, programs, successStories, tournaments, videos } from "../content/academy";

export const photoSlots = [
  { id: "brand-logo", label: "Academy logo (header, footer and introduction)" },
  { id: "coach-scene", label: "Immersive homepage / coach photograph" },
  { id: "about", label: "About / practice nets" },
  { id: "facilities", label: "Facilities / ground" },
  ...facilities.map(item => ({ id: `facility:${item.id}`, label: `Facility / ${item.title}` })),
  { id: "intro-batsman", label: "Introduction / batsman portrait" },
  { id: "intro-bowler", label: "Introduction / bowler portrait" },
  ...programs.map(item => ({ id: `program:${item.id}`, label: `Program / ${item.title}` })),
  ...successStories.map(item => ({ id: `success:${item.name}`, label: `Player story / ${item.name}` })),
  ...tournaments.map(item => ({ id: `tournament:${item.id}`, label: `Tournament / ${item.name}` })),
  ...gallery.map(item => ({ id: `gallery:${item.id}`, label: `Gallery / ${item.category}` })),
  ...videos.map(item => ({ id: `video-poster:${item.id}`, label: `Video thumbnail / ${item.title}` }))
];

export function isPhotoSlot(id: string) {
  // Keep stored photos from retired programs readable without offering them as new slots.
  const archived = ["intermediate", "wicketkeeping", "fielding-fitness", "weekend", "girls"];
  return photoSlots.some(slot => slot.id === id) ||
    archived.some(program => id === `program:${program}`) ||
    /^video-poster:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
}

export function isVideoSlot(id: string) {
  return videos.some(video => video.id === id);
}

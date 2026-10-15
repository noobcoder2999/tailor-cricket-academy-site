import snapshot from "../content/published-media.json";
import { mediaStateSchema, type MediaState } from "./media-schema";
import { sitePath } from "./site";

const approved = mediaStateSchema.parse(snapshot);
export const publicMedia: MediaState = {
  ...approved,
  photos: approved.photos.map(photo => ({ ...photo, src: sitePath(photo.src.replace("/uploads/", "/owner-media/")) })),
  videos: approved.videos.map(video => ({ ...video, src: sitePath(video.src.replace("/uploads/", "/owner-media/")) }))
};

"use client";
import Image, { type ImageProps } from "next/image";
import type { ComponentType, ReactNode } from "react";
import type { MediaInput, MediaState } from "../lib/media-schema";
import { academy } from "../content/academy";
import { sitePath } from "../lib/site";
import { publicMedia } from "../lib/public-media";
import CreditLink from "./CreditLink";

export function useSiteMedia() {
  return { media: publicMedia, editing: false };
}
export function useAcademyContact() { return { ...academy.contact, ...publicMedia.contact }; }

export function MediaEditingProvider({ children }: { initial: MediaState; editable: boolean; children: ReactNode }) {
  return children;
}

type PhotoControl = Partial<Pick<MediaInput, "target" | "slotId" | "profileId" | "role">> & {
  label: string; photoId?: string; className?: string;
};
export const EditPhotoButton: ComponentType<PhotoControl> = () => null;
export const EditVideoButton: ComponentType<{ label: string; videoId?: string; slotId?: string }> = () => null;

export function SiteImage({ slotId, ...props }: ImageProps & { slotId: string }) {
  const photo = publicMedia.photos.filter(item => item.target === "site" && item.slotId === slotId).at(-1);
  return <Image {...props} alt={photo?.alt ?? props.alt} data-media-slot={slotId} src={photo?.src ?? (typeof props.src === "string" ? sitePath(props.src) : props.src)} />;
}
export function PhotoCredit({ slotId }: { slotId: string; fallback: ReactNode }) {
  const photo = publicMedia.photos.filter(item => item.target === "site" && item.slotId === slotId).at(-1);
  return <CreditLink photoId={photo?.id} />;
}

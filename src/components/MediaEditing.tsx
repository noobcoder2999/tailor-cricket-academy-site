"use client";
import Image, { type ImageProps } from "next/image";
import type { ComponentType, ReactNode } from "react";
import type { MediaInput, MediaState } from "../lib/media-schema";
import { academy } from "../content/academy";
import { publicMedia, sitePath } from "../lib/site";

export function useSiteMedia() {
  return { media: publicMedia, editing: false };
}
export function useAcademyContact() { return academy.contact; }

export function MediaEditingProvider({ children }: { initial: MediaState; editable: boolean; children: ReactNode }) {
  return children;
}

type PhotoControl = Partial<Pick<MediaInput, "target" | "slotId" | "profileId" | "role">> & {
  label: string; photoId?: string; className?: string;
};
export const EditPhotoButton: ComponentType<PhotoControl> = () => null;
export const EditVideoButton: ComponentType<{ label: string; videoId?: string; slotId?: string }> = () => null;

export function SiteImage({ slotId, ...props }: ImageProps & { slotId: string }) {
  return <Image {...props} alt={props.alt} data-media-slot={slotId} src={typeof props.src === "string" ? sitePath(props.src) : props.src} />;
}
export function PhotoCredit({ fallback }: { slotId: string; fallback: ReactNode }) { return fallback; }

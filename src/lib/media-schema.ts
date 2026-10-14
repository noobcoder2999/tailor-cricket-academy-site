import { z } from "zod";
import { galleryCategories, videoCategories } from "../content/academy";
import { isPhotoSlot, isVideoSlot } from "./media-slots";
export const mediaInputSchema = z.object({
  target: z.enum(["hero", "coach", "staff", "moment", "achievement", "site", "gallery"]),
  slotId: z.string().max(100).optional(),
  name: z.string().trim().min(2, "Enter a title or name.").max(100),
  role: z.string().trim().max(100),
  caption: z.string().trim().min(5, "Describe the actual photo.").max(500),
  alt: z.string().trim().min(5, "Describe the image for screen-reader users.").max(250),
  credit: z.string().trim().min(2, "Credit the photographer or rights holder.").max(200),
  profileId: z.string().max(80),
  permission: z.literal(true, { error: "Confirm the rights and permissions before uploading." }),
  revision: z.string().max(100)
}).strict().superRefine((value, ctx) => {
  if (value.target === "coach" && !["arun", "sara", "dev", "new"].includes(value.profileId))
    ctx.addIssue({ code: "custom", path: ["profileId"], message: "Select a coach slot." });
  if (value.target === "site" ? !isPhotoSlot(value.slotId ?? "") : Boolean(value.slotId))
    ctx.addIssue({ code: "custom", path: ["slotId"], message: "Select a valid website image position." });
  if (value.target === "gallery" && !galleryCategories.includes(value.role))
    ctx.addIssue({ code: "custom", path: ["role"], message: "Select a gallery category." });
});
export type MediaInput = z.infer<typeof mediaInputSchema>;
export const photoSchema = mediaInputSchema.safeExtend({
  id: z.uuid(), src: z.string().regex(/^\/uploads\/[0-9a-f-]{36}\.webp$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
  createdAt: z.iso.datetime()
});
export type PhotoRecord = z.infer<typeof photoSchema>;
export const videoInputSchema = z.object({
  slotId: z.string().refine(isVideoSlot, "Select a valid video position.").optional(),
  title: z.string().trim().min(2).max(100),
  category: z.string().refine(value => videoCategories.includes(value), "Select a training category."),
  coach: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(1000),
  transcript: z.string().trim().min(10, "Include spoken instruction and meaningful visual descriptions.").max(10000),
  credit: z.string().trim().min(2).max(200),
  seconds: z.number().finite().min(1).max(600),
  permission: z.literal(true),
  revision: z.string().max(100)
}).strict();
export type VideoInput = z.infer<typeof videoInputSchema>;
export const videoRecordSchema = videoInputSchema.extend({
  id: z.uuid(), src: z.string().regex(/^\/uploads\/[0-9a-f-]{36}\.(mp4|webm)$/),
  createdAt: z.iso.datetime()
});
export type VideoRecord = z.infer<typeof videoRecordSchema>;
const optionalPhone = z.string().trim().max(25).refine(value => !value || (/^\+?[\d ()-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15), "Use a phone number with 7-15 digits.");
export const contactSettingsSchema = z.object({
  phone: optionalPhone,
  email: z.string().trim().pipe(z.union([z.literal(""), z.email().max(254)])),
  address: z.string().trim().max(500),
  hours: z.string().trim().max(300),
  whatsapp: z.string().trim().max(100).refine(value => !value || /^https:\/\/wa\.me\/[1-9]\d{6,14}$/.test(value), "Use https://wa.me/ followed by your country code and number (digits only).")
}).strict();
export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export const contactUpdateSchema = z.object({ revision: z.string().min(1).max(100), contact: contactSettingsSchema }).strict();
export const mediaStateSchema = z.object({
  revision: z.string(), photos: z.array(photoSchema).max(60), videos: z.array(videoRecordSchema).max(20).default([]),
  contact: contactSettingsSchema.optional()
}).strict();
export type MediaState = z.infer<typeof mediaStateSchema>;

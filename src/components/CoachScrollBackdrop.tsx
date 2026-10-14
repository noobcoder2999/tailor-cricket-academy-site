"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { usePageMotion } from "./PageMotion";
import { useSiteMedia } from "./MediaEditing";
import { sitePath } from "../lib/site";

export default function CoachScrollBackdrop() {
  const { enabled, reduced } = usePageMotion();
  const { media } = useSiteMedia();
  const replacement = media.photos.filter(photo => photo.slotId === "coach-scene").at(-1);
  const scene = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const chapters = [0, 1, 2.5, 5, 12, 24];
  const groundX = useTransform(progress, chapters, ["0%", "-1%", "-3%", "0%", "-2%", "0%"]);
  const groundScale = useTransform(progress, chapters, [1.08, 1.1, 1.14, 1.08, 1.12, 1.08]);
  const coachX = useTransform(progress, chapters, ["0%", "-6%", "-12%", "2%", "-9%", "0%"]);
  const coachY = useTransform(progress, chapters, ["0%", "2%", "0%", "3%", "0%", "2%"]);
  const coachScale = useTransform(progress, chapters, [1, 1.06, 1.12, 1, 1.08, 1.02]);
  const coachRotation = useTransform(progress, chapters, [-2, 1, 3, -2, 2, 0]);
  const fieldRotation = useTransform(progress, [0, 24], [-12, 14]);
  const ballY = useTransform(progress, [0, 2.5, 5, 24], ["0vh", "-20vh", "5vh", "-12vh"]);
  const ballX = useTransform(progress, [0, 2.5, 5, 24], ["0vw", "14vw", "-6vw", "10vw"]);

  useEffect(() => {
    if (scene.current) scene.current.dataset.scrollReady = "true";
    if (reduced) progress.set(0);
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!document.querySelector("dialog[open]"))
        progress.set(Math.max(0, window.scrollY / Math.max(window.innerHeight, 1)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, reduced, progress]);

  return <div ref={scene} className="coach-scroll-backdrop" role="img" aria-label={replacement?.alt ?? "The supplied coach photograph: a coach in a navy shirt using a sidearm throwing aid on an outdoor cricket ground."} data-depth-mode={replacement ? "photograph" : "layered"} data-motion={enabled ? "running" : "paused"}>
    <motion.div className="coach-ground-layer" style={{ x: groundX, scale: groundScale }}>
      <Image src={replacement?.src ?? sitePath("/images/coach-ground.webp")} alt="" fill sizes="100vw" unoptimized loading="eager" />
    </motion.div>
    <div className="coach-ground-grade" />
    <motion.div className="coach-field-lines" style={{ rotate: fieldRotation }}>
      <svg viewBox="0 0 1400 900" fill="none"><ellipse cx="750" cy="580" rx="600" ry="245" /><ellipse cx="750" cy="580" rx="430" ry="170" strokeDasharray="3 10" /><path d="M670 430H820L860 730H630ZM650 470H840M638 694H854" /><path d="M715 429V405M732 429V402M749 429V405M702 738V718M720 738V718M738 738V718" /></svg>
    </motion.div>
    {!replacement && <motion.div className="coach-subject" style={{ x: coachX, y: coachY, scale: coachScale, rotateY: coachRotation }}>
      <Image src={sitePath("/images/coach-depth.webp")} alt="" width={354} height={530} unoptimized loading="eager" fetchPriority="high" />
    </motion.div>}
    <motion.div className="coach-scene-ball" style={{ x: ballX, y: ballY, rotate: fieldRotation }}><span /></motion.div>
    <div className="coach-scene-vignette" />
    <div className="coach-frame-corner coach-frame-left" /><div className="coach-frame-corner coach-frame-right" />
  </div>;
}

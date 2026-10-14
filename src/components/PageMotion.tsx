"use client";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

const MotionContext = createContext({ enabled: false, paused: false, reduced: false, toggle: () => {} });
export function usePageMotion() { return useContext(MotionContext); }
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
const isVisible = () => document.visibilityState === "visible";
const serverVisible = () => true;
function subscribeReducedMotion(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}
const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverReducedMotion = () => false;

export function PageMotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, isReducedMotion, serverReducedMotion);
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, serverVisible);
  const enabled = !paused && !reduced && visible;
  return <MotionContext.Provider value={{ enabled, paused, reduced, toggle: () => setPaused(value => !value) }}>
    <div className="pavilion-site" data-page-motion={enabled ? "running" : "paused"}>{children}</div>
  </MotionContext.Provider>;
}

export function MotionToggle() {
  const { paused, reduced, toggle } = useContext(MotionContext);
  return <button type="button" className="motion-toggle" onClick={toggle} disabled={reduced} aria-pressed={paused || reduced}>
    <span aria-hidden="true">{paused || reduced ? "▶" : "Ⅱ"}</span>
    {reduced ? "Reduced motion on" : paused ? "Resume page motion" : "Pause page motion"}
  </button>;
}

export function ProfileCard({ children, className = "", index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "80px" });
  const { enabled } = useContext(MotionContext);
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 120, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 120, damping: 22 });
  const reset = () => { x.set(0); y.set(0); };
  useEffect(() => { if (!enabled) { x.set(0); y.set(0); } }, [enabled, x, y]);
  return <div ref={ref} className="profile-float" data-animating={enabled && inView} style={{ animationDelay: `${index * -1.7}s` }}>
    <motion.article className={`profile-card ${className}`} style={{ rotateX, rotateY }} onFocusCapture={reset} onPointerLeave={reset} onPointerMove={event => {
      if (!enabled || event.pointerType !== "mouse" || event.currentTarget.matches(":focus-within") || event.currentTarget.querySelector("details[open]") || (event.target instanceof Element && event.target.closest("button, a, summary, input"))) { reset(); return; }
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(((event.clientY - rect.top) / rect.height - 0.5) * -5);
      y.set(((event.clientX - rect.left) / rect.width - 0.5) * 6);
    }}>{children}</motion.article>
  </div>;
}

export function HeroObject({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const { enabled } = useContext(MotionContext);
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 65, damping: 18 });
  const rotateY = useSpring(y, { stiffness: 65, damping: 18 });
  useEffect(() => { if (!enabled) { x.set(0); y.set(0); } }, [enabled, x, y]);
  return <motion.div ref={ref} className="hero-object" data-animating={enabled && inView} style={{ rotateX, rotateY }} onPointerMove={event => {
    if (!enabled || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientY - rect.top) / rect.height - 0.5) * -16);
    y.set(((event.clientX - rect.left) / rect.width - 0.5) * 22);
  }} onPointerLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>;
}

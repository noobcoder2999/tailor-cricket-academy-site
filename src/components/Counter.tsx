"use client";
import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

export default function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | undefined;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const animation = animate(0, value, { duration: 1.5, ease: "easeOut", onUpdate: current => { element.textContent = String(Math.round(current)); } });
        stop = () => animation.stop();
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => { observer.disconnect(); stop?.(); };
  }, [value]);
  return <div className="stat"><span className="stat-number" ref={ref} aria-hidden="true">{value}</span><span className="sr-only">{value}</span><span>{label}</span><small>Illustrative figure</small></div>;
}

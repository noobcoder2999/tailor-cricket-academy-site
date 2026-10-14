"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { basePath, sitePath } from "../lib/site";

export function Dialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`dialog ${wide ? "dialog-wide" : ""}`} aria-labelledby={id} onCancel={event => { event.preventDefault(); closeRef.current(); }} onClick={event => { if (event.target === event.currentTarget) closeRef.current(); }}>
    <div className="dialog-inner">
      <div className="dialog-top"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose} autoFocus>×</button></div>
      {children}
    </div>
  </dialog>;
}
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={reduced ? {} : { opacity: [0.8, 1], y: [12, 0] }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5 }}>{children}</motion.div>;
}
export function FilterBar({ options, value, onChange, label }: { options: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div className="filters" role="group" aria-label={label}>{options.map(option => <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}
export function SectionHeading({ eyebrow, title, text, light = false }: { eyebrow: string; title: ReactNode; text?: string; light?: boolean }) {
  return <div className={`section-heading ${light ? "light" : ""}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{text && <p className="section-description">{text}</p>}</div>;
}
export type EnquirySelection = { programId?: string; tournamentId?: string; kind?: "trial" | "contact" };
export function requestEnquiry(programId?: string, tournamentId?: string, kind: "trial" | "contact" = "trial") {
  window.dispatchEvent(new CustomEvent<EnquirySelection>("academy-enquiry", { detail: { programId, tournamentId, kind } }));
}
export function EnquireButton({ programId, tournamentId, children, className = "text-link" }: { programId?: string; tournamentId?: string; children: ReactNode; className?: string }) {
  return <button className={className} onClick={() => requestEnquiry(programId, tournamentId)}>{children}<span aria-hidden="true"> ↗</span></button>;
}
export function ReplayIntro({ label = "Replay the cricket experience" }: { label?: string }) {
  return <button className="text-link" onClick={() => {
    if (location.pathname.replace(/\/$/, "") !== basePath) location.assign(sitePath("/?intro=1"));
    else window.dispatchEvent(new Event("academy-replay"));
  }}>{label} ↗</button>;
}

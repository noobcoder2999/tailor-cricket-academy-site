"use client";
import { useState } from "react";
import { academy } from "../content/academy";
import { Dialog, requestEnquiry } from "./ui";
import AcademyContact from "./AcademyContact";

export default function ContactBall() {
  const [open, setOpen] = useState(false);
  function navigate(target: "trial" | "contact") {
    setOpen(false);
    requestEnquiry(undefined, undefined, target);
  }
  return <>
    <button className="contact-ball" onClick={() => setOpen(true)} aria-label="Open contact details and book a trial" aria-expanded={open}><span className="contact-ball-stitch" aria-hidden="true" /><span>LET&apos;S<br />PLAY</span></button>
    {open && <Dialog title="Your next innings starts here." onClose={() => setOpen(false)}>
      <p className="eyebrow">{academy.name}</p>
      <div className="contact-popover-details"><h3>Get in touch</h3>
        <AcademyContact />
      </div>
      <div className="button-row"><button className="button button-dark" onClick={() => navigate("trial")}>Book a trial session ↗</button><button className="text-link" onClick={() => navigate("contact")}>Ask a question ↗</button></div>
      <p className="sample-note">Read-only public preview. Enquiries and appointments are not available here.</p>
    </Dialog>}
  </>;
}

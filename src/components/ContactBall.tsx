"use client";
import { useState } from "react";
import { academy } from "../content/academy";
import { Dialog, requestEnquiry } from "./ui";
import AcademyContact from "./AcademyContact";
import CricketBall from "./CricketBall";

export default function ContactBall() {
  const [open, setOpen] = useState(false);
  function navigate(target: "trial" | "contact") {
    setOpen(false);
    requestEnquiry(undefined, undefined, target);
  }
  return <>
    <button className="contact-ball" onClick={() => setOpen(true)} aria-label="Open contact details and book a trial" aria-expanded={open}><CricketBall /><span>LET&apos;S<br />PLAY</span></button>
    {open && <Dialog title="Your next innings starts here." onClose={() => setOpen(false)}>
      <p className="eyebrow">{academy.name}</p>
      <div className="contact-popover-details"><h3>Get in touch</h3>
        <AcademyContact />
      </div>
      <div className="button-row"><button className="button button-dark" onClick={() => navigate("trial")}>Book a trial session ↗</button><button className="text-link" onClick={() => navigate("contact")}>Ask a question ↗</button></div>
      <p className="sample-note">Contact the academy using its published details. This static edition does not accept online bookings.</p>
    </Dialog>}
  </>;
}

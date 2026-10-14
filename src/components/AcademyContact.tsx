"use client";
import { useAcademyContact } from "./MediaEditing";

export default function AcademyContact({ expanded = false }: { expanded?: boolean }) {
  const contact = useAcademyContact();
  const links = <>
    {contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : <p>Phone number not configured.</p>}
    {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <p>Email address not configured.</p>}
    {contact.whatsapp && <a href={contact.whatsapp} rel="noopener noreferrer">WhatsApp enquiry ↗</a>}
  </>;
  return expanded ? <div className="contact-details">
    <div><h3>Find us</h3><p>{contact.address || "Academy address not configured."}</p></div>
    <div><h3>Training hours</h3><p>{contact.hours || "Training hours not configured."}</p></div>
    <div><h3>Get in touch</h3>{links}</div>
  </div> : <div className="academy-contact">
    {links}<p>{contact.address || "Academy address not configured."}</p><p>{contact.hours || "Training hours not configured."}</p>
  </div>;
}

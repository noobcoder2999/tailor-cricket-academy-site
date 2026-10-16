"use client";
import { EditPhotoButton, PhotoCredit, SiteImage } from "./MediaEditing";
import { useState } from "react";
import { programs } from "../content/academy";
import { EnquireButton, FilterBar } from "./ui";
import { programPhoto } from "../content/program-imagery";

export default function Programs() {
  const [category, setCategory] = useState("All programs");
  const visible = programs.filter(p => category === "All programs" || p.category === category);
  return <>
    <FilterBar options={["All programs", "Foundations", "Specialist", "Performance", "Community"]} value={category} onChange={setCategory} label="Filter training programs" />
    <div className="program-grid">{visible.map((program, index) => {
      const photo = programPhoto(program.id);
      return <article className="program-card" key={program.id}>
      <div className="program-image"><SiteImage slotId={`program:${program.id}`} src={photo.src} alt={photo.alt} fill sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" /><span className="image-pill">{program.category}</span><span className="program-number">{String(index + 1).padStart(2, "0")}</span><EditPhotoButton slotId={`program:${program.id}`} label={program.title} className="media-edit-overlay" /></div>
      <p className="program-photo-credit"><PhotoCredit slotId={`program:${program.id}`} fallback={<><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">CC0</a> · Sample photo, no academy affiliation</>} /></p>
      <div className="program-body"><h3>{program.title}</h3><p>{program.description}</p><div className="program-meta"><span>AGES {program.age}</span><span>{program.level}</span></div><p className="schedule">{program.schedule} · Sample</p><EnquireButton programId={program.id}>Explore your potential</EnquireButton></div>
    </article>; })}</div>
    <p className="sample-note">{visible.length} of {programs.length} programs · Confirm eligibility, schedule and availability with the academy.</p>
  </>;
}

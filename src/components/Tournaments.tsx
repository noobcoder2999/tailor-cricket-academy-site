"use client";
import { EditPhotoButton, SiteImage } from "./MediaEditing";
import { useState } from "react";
import { gallery, tournaments, type Tournament } from "../content/academy";
import { Dialog, EnquireButton, FilterBar, requestEnquiry } from "./ui";
import { GalleryLightbox } from "./MediaLibrary";

export default function Tournaments() {
  const [status, setStatus] = useState("Upcoming");
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [tab, setTab] = useState("Fixtures");
  const [photos, setPhotos] = useState<typeof gallery | null>(null);
  return <>
    <FilterBar options={["Upcoming", "Ongoing", "Past"]} label="Tournament status" value={status} onChange={setStatus} />
    <div className="tournament-list">{tournaments.filter(t => t.status === status).map(t => <article className="tournament-card" key={t.id}>
      <div className="tournament-poster"><SiteImage slotId={`tournament:${t.id}`} src={t.image} alt="Illustrative tournament venue, not the actual event" fill sizes="(max-width: 650px) 100vw, 35vw" /><span>{t.age}<small>THE GAME<br />BRINGS US<br />TOGETHER.</small></span><EditPhotoButton slotId={`tournament:${t.id}`} label={t.name} className="media-edit-overlay" /></div>
      <div className="tournament-info"><p className="eyebrow">{t.status} · SAMPLE EVENT</p><h3>{t.name}</h3><p>{t.date}</p><p>{t.venue}</p><div className="program-meta"><span>{t.age}</span><span>{t.format}</span></div><p>{t.teams.join(" · ")}</p><p className="registration-status">{t.registration}</p><div className="button-row"><button className="button button-outline" onClick={() => { setSelected(t); setTab("Fixtures"); }}>Fixtures & details ↗</button><button className="text-link" onClick={() => { setSelected(t); setTab("Scorecard"); }}>Results / scorecard ↗</button>{t.status === "Upcoming" && <EnquireButton tournamentId={t.id}>Register interest</EnquireButton>}</div></div>
    </article>)}</div>
    {selected && <Dialog title={selected.name} onClose={() => setSelected(null)} wide><p className="sample-note">Fictional sample event · {selected.date} · {selected.format}</p>
      <FilterBar options={["Fixtures", "Results", "Scorecard", "Photos"]} label="Tournament information" value={tab} onChange={setTab} />
      {tab === "Fixtures" && <div className="fixture-list">{selected.fixtures.map(fixture => <p key={fixture}>{fixture}</p>)}</div>}
      {tab === "Results" && <div className="result-panel"><h3>Match result</h3><p>{selected.result}</p></div>}
      {tab === "Scorecard" && <div className="scorecard"><h3>Summary scorecard</h3><p>{selected.result}</p>{selected.scorecard.length > 0 && <table><caption>Fictional demonstration match</caption><thead><tr><th>Team</th><th>Runs / wickets</th><th>Overs</th></tr></thead><tbody>{selected.scorecard.map(row => <tr key={row.team}><th scope="row">{row.team}</th><td>{row.score}</td><td>{row.overs}</td></tr>)}</tbody></table>}{selected.innings.map(line => <p key={line}>{line}</p>)}</div>}
      {tab === "Photos" && <div><p>Sample category images, not photographs of this event.</p><button className="button button-dark" onClick={() => { setPhotos(gallery.filter(item => selected.galleryIds.includes(item.id))); setSelected(null); }}>Open event sample gallery ↗</button></div>}
      {selected.status === "Upcoming" && <button className="button button-dark" onClick={() => { const id = selected.id; setSelected(null); requestAnimationFrame(() => requestEnquiry(undefined, id)); }}>Register interest ↗</button>}
    </Dialog>}
    {photos && <GalleryLightbox items={photos} onClose={() => setPhotos(null)} />}
  </>;
}

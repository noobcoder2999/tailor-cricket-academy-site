"use client";
import { EditPhotoButton, SiteImage } from "./MediaEditing";
import Link from "./SiteLink";
import { useState } from "react";
import { academy, images, navigation } from "../content/academy";
import { Dialog, EnquireButton, requestEnquiry } from "./ui";
import { sitePath } from "../lib/site";

export default function Header() {
  const [menu, setMenu] = useState(false);
  return <header className="site-header">
    <div className="editable-brand"><Link className="brand" href="/#home" aria-label={`${academy.name} home`}><SiteImage slotId="brand-logo" src={images.crest} width={37} height={44} alt="" /><span>{academy.shortName}<small>CRICKET ACADEMY</small></span></Link><EditPhotoButton slotId="brand-logo" label="Academy logo" /></div>
    <nav aria-label="Main navigation" className="desktop-nav">{navigation.filter(([id]) => !["home", "facilities", "achievements", "videos", "contact"].includes(id)).map(([id, label]) => <a href={sitePath(`/#${id}`)} key={id}>{label}</a>)}<Link href="/simulator">Batting lab</Link></nav>
    <div className="header-actions"><EnquireButton className="button button-dark header-trial">Book a trial</EnquireButton><button className="menu-button" aria-label="Open navigation" aria-expanded={menu} onClick={() => setMenu(true)}><span></span><span></span><span></span></button></div>
    {menu && <Dialog title={`Explore ${academy.shortName}`} onClose={() => setMenu(false)}><nav className="menu-links" aria-label="All sections">{navigation.map(([id, label]) => <Link key={id} href={`/#${id}`} onClick={() => setMenu(false)}>{label}<span aria-hidden="true">↗</span></Link>)}<Link href="/simulator" onClick={() => setMenu(false)}>Batting lab</Link><button onClick={() => { setMenu(false); requestEnquiry(); }}>Book a trial ↗</button></nav></Dialog>}
  </header>;
}

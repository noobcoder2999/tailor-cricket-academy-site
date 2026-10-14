import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { academy, mediaCredits } from "../../content/academy";
import { publicMedia } from "../../lib/site";
import Link from "../../components/SiteLink";
import programPhotos from "../../content/program-photos.json";
export const metadata: Metadata = { title: "Media credits & sample content" };
export default async function Credits() {
  const media = publicMedia;
  const uploads = [...media.photos.map(photo => ({ id: photo.id, title: photo.name, credit: photo.credit })), ...media.videos.map(video => ({ id: video.id, title: video.title, credit: video.credit }))];
  return <><Header /><main id="main-content" className="legal-page">
    <p className="eyebrow">ORIGINAL DESIGN · TRANSPARENT SOURCES</p><h1>The story<br /><em>behind the images.</em></h1>
    <p>The included venue photographs and archival cricket clip are replaceable examples, not {academy.shortName} footage. Built-in academy profiles, achievements and quotations are fictional. Kohli and Warne appear only in licensed inspirational portraits; no endorsement or academy affiliation is implied. Owner-uploaded photographs, captions and identities must be accurate and used with permission.</p>
    {uploads.length > 0 && <section aria-label="Owner media credits"><h2>Owner-provided media</h2><p>Credits below were supplied by the owner. Permission and identities are not independently verified.</p>{uploads.map(upload => <article className="credit-card" key={upload.id}><h3>{upload.title}</h3><p>Creator / rights holder: {upload.credit}</p></article>)}</section>}
    <h2>Built-in sample assets</h2>
    <article className="credit-card"><h2>Coach-scroll photograph</h2><p>The coach photograph was supplied by the academy owner and published at their direction. The foreground cutout and background plate are derived from that photograph. It is not CC0; no redistribution license is granted for this photograph or its derivatives.</p></article>
    {Object.entries(programPhotos).map(([id, photo]) => <article className="credit-card" key={id}>
      <h2>Program photograph: {id.replaceAll("-", " ")}</h2>
      <p><strong>Creator:</strong> {photo.author}<br /><strong>License:</strong> <a href={photo.licenseUrl}>{photo.license}</a></p>
      <p>{photo.description} Downloaded from Wikimedia Commons, resized to 960px and converted to WebP. Real sample subjects, not academy players or premises; no endorsement is implied.</p>
      <a href={photo.source} rel="noopener noreferrer">Original source / license details ↗</a>
    </article>)}
    {mediaCredits.map(credit => <article className="credit-card" key={credit.name}><h2>{credit.name}</h2><p><strong>Creator:</strong> {credit.author}<br /><strong>License:</strong> <a href={credit.licenseUrl} rel="noopener noreferrer">{credit.license}</a></p><p>{credit.changes}</p><a href={credit.source} rel="noopener noreferrer">Original source / license details ↗</a></article>)}
    <h2>Asset limitations</h2><p>Default coach and player-story artwork is an original silhouette. The interactive players use an anatomical MakeHuman CC0 mesh, cricket clothing, a skeletal rig and original authored motion. They are generic athletes, not photorealistic scans, celebrity replicas or motion capture. The scenery is original procedural geometry. The 240p video is a playable archival sample reused across categories, not eight coaching lessons. Synthesized audio approximates brief contact and crowd texture.</p>
    <h2>Public edition</h2><p>This site has no upload or editing controls. Owner editing remains in the separate local application. The public repository includes only the approved coach-scene photograph and licensed built-in assets, not the private media catalogue. Preserve all attribution and share-alike requirements when reusing licensed media. <Link href="/privacy">Read the public privacy notice.</Link></p>
  </main><Footer /></>;
}

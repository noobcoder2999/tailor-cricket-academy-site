import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { academy, mediaCredits } from "../../content/academy";
import { publicMedia } from "../../lib/public-media";
import Link from "../../components/SiteLink";
import programPhotos from "../../content/program-photos.json";
export const metadata: Metadata = { title: "Media credits & sample content" };
export default async function Credits() {
  const media = publicMedia;
  const uploads = [...media.photos.map(photo => ({ id: photo.id, title: photo.name, credit: photo.credit })), ...media.videos.map(video => ({ id: video.id, title: video.title, credit: video.credit }))];
  return <><Header /><main id="main-content" className="legal-page">
    <p className="eyebrow">ORIGINAL DESIGN · TRANSPARENT SOURCES</p><h1>The story<br /><em>behind the images.</em></h1>
    <p>The included venue photographs and archival cricket clip are replaceable examples, not {academy.shortName} footage. Built-in academy profiles, achievements and quotations are fictional. Kohli and Warne appear only in licensed inspirational portraits; no endorsement or academy affiliation is implied. Owner-uploaded photographs, captions and identities must be accurate and used with permission.</p>
    <section id="academy-information"><h2>Academy information</h2><p>The academy owner supplied the address, coach profiles, contact details and statement that the ground is RCA-affiliated and hosts RCA matches. An independent public affiliation record was not available for verification. No founding year, selection record or qualification has been inferred.</p></section>
    {uploads.length > 0 && <section aria-label="Owner media credits"><h2>Academy photographs</h2><p>Photographer credits are recorded with each image. A credit does not replace permission to publish.</p>{uploads.map(upload => <article id={`media-${upload.id}`} className="credit-card" key={upload.id}><h3>{upload.title}</h3><p>Creator / rights holder: {upload.credit}</p></article>)}</section>}
    <h2 id="sample-assets">Built-in sample assets</h2>
    <article className="credit-card"><h2>Coach-scroll photograph</h2><p>The coach photograph was supplied by the academy owner and published at their direction. The foreground cutout and background plate are derived from that photograph. It is not CC0; no redistribution license is granted for this photograph or its derivatives.</p></article>
    {Object.entries(programPhotos).map(([id, photo]) => <article className="credit-card" key={id}>
      <h2>Program photograph: {id.replaceAll("-", " ")}</h2>
      <p><strong>Creator:</strong> {photo.author}<br /><strong>License:</strong> <a href={photo.licenseUrl}>{photo.license}</a></p>
      <p>{photo.description} Downloaded from Wikimedia Commons, resized to 960px and converted to WebP. Real sample subjects, not academy players or premises; no endorsement is implied.</p>
      <a href={photo.source} rel="noopener noreferrer">Original source / license details ↗</a>
    </article>)}
    {mediaCredits.map(credit => <article className="credit-card" key={credit.name}><h2>{credit.name}</h2><p><strong>Creator:</strong> {credit.author}<br /><strong>License:</strong> <a href={credit.licenseUrl} rel="noopener noreferrer">{credit.license}</a></p><p>{credit.changes}</p><a href={credit.source} rel="noopener noreferrer">Original source / license details ↗</a></article>)}
    <h2>Asset limitations</h2><p>Default coach and player-story artwork is an original silhouette. The interactive players use an anatomical MakeHuman CC0 mesh, cricket clothing, a skeletal rig and original authored motion. They are generic athletes, not photorealistic scans, celebrity replicas or motion capture. The scenery is original procedural geometry. The 240p video is a playable archival sample reused across categories, not eight coaching lessons. Synthesized audio approximates brief contact and crowd texture.</p>
    <h2>Deployment edition</h2><p>This static edition has no upload controls. Its display snapshot includes the photographs, coach profiles and academy contacts approved by the owner, but no enquiry records or secrets. Editing remains in the full Node application. Preserve all attribution and share-alike requirements. <Link href="/privacy">Read the privacy notice.</Link></p>
  </main><Footer /></>;
}

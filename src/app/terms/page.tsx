import type { Metadata } from "next";
import Link from "../../components/SiteLink";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
export const metadata: Metadata = { title: "Public preview terms" };
export default function Terms() {
  return <><Header /><main id="main-content" className="legal-page"><p className="eyebrow">PUBLIC CONCEPT WEBSITE</p><h1>Play fair.<br /><em>Know the limits.</em></h1>
    <h2>Read-only demonstration</h2><p>This is a public presentation of the Tailor Cricket Academy website concept. Profiles, programmes, schedules, selections, testimonials and tournament results labeled as samples are illustrative, not verified records or offers from an operating academy.</p>
    <h2>No bookings or payments</h2><p>This website does not collect enquiries, confirm sessions, accept payments or enter anyone into a tournament. Interactive enquiry controls only explain that limitation.</p>
    <h2>Cricket animation</h2><p>The coach background is a layered still photograph, not a reconstructed human or video recording. The cricket introduction and batting lab use generic procedural athletes and teaching approximations, not validated biomechanics or a substitute for qualified in-person coaching.</p>
    <h2>Media rights</h2><p>Licensed sample assets retain their attribution and license terms in <Link href="/credits">media credits</Link>. No depicted celebrity, player or venue endorses this concept. The owner-supplied coach photograph and its derivatives are not offered under an open license.</p>
    <h2>Before real operation</h2><p>Real academy services require verified content, operator contact details, appropriate safeguarding and approved legal policies. This read-only preview does not provide those services.</p><Link href="/#home" className="text-link">Return to the academy</Link>
  </main><Footer /></>;
}

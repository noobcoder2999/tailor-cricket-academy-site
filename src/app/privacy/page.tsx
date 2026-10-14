import type { Metadata } from "next";
import Link from "../../components/SiteLink";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
export const metadata: Metadata = { title: "Public preview privacy notice" };
export default function Privacy() {
  return <><Header /><main id="main-content" className="legal-page"><p className="eyebrow">GITHUB PAGES · READ-ONLY EDITION</p><h1>A public preview.<br /><em>Not a data form.</em></h1>
    <h2>No enquiries or uploads</h2><p>This edition does not request player names, ages, contact information, payments or photographs. Booking and enquiry buttons open an explanatory notice, not a submission form. There is no enquiry API, upload service, admin account or application database on this site.</p>
    <h2>Separate local application</h2><p>The owner&apos;s laptop application is separate. Its stored enquiries, private uploads and contact settings were not included in this publication. This website cannot access them.</p>
    <h2>Photographs and sample content</h2><p>The coach-scene photograph was supplied and approved for publication by the owner. Other included photos and models retain their documented licenses. Names, claims and testimonials labeled as sample content are not verified academy records. <Link href="/credits">Media credits</Link> identify sources and limitations.</p>
    <h2>Browser storage</h2><p>The optional cricket introduction uses the session-only preference <code>tailor-intro</code> to remember that it was seen. It contains no personal data. This application includes no analytics, advertising cookies or embedded map trackers.</p>
    <h2>Hosting</h2><p>GitHub Pages serves the files. GitHub may process technical request information, including IP addresses, under its own <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">privacy statement</a>. Following external attribution or repository links leaves this site.</p>
    <h2>Questions about published content</h2><p>Contact the repository owner through <a href="https://github.com/noobcoder2999/tailor-cricket-academy-site">GitHub</a>. Do not post sensitive personal details in public issues.</p>
    <Link href="/#home" className="text-link">Return to the academy</Link>
  </main><Footer /></>;
}

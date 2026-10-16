import Link from "../../components/SiteLink";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
export const metadata = { robots: { index: false, follow: false } };

export default function Editor() {
  return <><Header /><main id="main-content" className="legal-page"><h1>Editing stays<br /><em>with the owner.</em></h1><p>This static edition is read-only. It has no upload endpoint, admin login or enquiry database.</p><p>It includes the approved display photographs and academy contacts. Editing remains available in the separate full application through owner-only access.</p><Link href="/#home" className="button button-dark">Return to the academy</Link></main><Footer /></>;
}

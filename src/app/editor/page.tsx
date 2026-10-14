import Link from "../../components/SiteLink";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function Editor() {
  return <><Header /><main id="main-content" className="legal-page"><h1>Editing stays<br /><em>with the owner.</em></h1><p>This public GitHub Pages edition is read-only. It has no upload endpoint, admin login or enquiry database.</p><p>The separate laptop application retains local editing. No private media catalogue or stored enquiries were published.</p><Link href="/#home" className="button button-dark">Return to the academy</Link></main><Footer /></>;
}

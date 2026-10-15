import Link from "./SiteLink";

export default function CreditLink({ photoId, className = "" }: { photoId?: string; className?: string }) {
  return <Link className={`photo-credit-link ${className}`} href={`/credits#${photoId ? `media-${photoId}` : "sample-assets"}`}>Photo credits</Link>;
}

import type { AnchorHTMLAttributes } from "react";
import { sitePath } from "../lib/site";

export default function SiteLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} href={sitePath(href)} />;
}

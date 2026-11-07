"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/upload", "Upload"],
  ["/findings", "Findings"],
  ["/dashboard", "Dashboard"],
  ["/audit", "Audit log"],
];

export default function Nav() {
  const path = usePathname() || "";
  return (
    <nav>
      <Link href="/" className="logo">
        Bull<span>Dog</span> 🐶
      </Link>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={"l" + (path.startsWith(href) ? " on" : "")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

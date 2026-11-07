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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#635bff"/><path d="M7 15l3-6 2 4 2-4 3 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Bull<span>Dog</span>
      </Link>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={"l" + (path.startsWith(href) ? " on" : "")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

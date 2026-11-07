"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, money0 } from "@/lib/store";
import { Icon } from "@/components/ui";

const links = [
  ["/upload", "Upload", "upload"],
  ["/findings", "Findings", "find"],
  ["/dashboard", "Savings", "chart"],
  ["/audit", "Audit log", "log"],
];

export default function Nav({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const s = useStore();
  const open = s.findings.filter((f) => f.status === "pending");
  const total = s.findings.filter((f) => f.status === "pending" || f.status === "approved").reduce((a, f) => a + f.monthly, 0);
  const isOn = (h: string) => path.startsWith(h) || (h === "/findings" && path.startsWith("/live"));
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">
          <span className="mk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17l4-8 3 5 3-5 4 8" /></svg>
          </span>
          BullDog
        </Link>
        <div className="nav-label">Workspace</div>
        {links.map(([href, label, icon]) => (
          <Link key={href} href={href} className={"nl" + (isOn(href) ? " on" : "")}>
            <Icon n={icon} />
            {label}
            {href === "/findings" && open.length > 0 && <span className="cnt">{open.length}</span>}
          </Link>
        ))}
        <div className="foot">
          <div className="waste">
            <div className="l">Wasted per month</div>
            <div className="v">{money0(total)}</div>
            <div className="s">{money0(total * 12)} per year</div>
          </div>
        </div>
      </aside>
      <div className="content">
        <div className="mobbar">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={isOn(href) ? "on" : ""}>{label}</Link>
          ))}
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, money, money0 } from "@/lib/store";
import { Avatar, Icon, PageHeader } from "@/components/ui";

const TYPE: Record<string, string> = { idle_seats: "Idle seats", duplicate: "Duplicate charge", price_creep: "Price creep", trial: "Forgotten trial" };

export default function FindingsPage() {
  const s = useStore();
  const router = useRouter();
  const open = s.findings.filter((f) => f.status === "pending" || f.status === "approved");
  const total = open.reduce((a, f) => a + f.monthly, 0);
  const saved = s.findings.filter((f) => f.status === "done").reduce((a, f) => a + f.monthly, 0);
  const sorted = [...s.findings].sort((a, b) => b.monthly - a.monthly);

  return (
    <div>
      <PageHeader title="Findings" desc="Ranked by monthly savings. Nothing happens until you approve.">
        <Link href="/upload" className="btn ghost"><Icon n="upload" size={16} />Add data</Link>
      </PageHeader>

      <div className="hero">
        <div>
          <div className="l">Wasted per month</div>
          <div className="big">{money0(total)}</div>
          <div className="s">{money0(total * 12)} per year across {open.length} open findings</div>
          <div className="chips">
            {Array.from(new Set(open.map((f) => f.vendor))).map((v) => <span className="chip" key={v}>{v}</span>)}
          </div>
        </div>
        {saved > 0 && (
          <div style={{ textAlign: "right" }}>
            <div className="l">Already saved</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#6ee7b7" }}>{money0(saved)}/mo</div>
          </div>
        )}
      </div>

      {s.findings.length === 0 ? (
        <div className="card empty">
          <div className="ico"><Icon n="find" size={22} /></div>
          <b>No findings yet</b>
          <p className="sub" style={{ marginBottom: 16 }}>Upload documents and run detection.</p>
          <Link href="/upload" className="btn">Go to upload</Link>
        </div>
      ) : (
        <div className="card flush">
          <table>
            <thead><tr><th>Vendor</th><th>Issue</th><th className="r">Saving / mo</th><th>Status</th><th /></tr></thead>
            <tbody>
              {sorted.map((f) => (
                <tr className="click" key={f.id} onClick={() => router.push("/findings/" + encodeURIComponent(f.id))}>
                  <td><div className="vend"><Avatar name={f.vendor} /><b>{f.vendor}</b></div></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{f.title}</div>
                    <span className="tag" style={{ marginTop: 4 }}>{TYPE[f.type]}</span>
                  </td>
                  <td className="r amt">{money(f.monthly)}</td>
                  <td><span className={"pill " + f.status}>{f.status}</span></td>
                  <td className="r muted"><Icon n="arrow" size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

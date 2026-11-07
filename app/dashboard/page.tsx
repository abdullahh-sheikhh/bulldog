"use client";
import Link from "next/link";
import { useStore, money0 } from "@/lib/store";
import { Icon, PageHeader } from "@/components/ui";

function nextRenewal(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const now = new Date();
  while (d < now) d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}
const NAMES: Record<string, string> = { idle_seats: "Idle seats", duplicate: "Duplicates", price_creep: "Price creep", trial: "Forgotten trials" };

export default function Dashboard() {
  const s = useStore();
  const done = s.findings.filter((f) => f.status === "done");
  const open = s.findings.filter((f) => f.status === "pending" || f.status === "approved");
  const saved = done.reduce((a, f) => a + f.monthly, 0);
  const pot = open.reduce((a, f) => a + f.monthly, 0);
  const byType: Record<string, number> = {};
  s.findings.forEach((f) => (byType[f.type] = (byType[f.type] || 0) + f.monthly));
  const max = Math.max(1, ...Object.values(byType));
  const vendors = Array.from(new Set(s.items.map((i) => i.vendor)));
  const renewals = vendors
    .map((v) => {
      const last = s.items.filter((i) => i.vendor === v).sort((a, b) => a.date.localeCompare(b.date)).pop()!;
      const cancelled = done.some((f) => f.vendor === v && f.type === "trial");
      return { v, date: nextRenewal(last.date), amount: last.amount, cancelled };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <PageHeader title="Savings" desc="What BullDog has saved, and what is still on the table." />
      <div className="grid g4">
        <div className="card kpi"><div className="k"><span className="ic g"><Icon n="cash" size={15} /></span>Saved per month</div><div className="v" style={{ color: "#079455" }}>{money0(saved)}</div></div>
        <div className="card kpi"><div className="k"><span className="ic b"><Icon n="chart" size={15} /></span>Saved per year</div><div className="v">{money0(saved * 12)}</div></div>
        <div className="card kpi"><div className="k"><span className="ic w"><Icon n="alert" size={15} /></span>Still wasted / month</div><div className="v" style={{ color: "#b54708" }}>{money0(pot)}</div></div>
        <div className="card kpi"><div className="k"><span className="ic"><Icon n="check" size={15} /></span>Resolved</div><div className="v">{done.length}<span className="muted" style={{ fontSize: 18 }}> / {s.findings.length}</span></div></div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Waste by type, per month</h3>
          {Object.keys(byType).length === 0 && <p className="sub">No data yet.</p>}
          {Object.entries(byType).map(([k, v]) => (
            <div className="bar-row" key={k}>
              <span className="nm">{NAMES[k] || k}</span>
              <div className="tr"><div className="b" style={{ width: (v / max) * 100 + "%" }} /></div>
              <b className="amt">{money0(v)}</b>
            </div>
          ))}
        </div>
        <div className="card flush">
          <div className="ch"><h3>Upcoming renewals</h3></div>
          {renewals.length === 0 ? (
            <div className="empty"><p className="sub">Upload invoices to track renewals.</p></div>
          ) : (
            <table>
              <tbody>
                {renewals.map((r) => (
                  <tr key={r.v}>
                    <td style={{ fontWeight: 500 }}>{r.v}</td><td className="sub">{r.date}</td><td className="r amt">{money0(r.amount)}</td>
                    <td className="r">{r.cancelled ? <span className="pill done">cancelled</span> : <span className="pill">active</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {s.findings.length === 0 && <p className="sub" style={{ marginTop: 20 }}><Link href="/upload" style={{ color: "#4f46e5", fontWeight: 600 }}>Load sample data</Link> to see the dashboard fill up.</p>}
    </div>
  );
}

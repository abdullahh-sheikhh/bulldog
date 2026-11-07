"use client";
import Link from "next/link";
import { useStore, money0 } from "@/lib/store";

function nextRenewal(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const now = new Date();
  while (d < now) d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

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
      <h1>Savings dashboard</h1>
      <p className="sub">What BullDog has saved and what is still on the table.</p>
      <div className="grid g4">
        <div className="card stat"><div className="k">Saved per month</div><div className="v" style={{ color: "#22c55e" }}>{money0(saved)}</div></div>
        <div className="card stat"><div className="k">Saved per year</div><div className="v">{money0(saved * 12)}</div></div>
        <div className="card stat"><div className="k">Still wasted / month</div><div className="v" style={{ color: "#f5a524" }}>{money0(pot)}</div></div>
        <div className="card stat"><div className="k">Findings resolved</div><div className="v">{done.length} / {s.findings.length}</div></div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Waste by type (per month)</h3>
          {Object.keys(byType).length === 0 && <p className="sub">No data yet.</p>}
          {Object.entries(byType).map(([k, v]) => (
            <div className="bar-row" key={k}>
              <span style={{ width: 120 }}>{k.replace("_", " ")}</span>
              <div className="b" style={{ width: (v / max) * 220 }} />
              <b>{money0(v)}</b>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Upcoming renewals</h3>
          {renewals.length === 0 && <p className="sub">Upload invoices to track renewals.</p>}
          <table>
            <tbody>
              {renewals.map((r) => (
                <tr key={r.v}>
                  <td>{r.v}</td><td>{r.date}</td><td className="r">{money0(r.amount)}</td>
                  <td>{r.cancelled ? <span className="pill done">cancelled</span> : <span className="pill">active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {s.findings.length === 0 && <p className="sub" style={{ marginTop: 20 }}><Link href="/upload" style={{ color: "#f5a524" }}>Load sample data</Link> to see the dashboard fill up.</p>}
    </div>
  );
}

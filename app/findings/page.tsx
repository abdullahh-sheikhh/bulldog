"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, money, money0 } from "@/lib/store";

const TYPE: Record<string, string> = { idle_seats: "Idle seats", duplicate: "Duplicate charge", price_creep: "Price creep", trial: "Forgotten trial" };

export default function FindingsPage() {
  const s = useStore();
  const router = useRouter();
  const pending = s.findings.filter((f) => f.status === "pending" || f.status === "approved");
  const total = pending.reduce((a, f) => a + f.monthly, 0);

  return (
    <div>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div className="sub" style={{ margin: 0 }}>Wasted per month</div>
          <div className="big">{money0(total)}</div>
          <div className="sub" style={{ margin: 0 }}>{money0(total * 12)} per year · {pending.length} open findings</div>
        </div>
        <Link href="/upload" className="btn ghost">Upload more</Link>
      </div>

      {s.findings.length === 0 ? (
        <div className="card"><p className="sub">No findings yet. <Link href="/upload" style={{ color: "#f5a524" }}>Upload documents</Link> and run detection.</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Vendor</th><th>Type</th><th>Finding</th><th className="r">Saving / mo</th><th>Status</th></tr></thead>
            <tbody>
              {s.findings.map((f) => (
                <tr className="click" key={f.id} onClick={() => router.push("/findings/" + encodeURIComponent(f.id))}>
                  <td><b>{f.vendor}</b></td>
                  <td>{TYPE[f.type]}</td>
                  <td>{f.title}</td>
                  <td className="r"><b>{money(f.monthly)}</b></td>
                  <td><span className={"pill " + f.status}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore, setState, logAudit, money } from "@/lib/store";

export default function FindingDetail() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const s = useStore();
  const router = useRouter();
  const f = s.findings.find((x) => x.id === id);

  if (!f) return <div className="card"><p className="sub">Finding not found. <Link href="/findings" style={{ color: "#f5a524" }}>Back to findings</Link></p></div>;

  function decide(decision: "approved" | "rejected") {
    setState((st) =>
      logAudit(
        { ...st, findings: st.findings.map((x) => (x.id === id ? { ...x, status: decision, decidedAt: new Date().toISOString() } : x)) },
        "you",
        "finding_" + decision,
        f!.vendor + ": " + f!.title
      )
    );
    if (decision === "approved") router.push("/live/" + encodeURIComponent(id));
    else router.push("/findings");
  }

  return (
    <div>
      <Link href="/findings" className="sub">← All findings</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "12px 0 20px" }}>
        <div>
          <h1>{f.vendor}: {f.title}</h1>
          <p className="sub">{f.summary}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="big" style={{ fontSize: 34 }}>{money(f.monthly)}</div>
          <div className="sub" style={{ margin: 0 }}>wasted per month</div>
        </div>
      </div>

      <div className="grid g2">
        {f.evidence.map((e) => (
          <div key={e.title} className={"card" + (e.tone === "bad" ? " bad" : "")}>
            <h3 style={{ marginTop: 0 }}>{e.title}</h3>
            {e.rows.map(([k, v]) => (
              <div className="kv" key={k}><span>{k}</span><span>{v}</span></div>
            ))}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="sub" style={{ margin: "0 0 4px" }}>Proposed action</div>
        <b style={{ fontSize: 18 }}>{f.actionLabel}</b>
        <p className="sub" style={{ margin: "6px 0 16px" }}>Nothing runs until you approve. Every step is logged in the audit log.</p>
        {f.status === "pending" ? (
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn" onClick={() => decide("approved")}>Approve & execute</button>
            <button className="btn bad" onClick={() => decide("rejected")}>Reject</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className={"pill " + f.status}>{f.status}</span>
            {(f.status === "approved" || f.status === "done") && <Link className="btn ghost" href={"/live/" + encodeURIComponent(f.id)}>Open live panel</Link>}
          </div>
        )}
      </div>
    </div>
  );
}

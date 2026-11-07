"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore, setState, logAudit, money } from "@/lib/store";
import { Avatar, Icon } from "@/components/ui";

export default function FindingDetail() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const s = useStore();
  const router = useRouter();
  const f = s.findings.find((x) => x.id === id);

  if (!f) return <div className="card empty"><b>Finding not found</b><p className="sub"><Link href="/findings" style={{ color: "#4f46e5" }}>Back to findings</Link></p></div>;

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
      <Link href="/findings" className="crumb"><Icon n="back" size={16} />All findings</Link>
      <div className="ph" style={{ alignItems: "flex-start" }}>
        <div className="vend" style={{ alignItems: "flex-start" }}>
          <div style={{ transform: "scale(1.3)", transformOrigin: "top left", marginRight: 8 }}><Avatar name={f.vendor} /></div>
          <div>
            <h1>{f.vendor}: {f.title}</h1>
            <p style={{ maxWidth: 620 }}>{f.summary}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.02em" }}>{money(f.monthly)}</div>
          <div className="muted">wasted per month</div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, color: "#8a94a6", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 12px" }}>Evidence</h3>
      <div className="grid g2">
        {f.evidence.map((e) => (
          <div key={e.title} className={"ev" + (e.tone === "bad" ? " bad" : "")}>
            <div className="eh"><Icon n={e.tone === "bad" ? "alert" : "file"} size={16} />{e.title}</div>
            <div className="eb">
              {e.rows.map(([k, v]) => (
                <div className="kv" key={k}><span>{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="action">
        <div>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Proposed action</div>
          <b>{f.actionLabel}</b>
          <p className="sub" style={{ marginTop: 2 }}>Nothing runs until you approve. Every step is written to the audit log.</p>
        </div>
        {f.status === "pending" ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bad" onClick={() => decide("rejected")}>Reject</button>
            <button className="btn lg" onClick={() => decide("approved")}><Icon n="check" size={16} />Approve & execute</button>
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

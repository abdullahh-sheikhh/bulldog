"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, setState, getState, logAudit, money } from "@/lib/store";
import { buildScript, buildRun } from "@/lib/portals";
import type { Step } from "@/lib/types";

export default function LivePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const s = useStore();
  const f = s.findings.find((x) => x.id === id);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  const script = f ? buildScript(f) : null;
  const finished = !!f?.action;

  useEffect(() => {
    if (!f || !script || started.current) return;
    if (f.action) { setShown(f.action.steps.length); return; }
    if (f.status !== "approved") return;
    started.current = true;
    setState((st) => logAudit(st, "agent", "action_started", f.vendor + ": " + f.actionLabel));
    const done: Step[] = [];
    let i = 0;
    const tick = () => {
      const st = script.steps[i];
      done.push({ ...st, at: new Date().toISOString() });
      setShown(i + 1);
      setState((x) => logAudit(x, "agent", "step", f.vendor + " · " + st.label));
      i++;
      if (i < script.steps.length) setTimeout(tick, 1100);
      else {
        const run = buildRun(f, done, script.behavior);
        setState((x) =>
          logAudit(
            { ...x, findings: x.findings.map((y) => (y.id === id ? { ...y, status: "done", action: run } : y)) },
            "agent",
            run.mode === "email" ? "email_drafted" : "action_confirmed",
            f.vendor + (run.confirmation ? " · " + run.confirmation : " · fallback email drafted")
          )
        );
      }
    };
    setTimeout(tick, 600);
    // eslint-disable-next-line
  }, [f?.id, f?.status]);

  if (!f || !script) return <div className="card"><p className="sub">Finding not found. <Link href="/findings" style={{ color: "#f5a524" }}>Back</Link></p></div>;

  const steps = f.action ? f.action.steps : script.steps;
  const cur = Math.min(shown, steps.length) - 1;
  const screen = cur >= 0 ? steps[cur] : null;

  if (f.status === "pending") return <div className="card"><p className="sub">This finding is not approved yet. <Link href={"/findings/" + encodeURIComponent(f.id)} style={{ color: "#f5a524" }}>Review it</Link></p></div>;

  return (
    <div>
      <Link href="/findings" className="sub">← All findings</Link>
      <h1 style={{ marginTop: 12 }}>Agent working: {f.vendor}</h1>
      <p className="sub">{f.actionLabel} · approved by you · {money(f.monthly)}/mo</p>
      <div className="grid g2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Step timeline</h3>
          <ul className="tl">
            {steps.map((st, i) => (
              <li key={i} className={(i < shown ? "on " : "") + (i === cur && !finished ? "cur" : "")}>
                <span className="dot">{i < shown ? "✓" : i + 1}</span>
                <div><div>{st.label}</div>{st.detail && i < shown && <div className="sub" style={{ margin: 0, fontSize: 12 }}>{st.detail}</div>}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="browser">
            <div className="bar">🔒 https://{script.url}/billing</div>
            <div className="body">
              {screen ? (
                <>
                  <h2>{screen.screen}</h2>
                  {screen.detail && <p style={{ color: "#4b5563" }}>{screen.detail}</p>}
                </>
              ) : (
                <p style={{ color: "#6b7280" }}>Starting…</p>
              )}
              {f.action?.mode === "portal" && f.action.confirmation && (
                <div className="shot">
                  <b>✔ Confirmation {f.action.confirmation}</b>
                  <div style={{ fontSize: 13 }}>{f.actionLabel} · screenshot captured {new Date(f.action.finishedAt).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          </div>
          {f.action?.mode === "email" && f.action.email && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="err" style={{ marginTop: 0 }}>The portal blocked automation. BullDog drafted an email instead; nothing was sent.</div>
              <div className="kv"><span>To</span><span>{f.action.email.to}</span></div>
              <div className="kv"><span>Subject</span><span>{f.action.email.subject}</span></div>
              <pre style={{ marginTop: 12 }}>{f.action.email.body}</pre>
            </div>
          )}
          {f.status === "done" && (
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <Link href="/dashboard" className="btn">See savings →</Link>
              <Link href="/audit" className="btn ghost">Audit log</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

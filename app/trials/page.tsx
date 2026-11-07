"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, setState, logAudit, money, money0 } from "@/lib/store";
import { Avatar, Icon, PageHeader } from "@/components/ui";
import { daysLeft } from "@/lib/email";
import type { Finding, Trial } from "@/lib/types";

export default function TrialsPage() {
  const s = useStore();
  const router = useRouter();
  const list = [...s.trials].sort((a, b) => a.endsOn.localeCompare(b.endsOn));
  const active = list.filter((t) => t.status === "active");
  const soon = active.filter((t) => daysLeft(t.endsOn) <= 7 && daysLeft(t.endsOn) >= 0);
  const soonCost = soon.reduce((a, t) => a + t.priceAfter, 0);

  function stop(t: Trial) {
    const d = daysLeft(t.endsOn);
    const fid = "trialstop_" + t.id;
    const f: Finding = {
      id: fid,
      type: "trial",
      vendor: t.vendor,
      title: "Free trial ends in " + d + " day" + (d === 1 ? "" : "s"),
      summary: "This trial converts to a paid plan on " + t.endsOn + ". Cancel it before the first charge.",
      monthly: t.priceAfter,
      recommendation: "Cancel before it converts",
      actionLabel: "Cancel free trial",
      evidence: [
        { title: "Trial", rows: [["Vendor", t.vendor], ["Started", t.startedOn], ["Ends", t.endsOn], ["Days left", String(d)]] },
        { title: "If not cancelled", tone: "bad", rows: [["First charge", t.endsOn], ["Monthly cost", money(t.priceAfter)]] },
      ],
      status: "pending",
    };
    setState((st) =>
      logAudit(
        { ...st, findings: [...st.findings.filter((x) => x.id !== fid), f], trials: st.trials.map((x) => (x.id === t.id ? { ...x, status: "stop_requested", findingId: fid } : x)) },
        "you",
        "trial_stop_requested",
        t.vendor + " trial, " + d + " days left"
      )
    );
    router.push("/findings/" + encodeURIComponent(fid));
  }
  function mark(t: Trial, status: Trial["status"]) {
    setState((st) => logAudit({ ...st, trials: st.trials.map((x) => (x.id === t.id ? { ...x, status } : x)) }, "you", "trial_" + status, t.vendor));
  }

  return (
    <div>
      <PageHeader title="Free trials" desc="Trials found in your email, with the days left before they turn into paid plans." />
      {soon.length > 0 && (
        <div className="hero" style={{ background: "linear-gradient(135deg,#7f1d1d,#b42318)" }}>
          <div>
            <div className="l" style={{ color: "#fecaca" }}>Ending within 7 days</div>
            <div className="big">{soon.length} trial{soon.length > 1 ? "s" : ""}</div>
            <div className="s" style={{ color: "#fecaca" }}>{money0(soonCost)} per month if you do nothing</div>
          </div>
        </div>
      )}
      {list.length === 0 ? (
        <div className="card empty">
          <div className="ico"><Icon n="mail" size={22} /></div>
          <b>No trials yet</b>
          <p className="sub" style={{ marginBottom: 16 }}>Connect Gmail or upload .eml files on the Upload page. Load sample data to see examples.</p>
          <Link href="/upload" className="btn">Go to upload</Link>
        </div>
      ) : (
        <div className="card flush">
          <table>
            <thead><tr><th>Vendor</th><th>Ends</th><th>Days left</th><th className="r">Then / mo</th><th /></tr></thead>
            <tbody>
              {list.map((t) => {
                const d = daysLeft(t.endsOn);
                const col = d <= 3 ? "#d92d20" : d <= 7 ? "#b54708" : "#079455";
                const bg = d <= 3 ? "#fef3f2" : d <= 7 ? "#fffaeb" : "#ecfdf3";
                return (
                  <tr key={t.id}>
                    <td><div className="vend"><Avatar name={t.vendor} /><div><b>{t.vendor}</b><div className="sub" style={{ fontSize: 12 }}>{t.product}</div></div></div></td>
                    <td className="sub">{t.endsOn}</td>
                    <td>{t.status === "active" ? <span style={{ background: bg, color: col, fontWeight: 700, borderRadius: 99, padding: "3px 12px" }}>{d < 0 ? "ended" : d === 0 ? "today" : d + " day" + (d === 1 ? "" : "s")}</span> : <span className={"pill " + (t.status === "stop_requested" ? "approved" : "")}>{t.status.replace("_", " ")}</span>}</td>
                    <td className="r amt">{money(t.priceAfter)}</td>
                    <td className="r">
                      {t.status === "active" ? (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="btn ghost" onClick={() => mark(t, "kept")}>Keep</button>
                          <button className="btn" onClick={() => stop(t)}>Stop trial</button>
                        </div>
                      ) : t.findingId ? (
                        <Link className="btn ghost" href={"/findings/" + encodeURIComponent(t.findingId)}>View finding</Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

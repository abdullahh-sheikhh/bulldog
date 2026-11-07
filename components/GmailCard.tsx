"use client";
import { useEffect, useState } from "react";
import { ingestEmails, type RawEmail } from "@/lib/email";
import { Icon } from "@/components/ui";

const KEY = "bulldog.gmail";

const SCRIPT = [
  "const TOKEN = '__TOKEN__';",
  "",
  "function doGet(e) {",
  "  if (!e.parameter.token || e.parameter.token !== TOKEN) return out({ error: 'unauthorized' });",
  "  const days = Number(e.parameter.days || 30);",
  "  const q = 'newer_than:' + days + 'd (invoice OR receipt OR \"free trial\" OR trial OR subscription OR renewal OR \"your payment\")';",
  "  const emails = [];",
  "  GmailApp.search(q, 0, 40).forEach(function (t) {",
  "    t.getMessages().forEach(function (m) {",
  "      emails.push({ id: m.getId(), subject: m.getSubject(), from: m.getFrom(), date: m.getDate().toISOString(), body: m.getPlainBody().slice(0, 4000) });",
  "    });",
  "  });",
  "  return out({ emails: emails.slice(0, 80) });",
  "}",
  "",
  "function out(o) {",
  "  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);",
  "}",
].join("\n");

function rnd() {
  return Array.from({ length: 24 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");
}

export default function GmailCard() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      setUrl(v.url || "");
      setToken(v.token || rnd());
    } catch {
      setToken(rnd());
    }
  }, []);
  useEffect(() => {
    if (token) localStorage.setItem(KEY, JSON.stringify({ url, token }));
  }, [url, token]);

  async function scan() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const res = await fetch(url.trim() + (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token) + "&days=" + days);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const r = ingestEmails(data.emails as RawEmail[]);
      setMsg("Scanned " + r.scanned + " emails: " + r.items + " charges, " + r.trials + " trials found, " + r.skipped + " skipped, " + r.dup + " already imported.");
    } catch (e: any) {
      setErr("Could not read Gmail: " + (e?.message || "failed") + ". Check the web app URL, that access is set to Anyone, and that the token matches.");
    }
    setBusy(false);
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="vend">
          <span className="ic"><Icon n="mail" size={16} /></span>
          <div>
            <h3 style={{ margin: 0 }}>Connect Gmail</h3>
            <p className="sub">Finds invoices and free trials in your inbox. Read-only, runs in your own Google account.</p>
          </div>
        </div>
        <button className="btn ghost" onClick={() => setHelp(!help)}>{help ? "Hide setup" : "Setup (2 min)"}</button>
      </div>

      {help && (
        <div style={{ marginTop: 16 }}>
          <ol className="sub" style={{ paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Open <b>script.google.com</b> and create a new project.</li>
            <li>Replace the code with the script below.</li>
            <li>Click <b>Deploy, New deployment, Web app</b>. Execute as <b>Me</b>, who has access: <b>Anyone</b>. Approve the Gmail permission.</li>
            <li>Paste the Web app URL below and click Scan.</li>
          </ol>
          <pre style={{ maxHeight: 200, overflow: "auto", marginTop: 8 }}>{SCRIPT.replace("__TOKEN__", token)}</pre>
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(SCRIPT.replace("__TOKEN__", token)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? "Copied" : "Copy script"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid #d0d5dd", borderRadius: 9, font: "inherit" }} />
        <select value={days} onChange={(e) => setDays(+e.target.value)} style={{ padding: "9px 12px", border: "1px solid #d0d5dd", borderRadius: 9, font: "inherit", background: "#fff" }}>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button className="btn" onClick={scan} disabled={busy || !url.trim()}>{busy ? "Scanning…" : "Scan Gmail"}</button>
      </div>
      {msg && <p style={{ color: "#079455", fontWeight: 600, marginTop: 12 }}>{msg}</p>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, setState, getState, logAudit, resetAll, uid } from "@/lib/store";
import { runDetection } from "@/lib/detect";
import { sampleState } from "@/lib/sample";
import { parseCsvFile, pdfText, parseInvoiceText } from "@/lib/extract";
import type { Doc } from "@/lib/types";

export default function UploadPage() {
  const s = useStore();
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFiles(files: FileList | File[]) {
    const errs: string[] = [];
    for (const file of Array.from(files)) {
      setBusy("Extracting " + file.name + "…");
      const docId = uid("doc");
      try {
        let kind: Doc["kind"] = "invoice";
        if (file.name.toLowerCase().endsWith(".csv")) {
          const parsed = parseCsvFile(await file.text(), docId);
          if (parsed.kind === "card") {
            kind = "card";
            setState((st) => ({ ...st, card: [...st.card, ...parsed.card] }));
          } else if (parsed.kind === "usage") {
            kind = "usage";
            setState((st) => ({ ...st, usage: [...st.usage, ...parsed.usage] }));
          }
        } else {
          const { text, first } = await pdfText(file);
          const item = parseInvoiceText(text, first, docId);
          setState((st) => ({ ...st, items: [...st.items, item] }));
        }
        setState((st) =>
          logAudit({ ...st, docs: [...st.docs, { id: docId, name: file.name, kind, addedAt: new Date().toISOString() }] }, "system", "document_extracted", file.name + " (" + kind + ")")
        );
      } catch (e: any) {
        errs.push(file.name + ": " + (e?.message || "failed"));
      }
    }
    setBusy("");
    setErrors(errs);
  }

  function detectNow() {
    setState((st) => {
      const findings = runDetection(st);
      return logAudit({ ...st, findings }, "system", "detection_run", findings.length + " findings from " + st.docs.length + " documents");
    });
    router.push("/findings");
  }

  function loadSample() {
    resetAll();
    const sm = sampleState();
    setState((st) => logAudit({ ...st, ...sm }, "system", "sample_loaded", sm.docs.length + " sample documents"));
    detectNow();
  }

  return (
    <div>
      <h1>Upload spend data</h1>
      <p className="sub">Drop invoices (PDF), card statements and usage exports (CSV). BullDog reads them in your browser and finds the waste.</p>
      <div
        className={"drop" + (over ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <p style={{ fontSize: 18, margin: "0 0 12px", color: "#e6ebf5" }}>Drag & drop invoices and CSVs here</p>
        <label className="btn ghost">
          Choose files
          <input type="file" multiple accept=".pdf,.csv" hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>
        {busy && <p style={{ color: "#f5a524" }}>{busy}</p>}
      </div>
      {errors.map((e) => (
        <div className="err" key={e}>{e}</div>
      ))}

      <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
        <button className="btn" onClick={detectNow} disabled={!s.docs.length}>Find waste →</button>
        <button className="btn ghost" onClick={loadSample}>Load sample data</button>
        <button className="btn ghost" onClick={() => { resetAll(); setErrors([]); }}>Reset demo</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Documents ({s.docs.length})</h3>
        {s.docs.length === 0 ? (
          <p className="sub">Nothing uploaded yet.</p>
        ) : (
          <table>
            <thead><tr><th>File</th><th>Type</th><th>Extracted</th></tr></thead>
            <tbody>
              {s.docs.map((d) => {
                const it = s.items.find((i) => i.docId === d.id);
                const detail = d.kind === "invoice" && it ? it.vendor + " · " + it.invoiceNo + " · " + it.qty + " × $" + it.unitPrice : d.kind === "card" ? s.card.filter((c) => c.docId === d.id).length + " transactions" : s.usage.filter((u) => u.docId === d.id).length + " seats";
                return (
                  <tr key={d.id}><td>{d.name}</td><td><span className="pill">{d.kind}</span></td><td>{detail}</td></tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

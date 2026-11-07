"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, setState, logAudit, resetAll, uid } from "@/lib/store";
import { runDetection } from "@/lib/detect";
import { sampleState } from "@/lib/sample";
import { parseCsvFile, pdfText, parseInvoiceText } from "@/lib/extract";
import type { Doc } from "@/lib/types";
import { Icon, PageHeader } from "@/components/ui";

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

  const hasDocs = s.docs.length > 0;
  return (
    <div>
      <PageHeader title="Find wasted spend" desc="Upload invoices, card statements and usage exports. Everything is read in your browser.">
        <button className="btn ghost" onClick={() => { resetAll(); setErrors([]); }}><Icon n="reset" size={16} />Reset</button>
        <button className="btn ghost" onClick={loadSample}><Icon n="sparkle" size={16} />Load sample data</button>
      </PageHeader>

      <div className="steps">
        <div className={"st " + (hasDocs ? "dn" : "on")}><span className="n">{hasDocs ? "✓" : 1}</span>Upload</div><span className="ln" />
        <div className={"st " + (hasDocs ? "on" : "")}><span className="n">2</span>Detect waste</div><span className="ln" />
        <div className="st"><span className="n">3</span>Approve & act</div>
      </div>

      <div
        className={"drop" + (over ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="ico"><Icon n="upload" size={22} /></div>
        <h3>Drag and drop files here</h3>
        <p className="sub" style={{ marginBottom: 16 }}>PDF invoices, card statement CSVs and usage CSVs</p>
        <label className="btn ghost" style={{ cursor: "pointer" }}>
          Choose files
          <input type="file" multiple accept=".pdf,.csv" hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>
        {busy && <p style={{ color: "#4f46e5", fontWeight: 600, marginTop: 14 }}>{busy}</p>}
      </div>
      {errors.map((e) => <div className="err" key={e}>{e}</div>)}

      <div className="card flush" style={{ marginTop: 20 }}>
        <div className="ch">
          <h3>Documents ({s.docs.length})</h3>
          <button className="btn" onClick={detectNow} disabled={!hasDocs}>Find waste<Icon n="arrow" size={16} /></button>
        </div>
        {!hasDocs ? (
          <div className="empty">
            <div className="ico"><Icon n="file" size={22} /></div>
            <b>No documents yet</b>
            <p className="sub">Upload files above, or load sample data to see BullDog in action.</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>File</th><th>Type</th><th>Extracted</th></tr></thead>
            <tbody>
              {s.docs.map((d) => {
                const it = s.items.find((i) => i.docId === d.id);
                const detail = d.kind === "invoice" && it ? it.vendor + " · " + it.invoiceNo + " · " + it.qty + " × $" + it.unitPrice : d.kind === "card" ? s.card.filter((c) => c.docId === d.id).length + " transactions" : s.usage.filter((u) => u.docId === d.id).length + " seats";
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td><span className="tag">{d.kind}</span></td>
                    <td className="sub">{detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import type { LineItem, CardTx, UsageRow } from "./types";
import { uid } from "./store";

const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

function toIso(s: string): string {
  const m = s.match(/([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return s;
  return m[3] + "-" + MONTHS[m[1]] + "-" + m[2].padStart(2, "0");
}

const num = (s: string) => parseFloat(s.replace(/,/g, ""));

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    const row: Record<string, string> = {};
    head.forEach((h, i) => (row[h] = (cells[i] || "").trim()));
    return row;
  });
}

export type Parsed =
  | { kind: "card"; card: CardTx[] }
  | { kind: "usage"; usage: UsageRow[] }
  | { kind: "invoice"; item: LineItem };

export function parseCsvFile(text: string, docId: string): Parsed {
  const rows = parseCsv(text);
  if (rows[0] && "seat_id" in rows[0]) {
    return {
      kind: "usage",
      usage: rows.map((r) => ({ docId, vendor: r.vendor, seatId: r.seat_id, email: r.user_email || "", lastActive: r.last_active || "" })),
    };
  }
  if (rows[0] && "description" in rows[0] && "amount" in rows[0]) {
    return {
      kind: "card",
      card: rows.map((r) => ({ id: uid("tx"), docId, date: r.date, description: r.description, amount: num(r.amount) })),
    };
  }
  throw new Error("Unrecognised CSV columns. Expected card (date,description,amount) or usage (vendor,seat_id,user_email,last_active).");
}

export async function pdfText(file: File): Promise<{ text: string; first: string }> {
  // @ts-ignore
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  let first = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strs = content.items.map((i: any) => i.str).filter((s: string) => s.trim());
    if (!first && strs.length) first = strs[0].trim();
    text += strs.join(" ") + " ";
  }
  return { text: text.replace(/\s+/g, " "), first };
}

export function parseInvoiceText(text: string, first: string, docId: string): LineItem {
  const invoiceNo = (text.match(/Invoice no\.?\s*([A-Z0-9-]+)/i) || [])[1] || "UNKNOWN";
  const issue = (text.match(/Issue date\s*([A-Z][a-z]{2,8} \d{1,2}, \d{4})/) || [])[1];
  const row = text.match(/Amount\s+(.*?)\s+(\d+)\s+\$([\d,]+\.\d\d)\s+\$([\d,]+\.\d\d)/);
  if (!row || !issue) throw new Error("Could not read this invoice (expected the BullDog sample invoice layout).");
  const product = row[1].split(" — ")[0].trim();
  const bank = /bank transfer/i.test(text) && !/Visa|Mastercard/i.test(text);
  return {
    id: uid("li"),
    docId,
    vendor: first,
    product,
    invoiceNo,
    date: toIso(issue),
    qty: parseInt(row[2], 10),
    unitPrice: num(row[3]),
    amount: num(row[4]),
    payment: bank ? "bank" : "card",
    trial: /free trial ended|converted to paid/i.test(text),
  };
}

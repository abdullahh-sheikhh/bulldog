import type { LineItem, Trial, Doc } from "./types";
import { uid, setState, logAudit, getState } from "./store";

export type RawEmail = { id: string; subject: string; from: string; date: string; body: string };

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());

function dateFromText(s: string): string | null {
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  m = s.match(/([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return m[3] + "-" + pad(MONTHS[m[1].slice(0, 3).toLowerCase()]) + "-" + pad(+m[2]);
  m = s.match(/(\d{1,2}) ([A-Za-z]{3,9})\.? (\d{4})/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return m[3] + "-" + pad(MONTHS[m[2].slice(0, 3).toLowerCase()]) + "-" + pad(+m[1]);
  return null;
}

function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

const toNum = (s: string) => parseFloat(s.replace(/,/g, ""));

export function vendorOf(from: string): string {
  const name = (from.match(/^"?([^"<]+?)"?\s*</) || [])[1] || "";
  const cleaned = name.replace(/\b(billing|team|support|no-?reply|receipts?|invoices?|payments?|notifications?|the)\b/gi, "").replace(/\s+/g, " ").trim();
  if (cleaned) return cleaned;
  const dom = (from.match(/@([A-Za-z0-9.-]+)/) || [])[1] || "Unknown";
  const parts = dom.split(".");
  const base = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export type Parsed = { trial?: Trial; item?: LineItem };

export function parseEmail(e: RawEmail): Parsed | null {
  const text = e.subject + "\n" + e.body;
  const sentOn = (dateFromText(e.date) || iso(new Date(e.date)) || iso(new Date()));
  const vendor = vendorOf(e.from);

  const isTrial = /free trial|your trial|trial (will )?(end|expire)|trial period/i.test(text) && !/trial (has )?(ended|converted)|converted to paid/i.test(text);
  if (isTrial) {
    let endsOn: string | null = null;
    const em = text.match(/(?:ends?|expires?|ending|expiring|until|through)\s*(?:on\s*)?([A-Za-z]{3,9}\.? \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2} [A-Za-z]{3,9}\.? \d{4})/i);
    if (em) endsOn = dateFromText(em[1]);
    if (!endsOn) {
      const inN = text.match(/in (\d{1,2}) days/i);
      if (inN) endsOn = addDays(sentOn, +inN[1]);
    }
    if (!endsOn) {
      const dayTrial = text.match(/(\d{1,3})[- ]day (?:free )?trial/i);
      if (dayTrial) endsOn = addDays(sentOn, +dayTrial[1]);
    }
    if (endsOn) {
      const pm = text.match(/(?:then|after|will be charged|billed|only|continue at)[^$\d]{0,40}\$\s?([\d,]+(?:\.\d\d)?)/i) || text.match(/\$\s?([\d,]+(?:\.\d\d)?)/);
      return {
        trial: { id: uid("tr"), vendor, product: e.subject.slice(0, 70), startedOn: sentOn, endsOn, priceAfter: pm ? toNum(pm[1]) : 0, status: "active", source: "email:" + e.id },
      };
    }
  }

  if (/invoice|receipt|payment|charged|renewal|subscription/i.test(text)) {
    const tm = text.match(/(?:total|amount (?:paid|due)|charged|you paid)[^$\d]{0,25}\$\s?([\d,]+(?:\.\d\d)?)/i) || text.match(/\$\s?([\d,]+(?:\.\d\d)?)/);
    if (tm) {
      const total = toNum(tm[1]);
      const inv = (text.match(/(?:invoice|receipt)\s*(?:no\.?|number|#)\s*:?\s*([A-Z0-9-]{4,})/i) || [])[1] || e.id;
      return {
        item: { id: uid("li"), docId: "", vendor, product: e.subject.slice(0, 60), invoiceNo: inv, date: sentOn, qty: 1, unitPrice: total, amount: total, payment: "card", trial: /trial converted|after (your )?trial/i.test(text) },
      };
    }
  }
  return null;
}

export function ingestEmails(emails: RawEmail[]) {
  const have = getState().docs.map((d) => d.name).join("\n");
  let items = 0, trials = 0, skipped = 0, dup = 0;
  const newDocs: Doc[] = [], newItems: LineItem[] = [], newTrials: Trial[] = [];
  for (const e of emails) {
    if (have.includes("[email:" + e.id + "]")) { dup++; continue; }
    const p = parseEmail(e);
    if (!p) { skipped++; continue; }
    const docId = uid("doc");
    newDocs.push({ id: docId, name: e.subject.slice(0, 60) + " [email:" + e.id + "]", kind: "invoice", addedAt: new Date().toISOString() });
    if (p.item) { newItems.push({ ...p.item, docId }); items++; }
    if (p.trial) {
      const dupTrial = getState().trials.some((t) => t.vendor === p.trial!.vendor && t.endsOn === p.trial!.endsOn);
      if (!dupTrial) { newTrials.push(p.trial); trials++; }
    }
  }
  setState((st) =>
    logAudit(
      { ...st, docs: [...st.docs, ...newDocs], items: [...st.items, ...newItems], trials: [...st.trials, ...newTrials] },
      "system",
      "email_import",
      emails.length + " emails: " + items + " charges, " + trials + " trials, " + skipped + " skipped, " + dup + " already imported"
    )
  );
  return { scanned: emails.length, items, trials, skipped, dup };
}

function qp(s: string) {
  return s.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function decodeBody(headers: string, body: string) {
  let b = body;
  if (/content-transfer-encoding:\s*quoted-printable/i.test(headers)) b = qp(b);
  else if (/content-transfer-encoding:\s*base64/i.test(headers)) {
    try { b = decodeURIComponent(escape(atob(b.replace(/\s+/g, "")))); } catch { try { b = atob(b.replace(/\s+/g, "")); } catch { /* keep */ } }
  }
  if (/text\/html/i.test(headers)) b = b.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return b.replace(/[ \t]+/g, " ").trim();
}

export function parseEml(raw: string, fallbackId: string): RawEmail {
  const split = raw.search(/\r?\n\r?\n/);
  const headers = (split > 0 ? raw.slice(0, split) : raw).replace(/\r?\n[ \t]+/g, " ");
  let body = split > 0 ? raw.slice(split).trim() : "";
  const h = (n: string) => (headers.match(new RegExp("^" + n + ":\\s*(.*)$", "im")) || [])[1] || "";
  const bm = headers.match(/boundary="?([^";\s]+)"?/i);
  if (bm) {
    const parts = body.split("--" + bm[1]);
    let chosen = "";
    for (const part of parts) {
      const ps = part.search(/\r?\n\r?\n/);
      if (ps < 0) continue;
      const ph = part.slice(0, ps);
      if (/text\/plain/i.test(ph)) { chosen = decodeBody(ph, part.slice(ps).trim()); break; }
      if (/text\/html/i.test(ph) && !chosen) chosen = decodeBody(ph, part.slice(ps).trim());
    }
    body = chosen || body;
  } else body = decodeBody(headers, body);
  return {
    id: (h("Message-ID").replace(/[<>\s]/g, "") || fallbackId).slice(0, 60),
    subject: h("Subject") || "(no subject)",
    from: h("From"),
    date: h("Date") ? new Date(h("Date")).toISOString() : new Date().toISOString(),
    body: body.slice(0, 6000),
  };
}

export function parseMbox(raw: string): RawEmail[] {
  return raw.split(/^From .*$/m).map((s) => s.trim()).filter(Boolean).map((s, i) => parseEml(s, "mbox" + i + "_" + s.length));
}

export function daysLeft(endsOn: string) {
  const end = new Date(endsOn + "T23:59:59").getTime();
  return Math.ceil((end - Date.now()) / 864e5);
}

import type { State, Finding, LineItem, CardTx } from "./types";
import { money } from "./store";

const DAY = 86400000;
const t = (d: string) => new Date(d + "T00:00:00Z").getTime();

function vendorMatches(vendor: string, text: string) {
  return text.toLowerCase().includes(vendor.toLowerCase().split(" ")[0]);
}

export function detect(s: State): Finding[] {
  const out: Finding[] = [];
  const vendors = Array.from(new Set(s.items.map((i) => i.vendor)));

  // 1. Idle seats: usage rows vs invoiced seats
  const usageVendors = Array.from(new Set(s.usage.map((u) => u.vendor)));
  for (const v of usageVendors) {
    const rows = s.usage.filter((u) => u.vendor === v);
    const dates = rows.map((r) => r.lastActive).filter(Boolean).sort();
    if (!dates.length) continue;
    const ref = t(dates[dates.length - 1]);
    const cutoff = ref - 30 * DAY;
    const idle = rows.filter((r) => !r.lastActive || t(r.lastActive) < cutoff);
    const inv = s.items.filter((i) => vendorMatches(v, i.vendor)).sort((a, b) => a.date.localeCompare(b.date));
    const latest = inv[inv.length - 1];
    if (!latest || idle.length === 0) continue;
    const monthly = idle.length * latest.unitPrice;
    const active = rows.length - idle.length;
    out.push({
      id: "idle_seats:" + latest.vendor,
      type: "idle_seats",
      vendor: latest.vendor,
      title: idle.length + " idle " + latest.product + " seats",
      summary: idle.length + " of " + rows.length + " paid seats have had no activity in 30+ days.",
      monthly,
      recommendation: "downgrade",
      actionLabel: "Reduce seats " + rows.length + " → " + active,
      status: "pending",
      evidence: [
        {
          title: "Invoice " + latest.invoiceNo,
          rows: [
            ["Plan", latest.product],
            ["Seats billed", String(latest.qty)],
            ["Unit price", money(latest.unitPrice)],
            ["Monthly total", money(latest.amount)],
          ],
        },
        {
          title: "Usage export (last activity)",
          tone: "bad",
          rows: [
            ["Active seats", String(active)],
            ["Idle seats (30+ days)", String(idle.length)],
            ["Never signed in", String(idle.filter((r) => !r.lastActive).length)],
            ["Examples", idle.slice(0, 3).map((r) => r.email.split("@")[0] + " (" + (r.lastActive || "never") + ")").join(", ")],
            ["Wasted per month", money(monthly)],
          ],
        },
      ],
    });
  }

  // 2. Duplicate charges: invoice paid by bank transfer AND charged on the card
  for (const it of s.items.filter((i) => i.payment === "bank")) {
    const tx = s.card.find(
      (c) => vendorMatches(it.vendor, c.description) && Math.abs(c.amount - it.amount) < 0.01 && Math.abs(t(c.date) - t(it.date)) <= 10 * DAY
    );
    if (!tx) continue;
    out.push({
      id: "duplicate:" + it.vendor,
      type: "duplicate",
      vendor: it.vendor,
      title: "Duplicate charge of " + money(it.amount),
      summary: "Invoice " + it.invoiceNo + " is payable by bank transfer, but the card was also charged the same amount.",
      monthly: it.amount,
      recommendation: "refund",
      actionLabel: "Request refund of " + money(it.amount),
      status: "pending",
      evidence: [
        {
          title: "Invoice " + it.invoiceNo,
          rows: [
            ["Date", it.date],
            ["Amount", money(it.amount)],
            ["Payment method", "Bank transfer"],
          ],
        },
        {
          title: "Card statement",
          tone: "bad",
          rows: [
            ["Date", tx.date],
            ["Description", tx.description],
            ["Amount", money(tx.amount)],
            ["Result", "Same amount charged twice"],
          ],
        },
      ],
    });
  }
  // duplicate card charges for same merchant within 5 days
  for (let i = 0; i < s.card.length; i++) {
    for (let j = i + 1; j < s.card.length; j++) {
      const a = s.card[i], b = s.card[j];
      if (a.description === b.description && Math.abs(a.amount - b.amount) < 0.01 && Math.abs(t(a.date) - t(b.date)) <= 5 * DAY) {
        const v = vendors.find((x) => vendorMatches(x, a.description)) || a.description;
        if (out.some((f) => f.id === "duplicate:" + v)) continue;
        out.push({
          id: "duplicate:" + v,
          type: "duplicate",
          vendor: v,
          title: "Duplicate card charge of " + money(a.amount),
          summary: "Two identical charges within 5 days.",
          monthly: a.amount,
          recommendation: "refund",
          actionLabel: "Request refund of " + money(a.amount),
          status: "pending",
          evidence: [
            { title: "Charge 1", rows: [["Date", a.date], ["Amount", money(a.amount)]] },
            { title: "Charge 2", tone: "bad", rows: [["Date", b.date], ["Amount", money(b.amount)]] },
          ],
        });
      }
    }
  }

  // 3. Price creep: unit price rose across invoices
  for (const v of vendors) {
    const inv = s.items.filter((i) => i.vendor === v).sort((a, b) => a.date.localeCompare(b.date));
    if (inv.length < 2) continue;
    const first = inv[0], last = inv[inv.length - 1];
    if (last.unitPrice <= first.unitPrice + 0.001) continue;
    const monthly = (last.unitPrice - first.unitPrice) * last.qty;
    out.push({
      id: "price_creep:" + v,
      type: "price_creep",
      vendor: v,
      title: "Price creep: " + money(first.unitPrice) + " → " + money(last.unitPrice) + " per seat",
      summary: "Unit price rose across " + inv.length + " invoices with no plan change.",
      monthly,
      recommendation: "renegotiate",
      actionLabel: "Request price lock at " + money(first.unitPrice) + "/seat",
      status: "pending",
      evidence: [
        {
          title: "Invoice history",
          rows: inv.map((i) => [i.date + " · " + i.invoiceNo, money(i.unitPrice) + " × " + i.qty] as [string, string]),
        },
        {
          title: "Impact",
          tone: "bad",
          rows: [
            ["Original price", money(first.unitPrice)],
            ["Current price", money(last.unitPrice)],
            ["Seats", String(last.qty)],
            ["Extra per month", money(monthly)],
          ],
        },
      ],
    });
  }

  // 4. Forgotten trials converted to paid
  for (const it of s.items.filter((i) => i.trial)) {
    const tx: CardTx | undefined = s.card.find((c) => vendorMatches(it.vendor, c.description) && Math.abs(c.amount - it.amount) < 0.01);
    out.push({
      id: "trial:" + it.vendor,
      type: "trial",
      vendor: it.vendor,
      title: "Free trial converted to paid (" + money(it.amount) + "/mo)",
      summary: "A trial ended and the plan auto-renewed; no usage recorded.",
      monthly: it.amount,
      recommendation: "cancel",
      actionLabel: "Cancel " + it.product,
      status: "pending",
      evidence: [
        { title: "Invoice " + it.invoiceNo, rows: [["Date", it.date], ["Plan", it.product], ["Amount", money(it.amount)], ["Note", "Free trial ended, converted to paid"]] },
        { title: "Card statement", tone: "bad", rows: tx ? [["Date", tx.date], ["Description", tx.description], ["Amount", money(tx.amount)]] : [["Card charge", "not in uploaded statement"]] },
      ],
    });
  }

  return out.sort((a, b) => b.monthly - a.monthly);
}

export function runDetection(s: State): Finding[] {
  const fresh = detect(s);
  return fresh.map((f) => {
    const prev = s.findings.find((p) => p.id === f.id);
    return prev ? { ...f, status: prev.status, decidedAt: prev.decidedAt, action: prev.action } : f;
  });
}

export type { LineItem };

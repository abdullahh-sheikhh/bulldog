import type { State, LineItem, CardTx, UsageRow, Doc } from "./types";

function item(docId: string, vendor: string, product: string, invoiceNo: string, date: string, qty: number, unit: number, payment: "card" | "bank", trial = false): LineItem {
  return { id: "li_" + invoiceNo, docId, vendor, product, invoiceNo, date, qty, unitPrice: unit, amount: qty * unit, payment, trial };
}

export function sampleState(): Pick<State, "docs" | "items" | "card" | "usage"> {
  const now = new Date().toISOString();
  const docs: Doc[] = [
    ["d1", "github-copilot-2026-09.pdf", "invoice"],
    ["d2", "github-copilot-2026-10.pdf", "invoice"],
    ["d3", "github-copilot-2026-11.pdf", "invoice"],
    ["d4", "slackline-2026-11.pdf", "invoice"],
    ["d5", "zentrack-2026-09.pdf", "invoice"],
    ["d6", "zentrack-2026-10.pdf", "invoice"],
    ["d7", "zentrack-2026-11.pdf", "invoice"],
    ["d8", "pixelforge-2026-10.pdf", "invoice"],
    ["d9", "card-statement-2026-11.csv", "card"],
    ["d10", "github-copilot-usage.csv", "usage"],
  ].map(([id, name, kind]) => ({ id, name, kind, addedAt: now }) as Doc);

  const items: LineItem[] = [
    item("d1", "GitHub", "GitHub Copilot Business", "GH-1042881", "2026-09-03", 50, 19, "card"),
    item("d2", "GitHub", "GitHub Copilot Business", "GH-1058317", "2026-10-03", 50, 19, "card"),
    item("d3", "GitHub", "GitHub Copilot Business", "GH-1073904", "2026-11-03", 50, 19, "card"),
    item("d4", "Slackline", "Slackline Business", "SL-2026-118442", "2026-11-03", 12, 20, "bank"),
    item("d5", "Zentrack", "Team plan", "ZT-90311", "2026-09-03", 10, 40, "bank"),
    item("d6", "Zentrack", "Team plan", "ZT-91877", "2026-10-03", 10, 46, "bank"),
    item("d7", "Zentrack", "Team plan", "ZT-93502", "2026-11-03", 10, 55, "bank"),
    item("d8", "Pixelforge", "Pixelforge Pro", "PF-2026-55120", "2026-10-28", 1, 99, "card", true),
  ];

  const cardRows: [string, string, number][] = [
    ["2026-09-03", "GITHUB.COM COPILOT BUSINESS", 950],
    ["2026-10-03", "GITHUB.COM COPILOT BUSINESS", 950],
    ["2026-11-03", "GITHUB.COM COPILOT BUSINESS", 950],
    ["2026-09-03", "LINEAR.APP", 96],
    ["2026-10-03", "LINEAR.APP", 96],
    ["2026-11-03", "LINEAR.APP", 96],
    ["2026-09-03", "FIGMA PROFESSIONAL", 120],
    ["2026-10-03", "FIGMA PROFESSIONAL", 120],
    ["2026-11-03", "FIGMA PROFESSIONAL", 120],
    ["2026-11-03", "SLACKLINE*SUBSCRIPTION", 240],
    ["2026-10-28", "PIXELFORGE PRO - TRIAL CONVERTED", 99],
  ];
  const card: CardTx[] = cardRows.map(([date, description, amount], i) => ({ id: "tx_" + i, docId: "d9", date, description, amount }));

  const usage: UsageRow[] = [];
  for (let i = 1; i <= 50; i++) {
    const active = i <= 10;
    usage.push({
      docId: "d10",
      vendor: "GitHub",
      seatId: "seat-" + i,
      email: "dev" + i + "@acme.example",
      lastActive: active ? "2026-11-0" + (1 + (i % 6)) : i % 5 === 2 ? "" : "2026-0" + (5 + (i % 3)) + "-1" + (i % 9),
    });
  }
  return { docs, items, card, usage };
}

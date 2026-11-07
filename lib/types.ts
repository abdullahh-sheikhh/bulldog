export type Doc = { id: string; name: string; kind: "invoice" | "card" | "usage"; addedAt: string };

export type LineItem = {
  id: string;
  docId: string;
  vendor: string;
  product: string;
  invoiceNo: string;
  date: string; // ISO yyyy-mm-dd
  qty: number;
  unitPrice: number;
  amount: number;
  payment: "card" | "bank";
  trial: boolean;
};

export type CardTx = { id: string; docId: string; date: string; description: string; amount: number };
export type UsageRow = { docId: string; vendor: string; seatId: string; email: string; lastActive: string };

export type Evidence = { title: string; rows: [string, string][]; tone?: "bad" | "neutral" };

export type Step = { label: string; at: string; screen: string; detail?: string };

export type ActionRun = {
  portal: string;
  behavior: string;
  mode: "portal" | "email";
  steps: Step[];
  confirmation?: string;
  email?: { to: string; subject: string; body: string };
  finishedAt: string;
};

export type Finding = {
  id: string;
  type: "idle_seats" | "duplicate" | "price_creep" | "trial";
  vendor: string;
  title: string;
  summary: string;
  monthly: number;
  recommendation: string;
  actionLabel: string;
  evidence: Evidence[];
  status: "pending" | "approved" | "rejected" | "done";
  decidedAt?: string;
  action?: ActionRun;
};

export type Audit = { id: string; at: string; actor: string; event: string; detail: string };

export type State = {
  docs: Doc[];
  items: LineItem[];
  card: CardTx[];
  usage: UsageRow[];
  findings: Finding[];
  audit: Audit[];
};

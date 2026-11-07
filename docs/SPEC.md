# BullDog

BullDog finds wasted software spend (unused seats, duplicate charges/tools, price creep, forgotten trials), ranks findings by monthly savings, and cuts them after admin approval using a simulated action agent.

Pipeline: ingest invoices, card statements and usage CSVs (or seed demo data) -> LLM extraction and vendor normalization -> evidence-backed detectors -> approval queue (admins only) -> scripted action agent driving mock vendor portals in a live panel with step timeline and generated confirmation screenshots (email draft fallback when a portal blocks automation) -> savings dashboard, renewals and audit log. Nothing is acted on without admin approval; every action is logged.

## Shared Types in scope
```ts
interface FindingSummary {
  id: string;
  type: 'unused_seats' | 'duplicate_charge' | 'duplicate_tool' | 'price_creep' | 'forgotten_subscription';
  vendor: string;
  title: string;
  monthly_saving: number;
  confidence: number;
  evidence_summary: string;
  evidence_json: string;
  recommended_action: 'cancel' | 'downgrade' | 'refund';
  status: 'pending' | 'approved' | 'rejected' | 'actioned';
  decided_by: string | null;
  decided_at: string | null;
  detected_at: string;
}
```

## Entities
```ts
interface SourceDocument {
  id: string;
  name: string;
  kind: 'invoice_pdf' | 'invoice_csv' | 'card_csv' | 'usage_csv';
  file: FileRef;
  status: 'uploaded' | 'extracted' | 'failed';
  error: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

interface LineItem {
  id: string;
  document_id: string | null;
  vendor_raw: string;
  vendor: string;
  plan: string | null;
  seats: number | null;
  unit_price: number | null;
  total: number;
  charge_date: string;
  period_start: string | null;
  period_end: string | null;
  source: 'invoice' | 'card';
  is_trial: boolean;
  description: string | null;
}

interface UsageRecord {
  id: string;
  vendor: string;
  seat_id: string;
  user_email: string;
  last_active: string | null;
}

interface Finding {
  id: string;
  type: 'unused_seats' | 'duplicate_charge' | 'duplicate_tool' | 'price_creep' | 'forgotten_subscription';
  vendor: string;
  title: string;
  monthly_saving: number;
  confidence: number;
  evidence_summary: string;
  evidence_json: string;
  recommended_action: 'cancel' | 'downgrade' | 'refund';
  status: 'pending' | 'approved' | 'rejected' | 'actioned';
  decided_by: string | null;
  decided_at: string | null;
  detected_at: string;
}

interface AgentAction {
  id: string;
  finding_id: string;
  portal_id: string | null;
  method: 'portal' | 'email';
  status: 'requested' | 'cancelled' | 'confirmed';
  steps_json: string;
  email_draft: string | null;
  confirmation_screenshot: FileRef | null;
  confirmation_code: string | null;
  started_by: string;
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  finding_id: string | null;
  action_id: string | null;
  details: string;
}

interface Renewal {
  id: string;
  vendor: string;
  plan: string | null;
  renewal_date: string;
  amount: number;
  cadence: 'monthly' | 'annual';
  cancelled: boolean;
}

interface MockVendorPortal {
  id: string;
  slug: string;
  vendor: string;
  behavior: 'retention_screen' | 'reason_dropdown' | 'blocks_automation';
  plan: string;
  seats: number;
  monthly_cost: number;
  status: 'active' | 'downgraded' | 'cancelled';
  contact_email: string;
}
```

**Table names:** `source _document` (Source Document), `line _item` (Line Item), `usage _record` (Usage Record), `finding` (Finding), `agent _action` (Agent Action), `audit _log _entry` (Audit Log Entry), `renewal` (Renewal), `mock _vendor _portal` (Mock Vendor Portal)

## APIs
**Files with call_api / call_streaming_api** (also from run_typescript):
- A `FileRef` in a result — at any depth, entities and lists included — arrives as a file object `{ fileRef, filePath: "filerefs/<id>", filename, mimeType, size }` (filename, mimeType and size when its metadata could be read; `missing: true` when this workspace has no such file). Read, analyze or copy the file at `filePath`; to show it to the user, `copy_file` it into `artifacts/` and `present_files` that.
- A `FileRef` parameter takes `{ filePath: "<any readable VFS path, e.g. artifacts/report.pdf>" }` (uploaded for the call; optional `filename` / `mimeType`), a file object from a previous result as-is, or an existing FileRef id. A plain path string is not a FileRef.
- `run_sql` rows hold the bare FileRef id; the file is at `filerefs/<id>`.

```ts
// Seed script: loads all demo data, idempotently (clears previous demo data first).
seedDemoData(request: void): { lineItems: number; usageRecords: number }

// Registers an uploaded file (already stored via built-in file upload) as a source document.
registerDocument(request: { name: string; kind: 'invoice_pdf' | 'invoice_csv' | 'card_csv' | 'usage_csv'; file: FileRef }): { documentId: string }

// Parses a source document into line items or usage records.
extractDocument(request: { documentId: string }): { itemsCreated: number; status: string }

// Runs all waste detectors and replaces pending findings.
runDetection(request: void): { findingsCreated: number; totalMonthlySaving: number }

// Lists findings ranked by monthly saving with running totals.
listFindings(request: { status?: 'pending' | 'approved' | 'rejected' | 'actioned' }): { findings: FindingSummary[]; wastedPerMonth: number }

// Finding detail with evidence and any action.
getFinding(request: { findingId: string }): { finding: Finding; action?: AgentAction | null }

// Approve or reject a finding. Admin only.
decideFinding(request: { findingId: string; decision: 'approve' | 'reject' }): { status: string }

// Scripted action agent: executes an approved finding against its mock vendor portal and records timeline steps.
runAction(request: { findingId: string }): { actionId: string; method: string; status: string }

// Returns an action with its timeline for the live panel replay, plus portal state.
getAction(request: { actionId: string }): { action: AgentAction; portal?: MockVendorPortal | null }

// Returns a mock vendor portal's state for rendering the portal pages.
getPortal(request: { slug: string }): { portal: MockVendorPortal }

// Upcoming auto-renewals.
listRenewals(request: void): { renewals: Renewal[] }

// Savings dashboard data.
getDashboard(request: void): { savingsPerMonth: number; savingsPerYear: number; pendingPerMonth: number; byType: { type: string; monthlySaving: number }[] }

// Audit log entries, newest first.
listAuditLog(request: { limit?: number }): { entries: AuditLogEntry[] }

// Lists uploaded documents.
listDocuments(request: void): { documents: SourceDocument[] }
```

## Pages
- **Upload** `/bulldog/upload` - Upload screen
- **Findings** `/bulldog/findings` - Approval queue
- **Finding Detail** `/bulldog/finding/:findingId` - Finding detail with side-by-side evidence
- **Live Agent** `/bulldog/live/:findingId` - Live panel of the simulated agent cancel flow
- **Mock Vendor Portal** `/bulldog/portal/:slug` - Mock vendor portal (login, plan, cancel flow)
- **Dashboard** `/bulldog/dashboard` - Savings dashboard

## Features
- **Ingest invoices, statements and usage** - Upload invoices (PDF/CSV), card statements (CSV) and usage CSVs, or load seeded demo data.
- **Extract and normalize line items** - LLM parses PDFs into line items; vendor names are normalized (e.g. GH Copilot Business = GitHub).
- **Detect waste with evidence** - Detectors for unused seats, duplicates, price creep, forgotten subscriptions/trials; each finding has monthly saving, confidence and evidence.
- **Renewal tracker** - Upcoming auto-renewals with dates and amounts.
- **Approval queue** - Findings ranked by monthly savings; only workspace admins can approve or reject.
- **Simulated action agent** - Scripted agent drives mock vendor portals step by step with a timeline and generated confirmation screenshot; email draft fallback.
- **Savings dashboard and audit log** - Savings per month/year, breakdown by type, renewals and audit log.
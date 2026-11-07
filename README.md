# BullDog

AI that finds wasted software spend (unused seats, duplicate charges/tools, price creep, forgotten trials) and cuts it after admin approval.

Built on Luo. The app runs in the Luo workspace; this repo holds its specification and demo notes.

## Pipeline
Ingest (invoices, card CSV, usage) -> LLM extraction + vendor normalization -> evidence-backed detectors -> admin approval queue -> simulated action agent (mock vendor portals, step timeline, confirmation screenshot, email fallback) -> savings dashboard, renewals, audit log.

## Demo (3 min)
1. Run the seed, then detection: 4 findings, about $1,249/month wasted.
2. Open Copilot finding: 50 seats billed, 10 active, 40 idle 60+ days.
3. Approve (admin only), watch the live panel cancel flow (retention screen declined).
4. Show dashboard: savings per month/year, by type, audit log.

## Seeded waste
- GitHub Copilot: 40 of 50 seats idle ($760/mo)
- Slackline: duplicate charge ($240)
- Zentrack: price creep 40 -> 46 -> 55 ($150/mo)
- Pixelforge: trial converted to paid ($99/mo)

## Notes
- The action agent is scripted/simulated; no real browser automation or vendor accounts are touched.
- Nothing is acted on without admin approval; every action is audit-logged.

See [docs/SPEC.md](docs/SPEC.md) for entities, APIs and pages.

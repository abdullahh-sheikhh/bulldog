import type { Finding, ActionRun, Step } from "./types";

type Behavior = "retention_screen" | "reason_dropdown" | "blocks_automation" | "simple";

const BEHAVIOR: Record<string, Behavior> = {
  github: "retention_screen",
  zentrack: "reason_dropdown",
  slackline: "blocks_automation",
  pixelforge: "simple",
};

export function behaviorFor(f: Finding): Behavior {
  return BEHAVIOR[f.vendor.toLowerCase()] || "simple";
}

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).toUpperCase().padStart(8, "0");
}

export function buildScript(f: Finding): { behavior: Behavior; url: string; steps: Omit<Step, "at">[]; blocked: boolean } {
  const b = behaviorFor(f);
  const host = "billing." + f.vendor.toLowerCase() + ".example";
  const base: Omit<Step, "at">[] = [
    { label: "Open vendor billing portal", screen: "Sign in to " + f.vendor, detail: "https://" + host },
    { label: "Sign in with service account", screen: "Signed in as billing-bot@acme.example", detail: "Credentials from the vault, never shown" },
    { label: "Navigate to Billing → Manage plan", screen: "Billing overview", detail: f.title },
  ];
  if (b === "retention_screen")
    return {
      behavior: b,
      url: host,
      blocked: false,
      steps: [
        ...base,
        { label: "Start change: " + f.actionLabel, screen: "Change your plan", detail: f.actionLabel },
        { label: "Retention screen detected: discount offer", screen: "Wait! Stay and get 10% off", detail: "Policy: decline promotional offers, continue" },
        { label: "Decline offer and continue", screen: "Confirm changes", detail: f.actionLabel },
        { label: "Submit change", screen: "Processing…" },
        { label: "Capture confirmation", screen: "Change confirmed", detail: "Savings " + "$" + f.monthly + "/mo" },
      ],
    };
  if (b === "reason_dropdown")
    return {
      behavior: b,
      url: host,
      blocked: false,
      steps: [
        ...base,
        { label: "Open: " + f.actionLabel, screen: "Contact billing / change plan" },
        { label: "Required reason dropdown: select 'Too expensive'", screen: "Reason: [Too expensive ▾]", detail: "Chosen from 6 options" },
        { label: "Add note with evidence", screen: "Note to billing team", detail: "Unit price rose with no plan change" },
        { label: "Submit request", screen: "Processing…" },
        { label: "Capture confirmation", screen: "Request received", detail: "Ticket opened with billing" },
      ],
    };
  if (b === "blocks_automation")
    return {
      behavior: b,
      url: host,
      blocked: true,
      steps: [
        ...base.slice(0, 1),
        { label: "Sign in with service account", screen: "Verify you are human", detail: "CAPTCHA challenge" },
        { label: "Automation blocked by bot detection", screen: "Access denied (bot detected)", detail: "Will not attempt to bypass" },
        { label: "Fall back: draft email to vendor billing", screen: "Email drafted for your review" },
      ],
    };
  return {
    behavior: b,
    url: host,
    blocked: false,
    steps: [
      ...base,
      { label: "Open: " + f.actionLabel, screen: "Cancel subscription" },
      { label: "Confirm cancellation", screen: "Are you sure?" },
      { label: "Capture confirmation", screen: "Subscription cancelled", detail: "No further charges" },
    ],
  };
}

export function buildRun(f: Finding, steps: Step[], behavior: string): ActionRun {
  const blocked = behavior === "blocks_automation";
  const run: ActionRun = {
    portal: f.vendor,
    behavior,
    mode: blocked ? "email" : "portal",
    steps,
    finishedAt: new Date().toISOString(),
  };
  if (blocked) {
    run.email = {
      to: "billing@" + f.vendor.toLowerCase() + ".example",
      subject: "Billing issue: " + f.title,
      body:
        "Hello " + f.vendor + " billing team,\n\nWe noticed the following on our account: " +
        f.summary + "\n\nRequested action: " + f.actionLabel +
        ".\nEstimated monthly impact: $" + f.monthly.toFixed(2) +
        ".\n\nPlease confirm once processed.\n\nThanks,\nAcme Robotics Accounts Payable",
    };
  } else {
    run.confirmation = "CNF-" + hash(f.id);
  }
  return run;
}

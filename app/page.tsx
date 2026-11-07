import Link from "next/link";
import { Icon } from "@/components/ui";

const steps = [
  ["Ingest", "Drop in invoices, card statements and usage exports, or connect Gmail to pull in receipts and trial emails."],
  ["Extract", "BullDog reads vendor, plan, seats, price and dates from every document and email, right in your browser."],
  ["Detect", "Four detectors look for idle seats, duplicate charges, price creep and forgotten trials, and show the evidence."],
  ["Approve & act", "You approve each finding. An agent then cancels or downgrades it in the vendor portal, and logs every step."],
];

const detectors = [
  ["find", "Unused seats", "Compares seats you pay for against who actually logged in. Flags licences nobody has touched in 60+ days."],
  ["cash", "Duplicate charges", "Spots the same vendor billed twice, or two tools doing the same job, across invoices and card statements."],
  ["chart", "Price creep", "Tracks unit price month over month and flags quiet increases you never agreed to."],
  ["alert", "Forgotten trials", "Finds free trials in your inbox and counts down the days, so you can stop them before the first charge."],
];

export default function Landing() {
  return (
    <div className="lp">
      <div className="lp-nav">
        <Link href="/" className="brand">
          <span className="mk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17l4-8 3 5 3-5 4 8" /></svg></span>
          BullDog
        </Link>
        <Link href="/upload" className="btn">Open the app<Icon n="arrow" size={16} /></Link>
      </div>

      <section className="lp-hero">
        <div className="lp-wrap">
          <span className="lp-badge"><Icon n="sparkle" size={14} />Nothing happens without your approval</span>
          <h1>Stop paying for software <em>nobody uses</em></h1>
          <p>BullDog finds unused seats, duplicate charges, price hikes and forgotten free trials, shows you the proof, and cancels them once you say yes.</p>
          <div className="lp-cta">
            <Link href="/upload" className="btn lg">Try it with sample data<Icon n="arrow" size={16} /></Link>
            <a href="#how" className="btn lg ghost">See how it works</a>
          </div>

          <div className="lp-mock">
            <div className="bar"><i /><i /><i /></div>
            <div className="in">
              <div className="hero" style={{ margin: 0 }}>
                <div>
                  <div className="l">Wasted per month</div>
                  <div className="big">$1,249</div>
                  <div className="s">$14,988 per year across 4 open findings</div>
                </div>
              </div>
              <table style={{ marginTop: 12 }}>
                <tbody>
                  {[["GitHub", "50 Copilot seats, 38 idle", "$760", "pending"], ["Slackline", "Billed twice in November", "$240", "pending"], ["Zentrack", "Price up 37% in 3 months", "$150", "approved"], ["Pixelforge", "Free trial converted to paid", "$99", "done"]].map((r) => (
                    <tr key={r[0]}><td><b>{r[0]}</b></td><td className="sub">{r[1]}</td><td className="r amt">{r[2]}</td><td className="r"><span className={"pill " + r[3]}>{r[3]}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec" id="how">
        <div className="lp-wrap">
          <div className="lp-h"><h2>From inbox to savings in four steps</h2><p>One pipeline, with a human decision before anything is changed.</p></div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div className="card lp-step" key={s[0]}>
                <div className="num">{i + 1}</div>
                <h3>{s[0]}</h3>
                <p>{s[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec alt">
        <div className="lp-wrap">
          <div className="lp-h"><h2>Four detectors, each with evidence</h2><p>Every finding shows what you were billed next to what actually happened.</p></div>
          <div className="lp-feat">
            {detectors.map((d) => (
              <div className="card" key={d[1]}>
                <h3><span className="ic"><Icon n={d[0]} size={16} /></span>{d[1]}</h3>
                <p>{d[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-trust">
            <div>
              <h2>You stay in control</h2>
              <p>BullDog never cancels, downgrades or emails a vendor on its own. It proposes, you approve, and the audit log records everything.</p>
            </div>
            <ul>
              <li><span>✓</span>Every action waits in an approval queue</li>
              <li><span>✓</span>Every finding links to its evidence</li>
              <li><span>✓</span>Every step is written to an audit log</li>
              <li><span>✓</span>Your files are read in your browser and stay on your device</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap">
          <h2>See what you are wasting</h2>
          <p className="sub" style={{ marginBottom: 24, fontSize: 17 }}>Load the sample data and watch the full flow in about three minutes.</p>
          <Link href="/upload" className="btn lg">Try it with sample data<Icon n="arrow" size={16} /></Link>
        </div>
      </section>
      <div className="lp-foot">BullDog, built for a hackathon demo. Savings figures in the demo come from sample data.</div>
    </div>
  );
}

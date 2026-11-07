import React from "react";

const P: Record<string, string> = {
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  find: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  log: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  back: "M15 18l-6-6 6-6",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  cash: "M12 2v20m5-16H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  alert: "M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  file: "M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5zm0 0v5h5",
  reset: "M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8m0-5v5h5",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
};

export function Icon({ n, size = 18 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={P[n] || P.file} />
    </svg>
  );
}

const COLORS = ["#4f46e5", "#0891b2", "#db2777", "#ea580c", "#059669", "#7c3aed", "#0f766e", "#b45309"];
export function Avatar({ name }: { name: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return <div className="av" style={{ background: COLORS[h % COLORS.length] }}>{name.slice(0, 1).toUpperCase()}</div>;
}

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="ph">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>{children}</div>
    </div>
  );
}

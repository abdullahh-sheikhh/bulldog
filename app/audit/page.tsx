"use client";
import { useStore } from "@/lib/store";

export default function AuditPage() {
  const s = useStore();
  return (
    <div>
      <h1>Audit log</h1>
      <p className="sub">Every approval and every agent step, in order.</p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Detail</th></tr></thead>
          <tbody>
            {s.audit.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.at).toLocaleTimeString()}</td>
                <td><span className="pill">{a.actor}</span></td>
                <td>{a.event}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
            {s.audit.length === 0 && <tr><td colSpan={4} className="sub">No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

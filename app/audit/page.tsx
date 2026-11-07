"use client";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";

export default function AuditPage() {
  const s = useStore();
  return (
    <div>
      <PageHeader title="Audit log" desc="Every approval and every agent step, in order." />
      <div className="card flush">
        <table>
          <thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Detail</th></tr></thead>
          <tbody>
            {s.audit.map((a) => (
              <tr key={a.id}>
                <td className="sub" style={{ whiteSpace: "nowrap" }}>{new Date(a.at).toLocaleTimeString()}</td>
                <td><span className="tag">{a.actor}</span></td>
                <td style={{ fontWeight: 500 }}>{a.event.replace(/_/g, " ")}</td>
                <td className="sub">{a.detail}</td>
              </tr>
            ))}
            {s.audit.length === 0 && <tr><td colSpan={4} className="sub" style={{ textAlign: "center", padding: 40 }}>No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

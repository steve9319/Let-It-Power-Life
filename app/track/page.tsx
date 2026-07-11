import { myRequestsAction } from "@/app/actions/public";
import { StatusTracker } from "@/components/StatusTracker";
import { TrackGate } from "./TrackGate";

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const result = await myRequestsAction();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Track Your Request</h1>
      {!result.ok ? (
        <>
          <p className="text-navy/70 mb-8">Verify your email to view the status of your requests.</p>
          <TrackGate />
        </>
      ) : (
        <>
          <p className="text-navy/70 mb-8">
            Showing requests for <strong>{result.email}</strong>.
          </p>
          {result.requests.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/60">
              No requests found for this email yet.{" "}
              <a href="/request" className="text-teal underline">Submit one here</a>.
            </div>
          )}
          <div className="space-y-6">
            {result.requests.map((r) => (
              <div key={r.requestId} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-teal-dark">{r.requestId}</span>
                    <span className="text-navy/50 text-sm ml-3">
                      {new Date(r.submittedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <DecisionBadge decision={r.decision} />
                </div>
                <div className="text-sm text-navy/70 mt-2">
                  {r.items.map((i, idx) => (
                    <div key={idx}>
                      {i.model} — requested {i.requested}
                      {r.decision === "Approved" && i.approved != null && (
                        <span className="text-teal-dark font-semibold"> · approved {i.approved}</span>
                      )}
                    </div>
                  ))}
                  {r.finalRecipientOrg && (
                    <div className="mt-1 text-navy/60">Final recipient: {r.finalRecipientOrg}</div>
                  )}
                </div>
                {r.decision === "Approved" && <StatusTracker current={r.fulfilmentStatus} />}
                {r.decision === "Rejected" && r.decisionNote && (
                  <div className="mt-3 text-sm bg-cream rounded-xl px-4 py-3 text-navy/70">
                    <strong>Note from our team:</strong> {r.decisionNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-teal-light text-teal-dark",
    Rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full text-xs font-bold px-3 py-1 ${styles[decision] ?? "bg-gray-100 text-gray-600"}`}>
      {decision}
    </span>
  );
}

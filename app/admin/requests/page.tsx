import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/guard";

export const dynamic = "force-dynamic";

const order = { Pending: 0, Approved: 1, Rejected: 2 } as Record<string, number>;

export default async function AdminRequestsPage() {
  await requireAdminPage();
  const requests = await db.donationRequest.findMany({
    include: { items: { include: { laptop: true } } },
    orderBy: { submittedAt: "desc" },
  });
  requests.sort((a, b) => (order[a.decision] ?? 9) - (order[b.decision] ?? 9));
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Requests</h1>
      <div className="space-y-3">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/admin/requests/${r.id}`}
            className="block bg-white rounded-2xl shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-teal-dark font-bold text-sm">{r.requestId}</span>
                <span className="font-semibold ml-3">{r.organisationName}</span>
                <span className="text-navy/50 text-sm ml-3">
                  {r.submittedAt.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.decision === "Approved" && r.fulfilmentStatus && (
                  <span className="text-xs bg-cream rounded-full px-3 py-1">{r.fulfilmentStatus}</span>
                )}
                <DecisionBadge decision={r.decision} />
              </div>
            </div>
            <div className="text-sm text-navy/60 mt-1">
              {r.items.map((i) => `${i.quantityRequested} × ${i.laptop.model}`).join(", ") || "No items"}
            </div>
          </Link>
        ))}
        {requests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/50">No requests yet.</div>
        )}
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-teal-light text-teal-dark",
    Rejected: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full text-xs font-bold px-3 py-1 ${styles[decision] ?? "bg-gray-100"}`}>{decision}</span>;
}

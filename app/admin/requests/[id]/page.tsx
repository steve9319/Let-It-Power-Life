import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { laptopsWithStock } from "@/lib/stock";
import { requireAdminPage } from "@/lib/guard";
import { approveRequestAction, rejectRequestAction, advanceFulfilmentAction } from "@/app/actions/admin";
import { StatusTracker } from "@/components/StatusTracker";

export const dynamic = "force-dynamic";

const NEXT_STAGE: Record<string, string> = {
  Processing: "Preparing",
  Preparing: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const request = await db.donationRequest.findUnique({
    where: { id },
    include: { items: { include: { laptop: true } } },
  });
  if (!request) notFound();
  const stock = await laptopsWithStock();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">
        <span className="font-mono text-teal-dark">{request.requestId}</span>
      </h1>
      <div className="text-navy/60 text-sm mb-6">
        Submitted {request.submittedAt.toLocaleString("en-SG")} · {request.decision}
        {request.fulfilmentStatus && ` · ${request.fulfilmentStatus}`}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-sm space-y-1.5">
        <h2 className="font-bold text-base mb-2">Requesting organisation</h2>
        <Row k="Organisation" v={request.organisationName} />
        <Row k="UEN" v={request.uen} />
        <Row k="Contact person" v={request.contactPerson} />
        <Row k="Email" v={request.email} />
        <Row k="Country" v={request.country} />
        <Row k="Phone" v={[request.countryCode, request.phoneNumber].filter(Boolean).join(" ")} />
        <Row k="Laptop uses" v={request.laptopUses} />
        <Row k="Final recipient" v={[request.finalRecipientOrg, request.finalRecipientCountry].filter(Boolean).join(", ")} />
        <Row k="Proposed allocation" v={request.proposedAllocation} />
        <Row k="Notes" v={request.notes} />
      </div>

      {request.decision === "Pending" ? (
        <>
          <form action={approveRequestAction} className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <input type="hidden" name="id" value={request.id} />
            <h2 className="font-bold mb-3">Approve — set quantities</h2>
            <div className="space-y-3">
              {request.items.map((item) => {
                const available = stock.find((l) => l.id === item.laptopId)?.available ?? 0;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold">{item.laptop.model}</div>
                      <div className="text-navy/50 text-xs">
                        Requested {item.quantityRequested} · {available} in stock
                      </div>
                    </div>
                    <input
                      type="number"
                      name={`qty_${item.id}`}
                      min={0}
                      max={available}
                      defaultValue={Math.min(item.quantityRequested, available)}
                      className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-right"
                    />
                  </div>
                );
              })}
            </div>
            <label className="block text-sm font-semibold mb-1.5 mt-4">Note to requestor (optional)</label>
            <input name="note" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" placeholder="Included in the approval email" />
            <button className="mt-4 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5">
              ✓ Approve & email requestor
            </button>
          </form>

          <form action={rejectRequestAction} className="bg-white rounded-2xl shadow-sm p-6">
            <input type="hidden" name="id" value={request.id} />
            <h2 className="font-bold mb-3">Reject</h2>
            <label className="block text-sm font-semibold mb-1.5">Reason (optional, included in email)</label>
            <input name="note" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" placeholder="e.g. Out of stock for the requested models" />
            <button className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-6 py-2.5">
              ✗ Reject & email requestor
            </button>
          </form>
        </>
      ) : request.decision === "Approved" ? (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold mb-2">Fulfilment</h2>
          <div className="text-sm text-navy/70 mb-2">
            {request.items
              .filter((i) => (i.quantityApproved ?? 0) > 0)
              .map((i) => `${i.quantityApproved} × ${i.laptop.model}`)
              .join(", ")}
          </div>
          <StatusTracker current={request.fulfilmentStatus} />
          {request.fulfilmentStatus && NEXT_STAGE[request.fulfilmentStatus] ? (
            <form action={advanceFulfilmentAction}>
              <input type="hidden" name="id" value={request.id} />
              <button className="mt-3 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl px-6 py-2.5">
                Advance to “{NEXT_STAGE[request.fulfilmentStatus]}” →
              </button>
              <p className="text-xs text-navy/50 mt-2">
                Requestor is emailed automatically at “Out for Delivery” and “Delivered”. Delivered also adds an entry to the
                Impact page.
              </p>
            </form>
          ) : (
            <div className="text-teal-dark font-semibold text-sm mt-2">✓ Delivered — published to the Impact page.</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-navy/70">
          Rejected {request.decidedAt?.toLocaleString("en-SG")}
          {request.decisionNote && <> — “{request.decisionNote}”</>}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  if (!v) return null;
  return (
    <div className="flex gap-3">
      <div className="w-36 text-navy/50 shrink-0">{k}</div>
      <div>{v}</div>
    </div>
  );
}

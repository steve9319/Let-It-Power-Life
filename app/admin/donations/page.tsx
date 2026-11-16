import Link from "next/link";
import { db } from "@/lib/db";
import { brandLabel } from "@/lib/donation";
import { requireAdminPage } from "@/lib/guard";
import { DonationBadge } from "@/components/DonationBadge";

export const dynamic = "force-dynamic";

const order: Record<string, number> = { New: 0, Contacted: 1, Scheduled: 2, Received: 3, Declined: 4 };

export default async function AdminDonationsPage() {
  await requireAdminPage();
  const donations = await db.laptopDonation.findMany({ orderBy: { submittedAt: "desc" } });
  donations.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || b.submittedAt.getTime() - a.submittedAt.getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Donations</h1>
      <div className="space-y-3">
        {donations.map((d) => (
          <Link
            key={d.id}
            href={`/admin/donations/${d.id}`}
            className="block bg-white rounded-2xl shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-teal-dark font-bold text-sm">{d.donationId}</span>
                <span className="font-semibold ml-3">{d.name}</span>
                <span className="text-navy/50 text-sm ml-3">
                  {d.submittedAt.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <DonationBadge status={d.status} />
            </div>
            <div className="text-sm text-navy/60 mt-1">
              {d.quantity} × {brandLabel(d.brand, d.brandOther)} · Charger: {d.chargerIncluded}
              {d.location ? ` · ${d.location}` : ""}
            </div>
          </Link>
        ))}
        {donations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/50">No donations yet.</div>
        )}
      </div>
    </div>
  );
}

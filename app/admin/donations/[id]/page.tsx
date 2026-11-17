import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DONATION_STATUSES, brandLabel } from "@/lib/donation";
import { requireAdminPage } from "@/lib/guard";
import { updateDonationStatusAction } from "@/app/actions/admin";
import { DonationBadge } from "@/components/DonationBadge";

export const dynamic = "force-dynamic";

export default async function AdminDonationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const donation = await db.laptopDonation.findUnique({ where: { id } });
  if (!donation) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">
        <span className="font-mono text-teal-dark">{donation.donationId}</span>
      </h1>
      <div className="flex flex-wrap items-center gap-2 text-navy/60 text-sm mb-6">
        <span>Submitted {donation.submittedAt.toLocaleString("en-SG")}</span>
        <DonationBadge status={donation.status} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-sm space-y-1.5">
        <h2 className="font-bold text-base mb-2">Donor</h2>
        <Row k="Name" v={donation.name} />
        <Row k="Email" v={donation.email} />
        <Row k="Phone" v={donation.phone} />
        <Row k="Number of laptops" v={String(donation.quantity)} />
        <Row k="Brand" v={brandLabel(donation.brand, donation.brandOther)} />
        <Row k="Model" v={donation.model} />
        <Row k="Approximate age" v={donation.approximateAge} />
        <Row k="Condition" v={donation.condition} />
        <Row k="Charger included" v={donation.chargerIncluded} />
        <Row k="Data wiped" v={donation.dataWiped} />
        <Row k="Preferred handover" v={donation.handover} />
        <Row k="Area" v={donation.location} />
        <Row k="Notes" v={donation.notes} />
      </div>

      <form action={updateDonationStatusAction} className="bg-white rounded-2xl shadow-sm p-6">
        <input type="hidden" name="id" value={donation.id} />
        <h2 className="font-bold mb-3">Update status</h2>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="donation-status">Status</label>
        <select
          id="donation-status"
          name="status"
          defaultValue={donation.status}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white"
        >
          {DONATION_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="mt-4 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5">
          Save status
        </button>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  if (!v) return null;
  return (
    <div className="flex gap-3">
      <div className="w-40 text-navy/50 shrink-0">{k}</div>
      <div className="whitespace-pre-wrap">{v}</div>
    </div>
  );
}

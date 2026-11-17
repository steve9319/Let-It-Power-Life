import { db } from "@/lib/db";
import { DONATION_STATUS_NOTE, type DonationStatus, brandLabel } from "@/lib/donation";
import { getRequestorEmail } from "@/lib/session";
import { DonationBadge } from "@/components/DonationBadge";
import { DonateForm } from "./DonateForm";
import { DonateSignIn } from "./DonateSignIn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Donate a laptop — Let It Power Life",
};

function statusNote(status: string): string | null {
  if (status in DONATION_STATUS_NOTE) return DONATION_STATUS_NOTE[status as DonationStatus];
  return null;
}

export default async function DonatePage() {
  const email = await getRequestorEmail();
  const offers = email
    ? await db.laptopDonation.findMany({ where: { email }, orderBy: { submittedAt: "desc" } })
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Donate a laptop</h1>
      <p className="text-navy/70 mb-4">
        Have a laptop you no longer need? You can offer it here. We pass laptops on to NGOs and
        non-profits, and a machine that still turns on — even an older one — can be put to use.
      </p>
      <div className="mb-8 rounded-xl bg-teal-light border border-teal/20 px-4 py-3 text-sm text-teal-dark">
        The most useful offers are laptops that turn on. If yours needs a repair, or you&apos;re not sure
        of the model, you can still offer it. You don&apos;t need the model.
      </div>

      {email ? <DonateForm email={email} /> : <DonateSignIn />}

      {email && offers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Your offers</h2>
          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-teal-dark">{offer.donationId}</span>
                    <span className="text-navy/50 text-sm ml-3">
                      {offer.submittedAt.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <DonationBadge status={offer.status} />
                </div>
                <div className="text-sm text-navy/70 mt-1">
                  {offer.quantity} × {brandLabel(offer.brand, offer.brandOther)} · Charger: {offer.chargerIncluded}
                </div>
                {statusNote(offer.status) && (
                  <div className="text-xs text-navy/50 mt-1">{statusNote(offer.status)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/guard";
import { saveShowcaseAction, deleteShowcaseAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const input = "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal bg-white";
const label = "block text-sm font-semibold mb-1.5 mt-3";

export default async function AdminShowcasePage() {
  await requireAdminPage();
  const donations = await db.pastDonation.findMany({ orderBy: [{ deliveredDate: "desc" }, { createdAt: "desc" }] });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Impact showcase</h1>

      <details className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <summary className="font-bold cursor-pointer">+ Add a past donation</summary>
        <ShowcaseForm />
      </details>

      <div className="space-y-4">
        {donations.map((d) => (
          <details key={d.id} className="bg-white rounded-2xl shadow-sm p-6">
            <summary className="cursor-pointer flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>{d.recipientOrg}</strong>
                <span className="text-navy/50 text-sm ml-2">
                  {[d.laptopsSummary, d.country].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className={`text-xs rounded-full px-3 py-1 font-bold ${d.published ? "bg-teal-light text-teal-dark" : "bg-gray-100 text-gray-500"}`}>
                {d.published ? "Published" : "Hidden"}
              </span>
            </summary>
            <ShowcaseForm donation={d} />
            <form action={deleteShowcaseAction} className="mt-2">
              <input type="hidden" name="id" value={d.id} />
              <button className="text-red-600 text-xs font-semibold underline">Delete entry</button>
            </form>
          </details>
        ))}
        {donations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/50">
            No showcase entries yet. They are created automatically when a request is marked Delivered, or add one above.
          </div>
        )}
      </div>
    </div>
  );
}

function ShowcaseForm({
  donation,
}: {
  donation?: {
    id: string;
    recipientOrg: string;
    country: string | null;
    laptopsSummary: string | null;
    deliveredDate: Date | null;
    photoUrl: string | null;
    story: string | null;
    beneficiaryOrgs: string | null;
    published: boolean;
  };
}) {
  return (
    <form action={saveShowcaseAction} className="mt-4">
      {donation && <input type="hidden" name="id" value={donation.id} />}
      <label className={label}>Recipient organisation *</label>
      <input name="recipientOrg" required defaultValue={donation?.recipientOrg} className={input} />
      <div className="grid sm:grid-cols-2 gap-x-4">
        <div>
          <label className={label}>Country</label>
          <input name="country" defaultValue={donation?.country ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Delivered date</label>
          <input
            name="deliveredDate"
            type="date"
            defaultValue={donation?.deliveredDate ? donation.deliveredDate.toISOString().slice(0, 10) : ""}
            className={input}
          />
        </div>
      </div>
      <label className={label}>Laptops (e.g. “HP ProBook 430 G6 × 6”)</label>
      <input name="laptopsSummary" defaultValue={donation?.laptopsSummary ?? ""} className={input} />
      <label className={label}>Story</label>
      <textarea name="story" defaultValue={donation?.story ?? ""} className={`${input} min-h-[80px]`} />
      <label className={label}>Beneficiary organisations (internal — not shown publicly)</label>
      <input name="beneficiaryOrgs" defaultValue={donation?.beneficiaryOrgs ?? ""} className={input} placeholder="e.g. His Child, CEAI — comma-separated; counted in 'Organisations helped'" />
      <label className={label}>Photo</label>
      {donation?.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={donation.photoUrl} alt="" className="w-40 h-28 object-cover rounded-xl mb-2 bg-gray-100" />
      )}
      <input name="photo" type="file" accept="image/*" className="block text-sm" />
      <label className="flex items-center gap-2 text-sm font-semibold mt-4">
        <input type="checkbox" name="published" defaultChecked={donation?.published ?? true} className="w-4 h-4 accent-teal" />
        Show on public Impact page
      </label>
      <button className="mt-4 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5">Save</button>
    </form>
  );
}

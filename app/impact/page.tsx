import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const donations = await db.pastDonation.findMany({
    where: { published: true },
    orderBy: [{ deliveredDate: "desc" }, { createdAt: "desc" }],
  });
  const totalLaptops = donations.reduce((sum, d) => {
    const nums = (d.laptopsSummary?.match(/×\s*(\d+)/g) || []).map((m) => parseInt(m.replace(/\D/g, ""), 10));
    return sum + (nums.length ? nums.reduce((a, b) => a + b, 0) : 0);
  }, 0);
  const orgs = new Set(donations.map((d) => d.recipientOrg.toLowerCase())).size;
  const countrySet = new Set<string>();
  for (const d of donations) {
    (d.country || "")
      .split(/,|&|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((c) => countrySet.add(c));
  }
  const countries = countrySet.size;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Our Impact</h1>
        <p className="text-navy/70 mt-2 max-w-2xl">
          Every laptop we rehome powers education, outreach and opportunity. Here is where they have gone.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl">
        {[
          { n: totalLaptops, label: "Laptops donated" },
          { n: orgs, label: "Organisations helped" },
          { n: countries, label: "Countries reached" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-teal">{s.n}</div>
            <div className="text-xs text-navy/60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {donations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/60">
          Our first donations are on their way — stories coming soon!
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {donations.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {d.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photoUrl} alt={d.recipientOrg} className="w-full h-44 object-cover bg-gray-100" />
              )}
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-bold">{d.recipientOrg}</h2>
                  {d.deliveredDate && (
                    <span className="text-xs text-navy/50">
                      {d.deliveredDate.toLocaleDateString("en-SG", { year: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-teal-dark font-semibold mt-0.5">
                  {[d.laptopsSummary, d.country].filter(Boolean).join(" · ")}
                </div>
                {d.story && <p className="text-sm text-navy/70 mt-2">{d.story}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

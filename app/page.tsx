import Link from "next/link";
import { laptopsWithStock } from "@/lib/stock";
import { StockBadge } from "@/components/StockBadge";

export const dynamic = "force-dynamic";

export default async function LaptopsPage() {
  const laptops = (await laptopsWithStock()).filter((l) => l.status.toLowerCase().startsWith("available"));
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Laptops</h1>
        <p className="text-navy/70 mt-2 max-w-2xl">
          Refurbished laptops donated to NGOs and NPOs, free of charge. Browse the models below and
          submit a request for your organisation.
        </p>
      </div>
      {laptops.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-navy/60">
          No laptops are listed right now — please check back soon.
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {laptops.map((l) => (
          <div
            key={l.id}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${l.available === 0 ? "opacity-70" : ""}`}
          >
            {l.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photoUrl} alt={l.model} className="w-full h-44 object-cover bg-gray-100" />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-4xl">💻</div>
            )}
            <div className="p-5 flex flex-col gap-2 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-navy/50 font-mono">{l.laptopId}</div>
                  <h2 className="font-bold text-lg leading-snug">{l.model}</h2>
                </div>
                <StockBadge available={l.available} />
              </div>
              <div className="text-sm text-navy/70">{l.specSummary || [l.cpu, l.ram, l.storage].filter(Boolean).join(" / ")}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {l.adaptor && <span className="text-[11px] bg-cream rounded px-2 py-0.5">🔌 {l.adaptor}</span>}
                {l.os && <span className="text-[11px] bg-cream rounded px-2 py-0.5">🪟 {l.os}</span>}
                <span className="text-[11px] bg-cream rounded px-2 py-0.5">
                  {l.officeInstalled ? "Office installed" : "No Office"}
                </span>
              </div>
              <div className="mt-auto pt-3">
                {l.available > 0 ? (
                  <Link
                    href={`/request?laptop=${l.id}`}
                    className="block text-center bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-4 py-2.5 transition-colors"
                  >
                    Request this laptop
                  </Link>
                ) : (
                  <div className="text-center text-sm text-navy/50 py-2.5">Check back soon</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

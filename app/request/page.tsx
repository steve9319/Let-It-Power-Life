import { db } from "@/lib/db";
import { laptopsWithStock } from "@/lib/stock";
import { RequestWizard } from "./RequestWizard";

export const dynamic = "force-dynamic";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ laptop?: string }>;
}) {
  const { laptop } = await searchParams;
  const [laptops, countries] = await Promise.all([
    laptopsWithStock(),
    db.countryCode.findMany({ orderBy: { country: "asc" } }),
  ]);
  const selectable = laptops.filter(
    (l) => l.status.toLowerCase().startsWith("available") && l.available > 0
  );
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Request Laptops</h1>
      <p className="text-navy/70 mb-8">
        For NGOs and NPOs. Verify your email, tell us about your organisation, and choose the
        laptops you need — we review every request personally.
      </p>
      <RequestWizard
        laptops={selectable.map((l) => ({
          id: l.id,
          laptopId: l.laptopId,
          model: l.model,
          spec: l.specSummary || [l.cpu, l.ram, l.storage].filter(Boolean).join(" / "),
          photoUrl: l.photoUrl,
          available: l.available,
        }))}
        countries={countries}
        preselect={laptop ?? null}
      />
    </div>
  );
}

import Link from "next/link";
import { laptopsWithStock } from "@/lib/stock";
import { requireAdminPage } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function AdminLaptopsPage() {
  await requireAdminPage();
  const laptops = await laptopsWithStock();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Laptops</h1>
        <Link href="/admin/laptops/new" className="bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
          + Add laptop
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-navy/50 border-b border-gray-100">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Model</th>
              <th className="px-5 py-3">Spec</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Donated by</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {laptops.map((l) => (
              <tr key={l.id}>
                <td className="px-5 py-3 font-mono text-navy/60">{l.laptopId}</td>
                <td className="px-5 py-3 font-semibold">{l.model}</td>
                <td className="px-5 py-3 text-navy/70">{l.specSummary}</td>
                <td className="px-5 py-3">
                  <span className={l.available === 0 ? "text-gray-400" : "text-teal-dark font-bold"}>
                    {l.available}
                  </span>
                  <span className="text-navy/40"> / {l.originalUnits}</span>
                </td>
                <td className="px-5 py-3">{l.status}</td>
                <td className="px-5 py-3 text-navy/70">{l.donatedBy ?? "—"}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/laptops/${l.id}`} className="text-teal font-semibold underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {laptops.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-navy/50">
                  No laptops yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { laptopsWithStock } from "@/lib/stock";
import { requireAdminPage } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminPage();
  const [pending, inFulfilment, delivered, stock] = await Promise.all([
    db.donationRequest.count({ where: { decision: "Pending" } }),
    db.donationRequest.count({ where: { decision: "Approved", fulfilmentStatus: { not: "Delivered" } } }),
    db.donationRequest.count({ where: { fulfilmentStatus: "Delivered" } }),
    laptopsWithStock(),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/admin/requests" className="bg-white rounded-2xl shadow-sm p-5 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-amber-600">{pending}</div>
          <div className="text-xs text-navy/60 mt-1">Pending requests</div>
        </Link>
        <Link href="/admin/requests" className="bg-white rounded-2xl shadow-sm p-5 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-teal">{inFulfilment}</div>
          <div className="text-xs text-navy/60 mt-1">In fulfilment</div>
        </Link>
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-navy">{delivered}</div>
          <div className="text-xs text-navy/60 mt-1">Delivered</div>
        </div>
      </div>
      <h2 className="font-bold mb-3">Stock</h2>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {stock.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <span>
              <span className="font-mono text-navy/50 mr-2">{l.laptopId}</span>
              <span className="font-semibold">{l.model}</span>
            </span>
            <span className={`font-bold ${l.available === 0 ? "text-gray-400" : "text-teal-dark"}`}>
              {l.available} / {l.originalUnits} available
            </span>
          </div>
        ))}
        {stock.length === 0 && <div className="px-5 py-6 text-sm text-navy/50">No laptops yet — add one under Laptops.</div>}
      </div>
    </div>
  );
}

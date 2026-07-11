import { db } from "@/lib/db";

export type LaptopWithStock = {
  id: string;
  laptopId: string;
  model: string;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  specSummary: string | null;
  adaptor: string | null;
  os: string | null;
  officeInstalled: boolean;
  originalUnits: number;
  status: string;
  photoUrl: string | null;
  donatedBy: string | null;
  available: number;
};

/** Available units = original units minus quantities approved on non-rejected requests. */
export async function laptopsWithStock(): Promise<LaptopWithStock[]> {
  const laptops = await db.laptop.findMany({
    include: { items: { include: { request: { select: { decision: true } } } } },
    orderBy: { laptopId: "asc" },
  });
  return laptops.map((l) => {
    const reserved = l.items
      .filter((i) => i.request.decision === "Approved")
      .reduce((sum, i) => sum + (i.quantityApproved ?? 0), 0);
    const { items: _items, ...rest } = l;
    return { ...rest, available: Math.max(0, l.originalUnits - reserved) };
  });
}

export async function nextRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.donationRequest.count();
  return `R-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function nextLaptopId(): Promise<string> {
  const laptops = await db.laptop.findMany({ select: { laptopId: true } });
  const max = laptops.reduce((m, l) => {
    const n = parseInt(l.laptopId.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `L${String(max + 1).padStart(3, "0")}`;
}

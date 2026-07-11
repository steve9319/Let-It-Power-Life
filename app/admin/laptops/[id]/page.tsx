import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/guard";
import { LaptopForm } from "../LaptopForm";

export const dynamic = "force-dynamic";

export default async function EditLaptopPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const laptop = await db.laptop.findUnique({ where: { id } });
  if (!laptop) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit {laptop.laptopId}</h1>
      <LaptopForm values={laptop} />
    </div>
  );
}

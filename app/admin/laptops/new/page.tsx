import { requireAdminPage } from "@/lib/guard";
import { nextLaptopId } from "@/lib/stock";
import { LaptopForm } from "../LaptopForm";

export const dynamic = "force-dynamic";

export default async function NewLaptopPage() {
  await requireAdminPage();
  const suggestedId = await nextLaptopId();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add laptop</h1>
      <LaptopForm values={{}} suggestedId={suggestedId} />
    </div>
  );
}

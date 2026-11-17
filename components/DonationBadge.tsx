const styles: Record<string, string> = {
  New: "bg-amber-100 text-amber-800",
  Contacted: "bg-sky-100 text-sky-800",
  Scheduled: "bg-teal-light text-teal-dark",
  Received: "bg-teal text-white",
  Declined: "bg-red-100 text-red-700",
};

export function DonationBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full text-xs font-bold px-3 py-1 ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function StockBadge({ available }: { available: number }) {
  if (available <= 0) {
    return <span className="inline-block rounded-full bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1">Out of stock</span>;
  }
  if (available <= 2) {
    return <span className="inline-block rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">Low stock — {available} left</span>;
  }
  return <span className="inline-block rounded-full bg-teal-light text-teal-dark text-xs font-semibold px-3 py-1">{available} available</span>;
}

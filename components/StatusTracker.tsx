const STAGES = ["Processing", "Preparing", "Out for Delivery", "Delivered"] as const;

export function StatusTracker({ current }: { current: string | null }) {
  const idx = current ? STAGES.indexOf(current as (typeof STAGES)[number]) : -1;
  return (
    <div className="flex items-center w-full my-3">
      {STAGES.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  done || active
                    ? "bg-teal border-teal text-white"
                    : "bg-white border-gray-300 text-gray-400"
                } ${active ? "ring-4 ring-teal-light" : ""}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className={`mt-1 text-[11px] text-center leading-tight ${done || active ? "text-teal-dark font-semibold" : "text-gray-400"}`}>
                {stage}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-5 ${i < idx ? "bg-teal" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

import { saveLaptopAction } from "@/app/actions/admin";

type LaptopValues = {
  id?: string;
  laptopId?: string;
  model?: string;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  specSummary?: string | null;
  adaptor?: string | null;
  os?: string | null;
  officeInstalled?: boolean;
  originalUnits?: number;
  status?: string;
  photoUrl?: string | null;
  donatedBy?: string | null;
};

const input =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal bg-white";
const label = "block text-sm font-semibold mb-1.5 mt-4";

export function LaptopForm({ values, suggestedId }: { values: LaptopValues; suggestedId?: string }) {
  return (
    <form action={saveLaptopAction} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid sm:grid-cols-2 gap-x-4">
        <div>
          <label className={label}>Laptop ID</label>
          <input name="laptopId" defaultValue={values.laptopId ?? suggestedId} className={input} placeholder="L004" />
        </div>
        <div>
          <label className={label}>Status</label>
          <select name="status" defaultValue={values.status ?? "Available"} className={input}>
            <option>Available</option>
            <option>Retired</option>
          </select>
        </div>
      </div>
      <label className={label}>Model / Brand *</label>
      <input name="model" required defaultValue={values.model} className={input} placeholder="e.g. Lenovo X13 Gen 1" />
      <div className="grid sm:grid-cols-3 gap-x-4">
        <div>
          <label className={label}>CPU</label>
          <input name="cpu" defaultValue={values.cpu ?? ""} className={input} placeholder="i7-10610U" />
        </div>
        <div>
          <label className={label}>RAM</label>
          <input name="ram" defaultValue={values.ram ?? ""} className={input} placeholder="16GB" />
        </div>
        <div>
          <label className={label}>Storage</label>
          <input name="storage" defaultValue={values.storage ?? ""} className={input} placeholder="512GB SSD" />
        </div>
      </div>
      <label className={label}>Specification summary</label>
      <input name="specSummary" defaultValue={values.specSummary ?? ""} className={input} placeholder="i7 / 16GB / 512SSD (shown on the public card)" />
      <div className="grid sm:grid-cols-2 gap-x-4">
        <div>
          <label className={label}>Adaptor</label>
          <input name="adaptor" defaultValue={values.adaptor ?? ""} className={input} placeholder="UK / LENOVO 45W" />
        </div>
        <div>
          <label className={label}>Operating system</label>
          <input name="os" defaultValue={values.os ?? ""} className={input} placeholder="Windows 11 Home" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-4 items-end">
        <div>
          <label className={label}>Total units *</label>
          <input name="originalUnits" type="number" min={0} required defaultValue={values.originalUnits ?? 1} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold mt-4 pb-3">
          <input type="checkbox" name="officeInstalled" defaultChecked={values.officeInstalled} className="w-4 h-4 accent-teal" />
          Microsoft Office installed
        </label>
      </div>
      <label className={label}>Donated by</label>
      <input name="donatedBy" defaultValue={values.donatedBy ?? ""} className={input} placeholder="e.g. Alex Kwok, NUS Enterprise" />
      <label className={label}>Photo</label>
      {values.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={values.photoUrl} alt="Current photo" className="w-40 h-28 object-cover rounded-xl mb-2 bg-gray-100" />
      )}
      <input name="photo" type="file" accept="image/*" className="block text-sm" />
      <label className={label}>…or photo URL</label>
      <input name="photoUrl" defaultValue={values.photoUrl ?? ""} className={input} placeholder="https://…" />
      <div className="mt-8">
        <button className="bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-8 py-2.5">
          Save laptop
        </button>
      </div>
    </form>
  );
}

export const LAPTOP_BRANDS = [
  "Apple",
  "Lenovo",
  "HP",
  "Dell",
  "ASUS",
  "Acer",
  "Microsoft",
  "Samsung",
  "Other / Not sure",
] as const;

export const OTHER_BRAND = "Other / Not sure";

export const CHARGER_OPTIONS = ["Yes", "No", "Not sure"] as const;
export const CONDITION_OPTIONS = ["Working", "Needs repair", "Not sure"] as const;
export const DATA_WIPED_OPTIONS = ["Yes", "No", "Not sure"] as const;
export const HANDOVER_OPTIONS = ["Drop-off", "Pickup"] as const;

export const DONATION_STATUSES = ["New", "Contacted", "Scheduled", "Received", "Declined"] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_STATUS_NOTE: Record<DonationStatus, string> = {
  New: "We've received your offer",
  Contacted: "We've been in touch",
  Scheduled: "Handover arranged",
  Received: "Laptop received",
  Declined: "We can't take this one right now",
};

const MAX_QUANTITY = 30;

export type DonationInput = {
  name: string;
  brand: string;
  brandOther: string;
  quantity: number;
  chargerIncluded: string;
  phone: string;
  model: string;
  approximateAge: string;
  condition: string;
  dataWiped: string;
  handover: string;
  location: string;
  notes: string;
};

export type ParsedDonation = {
  name: string;
  brand: string;
  brandOther: string | null;
  quantity: number;
  chargerIncluded: string;
  phone: string | null;
  model: string | null;
  approximateAge: string | null;
  condition: string | null;
  dataWiped: string | null;
  handover: string | null;
  location: string | null;
  notes: string | null;
};

function clean(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanNotes(value: string, max: number): string {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function allowed(value: string, options: readonly string[]): boolean {
  return (options as readonly string[]).includes(value);
}

export function parseDonation(
  input: DonationInput
): { ok: true; value: ParsedDonation } | { ok: false; error: string } {
  const name = clean(input.name ?? "", 120);
  if (!name) return { ok: false, error: "Please enter your name." };

  const brand = (input.brand ?? "").trim();
  if (!allowed(brand, LAPTOP_BRANDS)) return { ok: false, error: "Please choose a brand." };

  const brandOtherRaw = clean(input.brandOther ?? "", 80);
  const brandOther = brand === OTHER_BRAND && brandOtherRaw ? brandOtherRaw : null;

  const quantity = input.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return { ok: false, error: `Please enter how many laptops, from 1 to ${MAX_QUANTITY}.` };
  }

  const chargerIncluded = (input.chargerIncluded ?? "").trim();
  if (!allowed(chargerIncluded, CHARGER_OPTIONS)) {
    return { ok: false, error: "Please tell us if the charger is included." };
  }

  const condition = (input.condition ?? "").trim();
  if (condition && !allowed(condition, CONDITION_OPTIONS)) {
    return { ok: false, error: "Please choose a condition, or leave it blank." };
  }

  const dataWiped = (input.dataWiped ?? "").trim();
  if (dataWiped && !allowed(dataWiped, DATA_WIPED_OPTIONS)) {
    return { ok: false, error: "Please choose whether the data has been wiped, or leave it blank." };
  }

  const handover = (input.handover ?? "").trim();
  if (handover && !allowed(handover, HANDOVER_OPTIONS)) {
    return { ok: false, error: "Please choose drop-off or pickup, or leave it blank." };
  }

  return {
    ok: true,
    value: {
      name,
      brand,
      brandOther,
      quantity,
      chargerIncluded,
      phone: clean(input.phone ?? "", 40) || null,
      model: clean(input.model ?? "", 120) || null,
      approximateAge: clean(input.approximateAge ?? "", 60) || null,
      condition: condition || null,
      dataWiped: dataWiped || null,
      handover: handover || null,
      location: clean(input.location ?? "", 160) || null,
      notes: cleanNotes(input.notes ?? "", 2000) || null,
    },
  };
}

export function brandLabel(brand: string, brandOther: string | null | undefined): string {
  if (brand === OTHER_BRAND && brandOther) return `${brand} — ${brandOther}`;
  return brand;
}

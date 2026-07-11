"use server";

import { db } from "@/lib/db";
import { requestOtp, verifyOtp } from "@/lib/otp";
import { getRequestorEmail, setRequestorEmail } from "@/lib/session";
import { laptopsWithStock, nextRequestId } from "@/lib/stock";
import { sendRequestReceived } from "@/lib/mail";

export async function sendCodeAction(email: string) {
  return requestOtp(email);
}

export async function verifyCodeAction(email: string, code: string) {
  const result = await verifyOtp(email, code);
  if (result.ok) await setRequestorEmail(email);
  return result;
}

export type SubmitRequestInput = {
  organisationName: string;
  uen: string;
  contactPerson: string;
  country: string;
  phoneNumber: string;
  laptopUses: string;
  notes: string;
  finalRecipientOrg: string;
  finalRecipientCountry: string;
  proposedAllocation: string;
  items: { laptopId: string; quantity: number }[];
};

export async function submitRequestAction(input: SubmitRequestInput) {
  const email = await getRequestorEmail();
  if (!email) return { ok: false as const, error: "Email verification expired. Please verify again." };

  if (!input.organisationName.trim()) return { ok: false as const, error: "Organisation name is required." };
  if (!input.laptopUses.trim()) return { ok: false as const, error: "Please tell us how the laptops will be used." };
  if (!input.finalRecipientOrg.trim()) return { ok: false as const, error: "Final recipient organisation is required." };
  const items = input.items.filter((i) => i.quantity > 0);
  if (items.length === 0) return { ok: false as const, error: "Please select at least one laptop." };

  const stock = await laptopsWithStock();
  for (const item of items) {
    const laptop = stock.find((l) => l.id === item.laptopId);
    if (!laptop) return { ok: false as const, error: "Selected laptop no longer exists." };
    if (item.quantity > laptop.available) {
      return { ok: false as const, error: `Only ${laptop.available} unit(s) of ${laptop.model} available.` };
    }
  }

  const countryCode = input.country
    ? (await db.countryCode.findUnique({ where: { country: input.country } }))?.code ?? null
    : null;

  const requestId = await nextRequestId();
  await db.donationRequest.create({
    data: {
      requestId,
      organisationName: input.organisationName.trim(),
      uen: input.uen.trim() || null,
      contactPerson: input.contactPerson.trim() || null,
      email,
      country: input.country || null,
      countryCode,
      phoneNumber: input.phoneNumber.trim() || null,
      laptopUses: input.laptopUses.trim(),
      notes: input.notes.trim() || null,
      finalRecipientOrg: input.finalRecipientOrg.trim(),
      finalRecipientCountry: input.finalRecipientCountry.trim() || null,
      proposedAllocation: input.proposedAllocation.trim() || null,
      items: {
        create: items.map((i) => ({ laptopId: i.laptopId, quantityRequested: i.quantity })),
      },
    },
  });

  const lines = items.map((i) => ({
    model: stock.find((l) => l.id === i.laptopId)?.model ?? "Laptop",
    qty: i.quantity,
  }));
  await sendRequestReceived(email, requestId, input.organisationName.trim(), lines);

  return { ok: true as const, requestId };
}

export async function myRequestsAction() {
  const email = await getRequestorEmail();
  if (!email) return { ok: false as const, requests: [] };
  const requests = await db.donationRequest.findMany({
    where: { email },
    include: { items: { include: { laptop: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return {
    ok: true as const,
    email,
    requests: requests.map((r) => ({
      requestId: r.requestId,
      organisationName: r.organisationName,
      submittedAt: r.submittedAt.toISOString(),
      decision: r.decision,
      decisionNote: r.decisionNote,
      fulfilmentStatus: r.fulfilmentStatus,
      finalRecipientOrg: r.finalRecipientOrg,
      items: r.items.map((i) => ({
        model: i.laptop.model,
        requested: i.quantityRequested,
        approved: i.quantityApproved,
      })),
    })),
  };
}

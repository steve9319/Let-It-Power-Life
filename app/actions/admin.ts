"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { isAdmin, setAdminSession, clearAdminSession } from "@/lib/session";
import { laptopsWithStock, nextLaptopId } from "@/lib/stock";
import { sendApproved, sendRejected, sendStatusUpdate } from "@/lib/mail";

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function adminLoginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const wantEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const wantPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!wantEmail || !wantPassword) {
    return { error: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD." };
  }
  if (!safeEqual(email, wantEmail) || !safeEqual(password, wantPassword)) {
    return { error: "Incorrect email or password." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

async function uploadPhoto(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[upload] BLOB_READ_WRITE_TOKEN not set — photo not uploaded");
    return null;
  }
  const key = `laptops/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const blob = await put(key, file, { access: "public" });
  return blob.url;
}

export async function saveLaptopAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const photoFile = formData.get("photo") as File | null;
  const uploadedUrl = await uploadPhoto(photoFile);
  const photoUrlText = String(formData.get("photoUrl") ?? "").trim();

  const data = {
    laptopId: String(formData.get("laptopId") ?? "").trim() || (await nextLaptopId()),
    model: String(formData.get("model") ?? "").trim(),
    cpu: String(formData.get("cpu") ?? "").trim() || null,
    ram: String(formData.get("ram") ?? "").trim() || null,
    storage: String(formData.get("storage") ?? "").trim() || null,
    specSummary: String(formData.get("specSummary") ?? "").trim() || null,
    adaptor: String(formData.get("adaptor") ?? "").trim() || null,
    os: String(formData.get("os") ?? "").trim() || null,
    officeInstalled: formData.get("officeInstalled") === "on",
    originalUnits: Math.max(0, parseInt(String(formData.get("originalUnits") ?? "0"), 10) || 0),
    status: String(formData.get("status") ?? "Available"),
    donatedBy: String(formData.get("donatedBy") ?? "").trim() || null,
    ...(uploadedUrl ? { photoUrl: uploadedUrl } : photoUrlText ? { photoUrl: photoUrlText } : {}),
  };
  if (!data.model) return;

  if (id) {
    await db.laptop.update({ where: { id }, data });
  } else {
    await db.laptop.create({ data });
  }
  revalidatePath("/");
  revalidatePath("/admin/laptops");
  redirect("/admin/laptops");
}

export async function approveRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const request = await db.donationRequest.findUnique({
    where: { id },
    include: { items: { include: { laptop: true } } },
  });
  if (!request || request.decision !== "Pending") return;

  const stock = await laptopsWithStock();
  const approvals: { itemId: string; qty: number }[] = [];
  for (const item of request.items) {
    const qty = Math.max(0, parseInt(String(formData.get(`qty_${item.id}`) ?? "0"), 10) || 0);
    const available = stock.find((l) => l.id === item.laptopId)?.available ?? 0;
    approvals.push({ itemId: item.id, qty: Math.min(qty, available) });
  }
  if (approvals.every((a) => a.qty === 0)) return;

  await db.$transaction([
    ...approvals.map((a) =>
      db.requestItem.update({ where: { id: a.itemId }, data: { quantityApproved: a.qty } })
    ),
    db.donationRequest.update({
      where: { id },
      data: {
        decision: "Approved",
        decisionNote: note,
        decidedAt: new Date(),
        fulfilmentStatus: "Processing",
        processingAt: new Date(),
      },
    }),
  ]);

  if (request.email) {
    const lines = request.items
      .map((item) => ({
        model: item.laptop.model,
        qty: approvals.find((a) => a.itemId === item.id)?.qty ?? 0,
      }))
      .filter((l) => l.qty > 0);
    await sendApproved(request.email, request.requestId, request.organisationName, lines, note);
  }
  revalidatePath("/admin/requests");
  revalidatePath("/");
  redirect("/admin/requests");
}

export async function rejectRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const request = await db.donationRequest.findUnique({ where: { id } });
  if (!request || request.decision !== "Pending") return;
  await db.donationRequest.update({
    where: { id },
    data: { decision: "Rejected", decisionNote: note, decidedAt: new Date() },
  });
  if (request.email) {
    await sendRejected(request.email, request.requestId, request.organisationName, note);
  }
  revalidatePath("/admin/requests");
  redirect("/admin/requests");
}

const STAGES = ["Processing", "Preparing", "Out for Delivery", "Delivered"] as const;

export async function advanceFulfilmentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const request = await db.donationRequest.findUnique({
    where: { id },
    include: { items: { include: { laptop: true } } },
  });
  if (!request || request.decision !== "Approved" || !request.fulfilmentStatus) return;
  const idx = STAGES.indexOf(request.fulfilmentStatus as (typeof STAGES)[number]);
  if (idx < 0 || idx >= STAGES.length - 1) return;
  const nextStage = STAGES[idx + 1];
  const stampField = { Preparing: "preparingAt", "Out for Delivery": "outForDeliveryAt", Delivered: "deliveredAt" }[
    nextStage as string
  ] as "preparingAt" | "outForDeliveryAt" | "deliveredAt";

  await db.donationRequest.update({
    where: { id },
    data: { fulfilmentStatus: nextStage, [stampField]: new Date() },
  });

  if (nextStage === "Out for Delivery" || nextStage === "Delivered") {
    if (request.email) {
      await sendStatusUpdate(request.email, request.requestId, request.organisationName, nextStage);
    }
  }
  if (nextStage === "Delivered") {
    const summary = request.items
      .filter((i) => (i.quantityApproved ?? 0) > 0)
      .map((i) => `${i.laptop.model} × ${i.quantityApproved}`)
      .join(", ");
    await db.pastDonation.create({
      data: {
        recipientOrg: request.finalRecipientOrg || request.organisationName,
        country: request.finalRecipientCountry || request.country,
        laptopsSummary: summary,
        deliveredDate: new Date(),
        story: request.laptopUses,
        published: true,
      },
    });
    revalidatePath("/impact");
  }
  revalidatePath("/admin/requests");
  redirect(`/admin/requests/${id}`);
}

export async function saveShowcaseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const photoFile = formData.get("photo") as File | null;
  const uploadedUrl = await uploadPhoto(photoFile);
  const dateText = String(formData.get("deliveredDate") ?? "").trim();
  const data = {
    recipientOrg: String(formData.get("recipientOrg") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim() || null,
    laptopsSummary: String(formData.get("laptopsSummary") ?? "").trim() || null,
    story: String(formData.get("story") ?? "").trim() || null,
    deliveredDate: dateText ? new Date(dateText) : null,
    published: formData.get("published") === "on",
    ...(uploadedUrl ? { photoUrl: uploadedUrl } : {}),
  };
  if (!data.recipientOrg) return;
  if (id) await db.pastDonation.update({ where: { id }, data });
  else await db.pastDonation.create({ data });
  revalidatePath("/impact");
  revalidatePath("/admin/showcase");
  redirect("/admin/showcase");
}

export async function deleteShowcaseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await db.pastDonation.delete({ where: { id } });
  revalidatePath("/impact");
  revalidatePath("/admin/showcase");
}

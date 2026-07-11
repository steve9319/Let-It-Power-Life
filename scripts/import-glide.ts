/**
 * One-off import of the Glide CSV exports in data/glide-export/ into Postgres.
 * Run with:  DATABASE_URL=... npm run import-glide
 * Idempotent: skips laptops/requests that already exist (by Laptop ID / row identity).
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DIR = path.join(process.cwd(), "data", "glide-export");

function readCsv(name: string): Record<string, string>[] {
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    console.warn(`! ${name} not found — skipping`);
    return [];
  }
  return parse(fs.readFileSync(file), { columns: true, skip_empty_lines: true, trim: true });
}

async function uploadToBlob(url: string, laptopId: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return url; // keep Glide URL, warn later
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (url.split(".").pop() || "jpg").split("?")[0];
    const { put } = await import("@vercel/blob");
    const blob = await put(`laptops/${laptopId}.${ext}`, buf, { access: "public" });
    console.log(`  photo re-hosted: ${laptopId} -> ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.warn(`  ! photo upload failed for ${laptopId} (${err}) — keeping Glide URL`);
    return url;
  }
}

async function main() {
  // ---- Country codes ----
  const countries = readCsv("Country Codes.csv");
  for (const row of countries) {
    if (!row.Country) continue;
    await db.countryCode.upsert({
      where: { country: row.Country },
      update: { code: row.Code },
      create: { country: row.Country, code: row.Code },
    });
  }
  console.log(`Countries: ${countries.length} imported`);

  // ---- Laptops ----
  const laptops = readCsv("Laptops.csv");
  const laptopByModel = new Map<string, string>(); // model -> db id
  let laptopCount = 0;
  for (const row of laptops) {
    const laptopId = (row["Laptop ID"] || "").trim();
    const model = (row["Model / Brand"] || "").trim();
    if (!laptopId || !model) continue; // skip Glide's trailing junk row

    const os = (row["OS"] || "").trim();
    if (os.toUpperCase() === "YES") {
      console.warn(`  ! ${laptopId}: OS column is "${os}" (not an OS name) — imported as-is, please fix in admin`);
    }
    const existing = await db.laptop.findUnique({ where: { laptopId } });
    if (existing) {
      laptopByModel.set(model.toLowerCase(), existing.id);
      console.log(`  ${laptopId} already imported — skipping`);
      continue;
    }
    const photoUrl = (row["Photo URL"] || "").trim();
    const finalPhoto = photoUrl ? await uploadToBlob(photoUrl, laptopId) : null;
    const created = await db.laptop.create({
      data: {
        laptopId,
        model,
        cpu: (row["CPU"] || "").trim() || null,
        ram: (row["RAM"] || "").trim() || null,
        storage: (row["Storage"] || "").trim() || null,
        specSummary: (row["Specification (summary)"] || "").trim() || null,
        adaptor: (row["Adaptor"] || "").trim() || null,
        os: os || null,
        officeInstalled: (row["Office Installed"] || "").trim().toLowerCase() === "yes",
        originalUnits: parseInt(row["Original Units"] || "0", 10) || 0,
        status: (row["Status"] || "Available").trim(),
        photoUrl: finalPhoto,
      },
    });
    laptopByModel.set(model.toLowerCase(), created.id);
    laptopCount++;
  }
  console.log(`Laptops: ${laptopCount} imported`);

  // ---- NGO Requests ----
  const requests = readCsv("NGO Requests.csv");
  let reqCount = 0;
  const existingCount = await db.donationRequest.count();
  let seq = existingCount;
  for (const row of requests) {
    const org = (row["Organisation Name"] || "").trim();
    if (!org) continue;
    const email = (row["Email"] || "").trim().toLowerCase();

    // identity: same org + email + first model — skip if already imported
    const dupe = await db.donationRequest.findFirst({
      where: { organisationName: org, email, laptopUses: (row["Laptop Uses"] || "").trim() || null },
    });
    if (dupe) {
      console.log(`  request from "${org}" already imported — skipping`);
      continue;
    }

    const items: { laptopId: string; quantityRequested: number; quantityApproved: number | null }[] = [];
    for (let n = 1; n <= 4; n++) {
      const model = (row[`${n}. Laptop Model`] || "").trim();
      const qty = parseInt(row[`${n}. Quantity Requested`] || "0", 10) || 0;
      const approved = row[`Approved Qty ${n}`]?.trim();
      if (!model || qty <= 0) continue;
      const laptopDbId = laptopByModel.get(model.toLowerCase());
      if (!laptopDbId) {
        console.warn(`  ! request "${org}": unknown laptop model "${model}" — line skipped`);
        continue;
      }
      items.push({
        laptopId: laptopDbId,
        quantityRequested: qty,
        quantityApproved: approved !== undefined && approved !== "" ? parseInt(approved, 10) || 0 : null,
      });
    }

    const status = (row["Status"] || "").trim();
    const approvedReq = status.toLowerCase() === "approved";
    seq += 1;
    await db.donationRequest.create({
      data: {
        requestId: `R-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`,
        organisationName: org,
        uen: (row["Unique Entity Number (UEN)"] || "").trim() || null,
        contactPerson: (row["Contact Person"] || "").trim() || null,
        email,
        country: (row["Country"] || "").trim() || null,
        countryCode: (row["Country Code"] || "").trim() || null,
        phoneNumber: (row["Phone Number"] || "").trim() || null,
        laptopUses: (row["Laptop Uses"] || "").trim() || null,
        decision: approvedReq ? "Approved" : "Pending",
        decidedAt: approvedReq ? new Date() : null,
        fulfilmentStatus: approvedReq ? "Processing" : null,
        processingAt: approvedReq ? new Date() : null,
        items: {
          create: items.map((i) => ({
            laptopId: i.laptopId,
            quantityRequested: i.quantityRequested,
            quantityApproved: approvedReq ? i.quantityApproved ?? 0 : null,
          })),
        },
      },
    });
    reqCount++;
  }
  console.log(`Requests: ${reqCount} imported`);

  // ---- Verify stock math ----
  console.log("\nStock check (should match the Glide export):");
  const all = await db.laptop.findMany({
    include: { items: { include: { request: { select: { decision: true } } } } },
    orderBy: { laptopId: "asc" },
  });
  for (const l of all) {
    const reserved = l.items
      .filter((i) => i.request.decision === "Approved")
      .reduce((s, i) => s + (i.quantityApproved ?? 0), 0);
    console.log(`  ${l.laptopId} ${l.model}: ${l.originalUnits - reserved} of ${l.originalUnits} available`);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      "\n! BLOB_READ_WRITE_TOKEN not set — laptop photos still point at Glide URLs. Re-run the import (or re-upload photos in admin) once Blob storage is attached, since Glide URLs may stop working if the Glide app is deleted."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

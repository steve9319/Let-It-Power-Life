/**
 * Re-host laptop and showcase photos onto Vercel Blob so the app no longer
 * depends on external (e.g. Glide) image URLs. Idempotent: skips images already
 * on Vercel Blob. Run with:
 *   DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... npm run rehost-photos
 */
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const db = new PrismaClient();

function alreadyOnBlob(url: string | null): boolean {
  return !!url && url.includes("vercel-storage.com");
}

async function rehost(url: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (url.split("?")[0].split(".").pop() || "jpg").slice(0, 5);
    const blob = await put(`${key}.${ext}`, buf, { access: "public" });
    return blob.url;
  } catch (err) {
    console.warn(`  ! failed for ${key} (${err})`);
    return null;
  }
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is required. Aborting.");
    process.exit(1);
  }

  const laptops = await db.laptop.findMany();
  let done = 0;
  for (const l of laptops) {
    if (!l.photoUrl || alreadyOnBlob(l.photoUrl)) continue;
    const newUrl = await rehost(l.photoUrl, `laptops/${l.laptopId}`);
    if (newUrl) {
      await db.laptop.update({ where: { id: l.id }, data: { photoUrl: newUrl } });
      console.log(`  ${l.laptopId}: re-hosted -> ${newUrl}`);
      done++;
    }
  }
  console.log(`Laptops re-hosted: ${done}`);

  const donations = await db.pastDonation.findMany();
  let dDone = 0;
  for (const d of donations) {
    if (!d.photoUrl || alreadyOnBlob(d.photoUrl)) continue;
    const newUrl = await rehost(d.photoUrl, `showcase/${d.id}`);
    if (newUrl) {
      await db.pastDonation.update({ where: { id: d.id }, data: { photoUrl: newUrl } });
      dDone++;
    }
  }
  console.log(`Showcase photos re-hosted: ${dDone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

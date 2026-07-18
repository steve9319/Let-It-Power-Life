import crypto from "crypto";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 3;

export async function requestOtp(rawEmail: string): Promise<{ ok: boolean; error?: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await db.otp.count({ where: { email, createdAt: { gte: since } } });
  if (recent >= RATE_MAX) {
    return { ok: false, error: "Too many codes requested. Please wait 15 minutes and try again." };
  }
  const code = crypto.randomInt(100000, 1000000).toString();
  await db.otp.create({
    data: { email, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[otp] email send failed:", detail);
    return {
      ok: false,
      error: "We couldn't send the verification email right now. Please try again shortly, or contact us if it persists.",
    };
  }
  return { ok: true };
}

export async function verifyOtp(rawEmail: string, rawCode: string): Promise<{ ok: boolean; error?: string }> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();
  const otp = await db.otp.findFirst({
    where: { email, consumed: false, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, error: "Code expired or not found. Please request a new code." };
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Please request a new code." };
  }
  if (otp.code !== code) {
    await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Incorrect code. Please check and try again." };
  }
  await db.otp.update({ where: { id: otp.id }, data: { consumed: true } });
  return { ok: true };
}

import crypto from "crypto";
import { cookies } from "next/headers";

const secret = () => process.env.SESSION_SECRET || "dev-only-secret";

export function sign(value: string): string {
  const sig = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${Buffer.from(value).toString("base64url")}.${sig}`;
}

export function unsign(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const value = Buffer.from(token.slice(0, dot), "base64url").toString();
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  const given = token.slice(dot + 1);
  if (expected.length !== given.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) return null;
  return value;
}

const REQUESTOR_COOKIE = "lipl_requestor";
const ADMIN_COOKIE = "lipl_admin";

export async function setRequestorEmail(email: string) {
  const jar = await cookies();
  jar.set(REQUESTOR_COOKIE, sign(email.toLowerCase()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2, // 2 hours
    path: "/",
  });
}

export async function getRequestorEmail(): Promise<string | null> {
  const jar = await cookies();
  return unsign(jar.get(REQUESTOR_COOKIE)?.value);
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return unsign(jar.get(ADMIN_COOKIE)?.value) === "admin";
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendCodeAction, verifyCodeAction } from "@/app/actions/public";

const inputCls =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal bg-white";
const labelCls = "block text-sm font-semibold mb-1.5 mt-4";
const btnPrimary =
  "bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnGhost = "text-navy/60 hover:text-navy font-semibold px-4 py-2.5";

export function DonateSignIn() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold">Verify your email</h2>
      <p className="text-sm text-navy/60 mt-1">
        We&apos;ll send a 6-digit code. No password — this email is how we contact you about the laptop.
      </p>
      {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
      <label className={labelCls}>Email</label>
      <input
        className={inputCls}
        type="email"
        autoComplete="email"
        value={email}
        disabled={sent}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
      />
      {sent && (
        <>
          <label className={labelCls}>6-digit code</label>
          <input
            className={`${inputCls} tracking-[0.5em] font-mono text-lg`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
          <p className="text-xs text-navy/50 mt-2">Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.</p>
        </>
      )}
      <div className="flex items-center justify-between mt-6">
        {sent ? (
          <button
            type="button"
            className={btnGhost}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await sendCodeAction(email);
                setError(r.ok ? null : r.error ?? "Could not send code.");
              })
            }
          >
            Resend code
          </button>
        ) : (
          <span />
        )}
        {sent ? (
          <button
            type="button"
            className={btnPrimary}
            disabled={pending || code.length !== 6}
            onClick={() =>
              startTransition(async () => {
                const r = await verifyCodeAction(email, code);
                if (r.ok) router.refresh();
                else setError(r.error ?? "Verification failed.");
              })
            }
          >
            {pending ? "Checking…" : "Verify"}
          </button>
        ) : (
          <button
            type="button"
            className={btnPrimary}
            disabled={pending || !email.includes("@")}
            onClick={() =>
              startTransition(async () => {
                const r = await sendCodeAction(email);
                if (r.ok) {
                  setSent(true);
                  setError(null);
                } else setError(r.error ?? "Could not send code.");
              })
            }
          >
            {pending ? "Sending…" : "Send code"}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendCodeAction, verifyCodeAction } from "@/app/actions/public";

export function TrackGate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal bg-white";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-md">
      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
      <label className="block text-sm font-semibold mb-1.5">Email used in your request</label>
      <input
        className={inputCls}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@organisation.org"
        disabled={sent}
      />
      {sent && (
        <>
          <label className="block text-sm font-semibold mb-1.5 mt-4">6-digit code</label>
          <input
            className={`${inputCls} tracking-[0.5em] font-mono text-lg`}
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
        </>
      )}
      <button
        className="mt-6 w-full bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50"
        disabled={pending || (!sent ? !email.includes("@") : code.length !== 6)}
        onClick={() =>
          startTransition(async () => {
            if (!sent) {
              const r = await sendCodeAction(email);
              if (r.ok) {
                setSent(true);
                setError(null);
              } else setError(r.error ?? "Could not send code.");
            } else {
              const r = await verifyCodeAction(email, code);
              if (r.ok) router.refresh();
              else setError(r.error ?? "Verification failed.");
            }
          })
        }
      >
        {pending ? "Please wait…" : sent ? "Verify & view requests" : "Send code"}
      </button>
    </div>
  );
}

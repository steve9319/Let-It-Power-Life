"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLoginAction, null);
  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-1">Admin login</h1>
        <p className="text-sm text-navy/60 mb-6">For the Let It Power Life team.</p>
        {state?.error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{state.error}</div>
        )}
        <form action={formAction}>
          <label className="block text-sm font-semibold mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <label className="block text-sm font-semibold mb-1.5 mt-4">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            disabled={pending}
            className="mt-6 w-full bg-navy hover:bg-navy-light text-white font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

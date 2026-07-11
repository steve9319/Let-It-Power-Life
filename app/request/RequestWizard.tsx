"use client";

import { useState, useTransition } from "react";
import { sendCodeAction, verifyCodeAction, submitRequestAction } from "@/app/actions/public";

type WizardLaptop = {
  id: string;
  laptopId: string;
  model: string;
  spec: string;
  photoUrl: string | null;
  available: number;
};

const STEPS = ["Verify", "Organisation", "Laptops", "Purpose", "Review"];

const inputCls =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal bg-white";
const labelCls = "block text-sm font-semibold mb-1.5 mt-4";
const btnPrimary =
  "bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnGhost = "text-navy/60 hover:text-navy font-semibold px-4 py-2.5";

export function RequestWizard({
  laptops,
  countries,
  preselect,
}: {
  laptops: WizardLaptop[];
  countries: { country: string; code: string }[];
  preselect: string | null;
}) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  // Step 2
  const [org, setOrg] = useState("");
  const [uen, setUen] = useState("");
  const [contact, setContact] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3
  const [quantities, setQuantities] = useState<Record<string, number>>(
    preselect && laptops.some((l) => l.id === preselect) ? { [preselect]: 1 } : {}
  );

  // Step 4
  const [uses, setUses] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientCountry, setRecipientCountry] = useState("");
  const [allocation, setAllocation] = useState("");
  const [notes, setNotes] = useState("");

  const [doneId, setDoneId] = useState<string | null>(null);

  const dialCode = countries.find((c) => c.country === country)?.code ?? "";
  const selected = laptops.filter((l) => (quantities[l.id] ?? 0) > 0);

  const setQty = (id: string, qty: number, max: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, Math.min(max, qty)) }));

  const next = () => {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  if (doneId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Request submitted!</h2>
        <p className="text-navy/70">
          Your request ID is <span className="font-mono font-bold text-teal-dark">{doneId}</span>.
        </p>
        <p className="text-navy/70 mt-2">
          A confirmation has been emailed to <strong>{email}</strong>. We&apos;ll email you again at every
          step — you can also check progress anytime on the <a href="/track" className="text-teal underline">Track Request</a> page.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                i < step ? "bg-teal text-white" : i === step ? "bg-navy text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <div className={`text-[11px] ${i === step ? "font-bold text-navy" : "text-navy/50"}`}>{s}</div>
          </div>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      {/* STEP 1 — Verify email */}
      {step === 0 && (
        <div>
          <h2 className="text-xl font-bold">Verify your email</h2>
          <p className="text-sm text-navy/60 mt-1">We&apos;ll send a 6-digit code to confirm it&apos;s really you.</p>
          <label className={labelCls}>Work email address</label>
          <input
            className={inputCls}
            type="email"
            value={email}
            disabled={verified}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organisation.org"
          />
          {codeSent && !verified && (
            <>
              <label className={labelCls}>6-digit code</label>
              <input
                className={`${inputCls} tracking-[0.5em] font-mono text-lg`}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
              />
              <p className="text-xs text-navy/50 mt-2">Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.</p>
            </>
          )}
          <div className="flex items-center justify-between mt-6">
            {verified ? (
              <span className="text-teal-dark font-semibold text-sm">✓ {email} verified</span>
            ) : codeSent ? (
              <button
                className={btnGhost}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await sendCodeAction(email);
                    setError(r.ok ? null : r.error ?? null);
                  })
                }
              >
                Resend code
              </button>
            ) : (
              <span />
            )}
            {!verified ? (
              codeSent ? (
                <button
                  className={btnPrimary}
                  disabled={pending || code.length !== 6}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await verifyCodeAction(email, code);
                      if (r.ok) {
                        setVerified(true);
                        setError(null);
                        setStep(1);
                      } else setError(r.error ?? "Verification failed.");
                    })
                  }
                >
                  {pending ? "Checking…" : "Verify"}
                </button>
              ) : (
                <button
                  className={btnPrimary}
                  disabled={pending || !email.includes("@")}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await sendCodeAction(email);
                      if (r.ok) {
                        setCodeSent(true);
                        setError(null);
                      } else setError(r.error ?? "Could not send code.");
                    })
                  }
                >
                  {pending ? "Sending…" : "Send code"}
                </button>
              )
            ) : (
              <button className={btnPrimary} onClick={next}>
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2 — Organisation */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold">About your organisation</h2>
          <label className={labelCls}>Organisation name *</label>
          <input className={inputCls} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Glory Presbyterian Church" />
          <label className={labelCls}>Unique Entity Number (UEN)</label>
          <input className={inputCls} value={uen} onChange={(e) => setUen(e.target.value)} placeholder="e.g. T14SS0059J" />
          <label className={labelCls}>Contact person *</label>
          <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Country *</label>
              <select className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Select country…</option>
                {countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.country} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone number *</label>
              <div className="flex gap-2">
                <span className="rounded-xl border border-gray-300 bg-cream px-3 py-2.5 text-navy/70 min-w-[64px] text-center">
                  {dialCode || "+"}
                </span>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765432" />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button className={btnGhost} onClick={back}>← Back</button>
            <button
              className={btnPrimary}
              disabled={!org.trim() || !contact.trim() || !country || !phone.trim()}
              onClick={next}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Laptops */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold">Select laptops</h2>
          <p className="text-sm text-navy/60 mt-1">Choose models and quantities (limited to current stock).</p>
          <div className="mt-4 space-y-3">
            {laptops.length === 0 && (
              <div className="text-navy/60 text-sm bg-cream rounded-xl p-4">No laptops in stock right now.</div>
            )}
            {laptops.map((l) => {
              const qty = quantities[l.id] ?? 0;
              return (
                <div key={l.id} className={`flex items-center gap-4 rounded-xl border p-3 ${qty > 0 ? "border-teal bg-teal-light/40" : "border-gray-200"}`}>
                  {l.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photoUrl} alt={l.model} className="w-16 h-12 object-cover rounded-lg bg-gray-100" />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center">💻</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{l.model}</div>
                    <div className="text-xs text-navy/60">{l.spec} · {l.available} available</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold disabled:opacity-40"
                      disabled={qty === 0}
                      onClick={() => setQty(l.id, qty - 1, l.available)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{qty}</span>
                    <button
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold disabled:opacity-40"
                      disabled={qty >= l.available}
                      onClick={() => setQty(l.id, qty + 1, l.available)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="mt-4 text-sm bg-cream rounded-xl px-4 py-3">
              <strong>You are requesting:</strong>{" "}
              {selected.map((l) => `${quantities[l.id]} × ${l.model}`).join(", ")}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button className={btnGhost} onClick={back}>← Back</button>
            <button className={btnPrimary} disabled={selected.length === 0} onClick={next}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Purpose & recipient */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold">Purpose & final recipient</h2>
          <label className={labelCls}>How will these laptops be used? *</label>
          <textarea
            className={`${inputCls} min-h-[100px]`}
            value={uses}
            onChange={(e) => setUses(e.target.value)}
            placeholder="e.g. Special needs education & rehab support under Outreach & Missions"
          />
          <label className={labelCls}>Final recipient organisation *</label>
          <input
            className={inputCls}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Which organisation will ultimately receive these laptops?"
          />
          <p className="text-xs text-navy/50 mt-1">If your own organisation will use them, enter the same name.</p>
          <label className={labelCls}>Final recipient country (optional)</label>
          <input className={inputCls} value={recipientCountry} onChange={(e) => setRecipientCountry(e.target.value)} placeholder="e.g. Laos" />
          <label className={labelCls}>Proposed allocation *</label>
          <textarea
            className={`${inputCls} min-h-[90px]`}
            value={allocation}
            onChange={(e) => setAllocation(e.target.value)}
            placeholder="How do you plan to allocate these laptops? e.g. 5 to a rural school, 3 to a youth training centre"
          />
          <p className="text-xs text-navy/50 mt-1">Which beneficiaries or programmes will receive them, and roughly how many to each.</p>
          <label className={labelCls}>Notes (optional)</label>
          <textarea className={`${inputCls} min-h-[70px]`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else we should know?" />
          <div className="flex justify-between mt-6">
            <button className={btnGhost} onClick={back}>← Back</button>
            <button className={btnPrimary} disabled={!uses.trim() || !recipient.trim() || !allocation.trim()} onClick={next}>
              Review request
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 — Review */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Review & submit</h2>
          <div className="space-y-4 text-sm">
            <ReviewBlock title="Contact" onEdit={() => setStep(0)}>
              {email} (verified ✓)
            </ReviewBlock>
            <ReviewBlock title="Organisation" onEdit={() => setStep(1)}>
              {org} {uen && `· UEN ${uen}`}<br />
              {contact} · {country} {dialCode} {phone}
            </ReviewBlock>
            <ReviewBlock title="Laptops" onEdit={() => setStep(2)}>
              {selected.map((l) => (
                <div key={l.id}>
                  {quantities[l.id]} × {l.model}
                </div>
              ))}
            </ReviewBlock>
            <ReviewBlock title="Purpose & recipient" onEdit={() => setStep(3)}>
              {uses}
              <br />
              <strong>Final recipient:</strong> {recipient}
              {recipientCountry && ` (${recipientCountry})`}
              <br />
              <strong>Proposed allocation:</strong> {allocation}
              {notes && (
                <>
                  <br />
                  <strong>Notes:</strong> {notes}
                </>
              )}
            </ReviewBlock>
          </div>
          <div className="flex justify-between mt-6">
            <button className={btnGhost} onClick={back}>← Back</button>
            <button
              className={btnPrimary}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await submitRequestAction({
                    organisationName: org,
                    uen,
                    contactPerson: contact,
                    country,
                    phoneNumber: phone,
                    laptopUses: uses,
                    notes,
                    finalRecipientOrg: recipient,
                    finalRecipientCountry: recipientCountry,
                    proposedAllocation: allocation,
                    items: laptops.map((l) => ({ laptopId: l.id, quantity: quantities[l.id] ?? 0 })),
                  });
                  if (r.ok) setDoneId(r.requestId!);
                  else setError(r.error ?? "Submission failed.");
                })
              }
            >
              {pending ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-cream rounded-xl p-4">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">{title}</span>
        <button className="text-teal text-xs font-semibold underline" onClick={onEdit}>
          Edit
        </button>
      </div>
      <div className="text-navy/80">{children}</div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitDonationAction, useDifferentEmailAction } from "@/app/actions/public";
import {
  CHARGER_OPTIONS,
  CONDITION_OPTIONS,
  DATA_WIPED_OPTIONS,
  HANDOVER_OPTIONS,
  LAPTOP_BRANDS,
  OTHER_BRAND,
} from "@/lib/donation";

const inputCls =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal bg-white";
const labelCls = "block text-sm font-semibold mb-1.5 mt-4";
const btnPrimary =
  "bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnGhost = "text-navy/60 hover:text-navy font-semibold px-4 py-2.5";

export function DonateForm({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaving, startLeaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [doneName, setDoneName] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandOther, setBrandOther] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [charger, setCharger] = useState("");
  const [phone, setPhone] = useState("");
  const [model, setModel] = useState("");
  const [age, setAge] = useState("");
  const [condition, setCondition] = useState("");
  const [dataWiped, setDataWiped] = useState("");
  const [handover, setHandover] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = name.trim().length > 0 && brand.length > 0 && quantity >= 1 && charger.length > 0;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await submitDonationAction({
        name,
        brand,
        brandOther,
        quantity,
        chargerIncluded: charger,
        phone,
        model,
        approximateAge: age,
        condition,
        dataWiped,
        handover,
        location,
        notes,
      });
      if (r.ok) {
        setDoneId(r.donationId);
        setDoneName(name.trim());
        setBrand("");
        setBrandOther("");
        setQuantity(1);
        setCharger("");
        setPhone("");
        setModel("");
        setAge("");
        setCondition("");
        setDataWiped("");
        setHandover("");
        setLocation("");
        setNotes("");
        router.refresh();
      } else {
        setError(r.error ?? "Submission failed.");
        if ("donationId" in r && r.donationId) {
          setDoneId(r.donationId);
          setDoneName(name.trim());
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      {doneId && (
        <div className="mb-6 rounded-xl bg-teal-light border border-teal/20 px-4 py-4 text-sm text-teal-dark">
          <div className="font-bold text-base">Thank you{doneName ? `, ${doneName}` : ""}.</div>
          <p className="mt-1">
            Your offer ID is <span className="font-mono font-bold">{doneId}</span>.
            {error
              ? " We saved it. You don't need to submit it again."
              : ` A confirmation is on its way to ${email}.`}
          </p>
        </div>
      )}
      <h2 className="text-xl font-bold">Offer a laptop</h2>
      <p className="text-sm text-navy/60 mt-1">
        We&apos;ll contact you at <strong className="text-navy">{email}</strong>.
      </p>
      {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      <label className={labelCls} htmlFor="donor-name">Your name *</label>
      <input id="donor-name" className={inputCls} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />

      <label className={labelCls} htmlFor="donor-brand">Brand *</label>
      <select id="donor-brand" className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)}>
        <option value="">Choose a brand…</option>
        {LAPTOP_BRANDS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      {brand === OTHER_BRAND && (
        <>
          <label className={labelCls} htmlFor="donor-brand-other">Which brand?</label>
          <input
            id="donor-brand-other"
            className={inputCls}
            value={brandOther}
            onChange={(e) => setBrandOther(e.target.value)}
            placeholder="If you know it"
          />
        </>
      )}

      <label className={labelCls} htmlFor="donor-qty">Number of laptops *</label>
      <input
        id="donor-qty"
        className={inputCls}
        type="number"
        min={1}
        max={30}
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value === "" ? 0 : Number(e.target.value))}
      />

      <fieldset className="mt-4">
        <legend className="block text-sm font-semibold mb-1.5">Is the charger included? *</legend>
        <div className="flex flex-wrap gap-2">
          {CHARGER_OPTIONS.map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                charger === option ? "border-teal bg-teal-light text-teal-dark" : "border-gray-300 bg-white text-navy"
              }`}
            >
              <input
                type="radio"
                name="charger"
                className="sr-only"
                value={option}
                checked={charger === option}
                onChange={() => setCharger(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <details className="mt-6 rounded-xl border border-gray-200 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy">More about the laptop (optional)</summary>
        <p className="text-xs text-navy/50 mt-2">Skip anything you don&apos;t know.</p>

        <label className={labelCls} htmlFor="donor-phone">Phone</label>
        <input id="donor-phone" className={inputCls} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label className={labelCls} htmlFor="donor-model">Model</label>
        <input id="donor-model" className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} placeholder="If you know it" />

        <label className={labelCls} htmlFor="donor-age">Approximate age</label>
        <input id="donor-age" className={inputCls} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. about 6 years" />

        <label className={labelCls} htmlFor="donor-condition">Condition</label>
        <select id="donor-condition" className={inputCls} value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="">Choose one…</option>
          {CONDITION_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <label className={labelCls} htmlFor="donor-wiped">Has the data been wiped?</label>
        <select id="donor-wiped" className={inputCls} value={dataWiped} onChange={(e) => setDataWiped(e.target.value)}>
          <option value="">Choose one…</option>
          {DATA_WIPED_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <p className="text-xs text-navy/50 mt-1">
          Please back up anything you want to keep, then wipe the laptop if you can. If you&apos;re not sure how, choose Not sure and we&apos;ll help.
        </p>

        <label className={labelCls} htmlFor="donor-handover">Preferred handover</label>
        <select id="donor-handover" className={inputCls} value={handover} onChange={(e) => setHandover(e.target.value)}>
          <option value="">No preference</option>
          {HANDOVER_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <label className={labelCls} htmlFor="donor-area">Your area</label>
        <input id="donor-area" className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Neighbourhood or city" />

        <label className={labelCls} htmlFor="donor-notes">Notes</label>
        <textarea id="donor-notes" className={`${inputCls} min-h-[70px]`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </details>

      <div className="flex items-center justify-between mt-6 gap-3">
        <button
          type="button"
          className={btnGhost}
          disabled={leaving}
          onClick={() =>
            startLeaving(async () => {
              await useDifferentEmailAction();
              router.refresh();
            })
          }
        >
          Use a different email
        </button>
        <button type="button" className={btnPrimary} disabled={pending || !canSubmit} onClick={submit}>
          {pending ? "Submitting…" : "Submit offer"}
        </button>
      </div>
    </div>
  );
}

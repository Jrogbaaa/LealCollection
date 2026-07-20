"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  bookingSubtotal,
  depositAmount,
  formatEuros,
  type ExtraLine,
  type Slot,
} from "@/lib/pricing";

type Boat = {
  id: number;
  slug: string;
  nameEn: string;
  nameEs: string;
  capacity: number;
  priceFullDay: number;
  priceMorning: number;
  priceAfternoon: number;
};

type Extra = {
  id: number;
  key: string;
  labelEn: string;
  labelEs: string;
  price: number;
  isIncluded: boolean;
};

const SLOTS: Slot[] = ["full_day", "morning", "afternoon"];
const SLOT_LABEL_KEY: Record<Slot, "slotFullDay" | "slotMorning" | "slotAfternoon"> = {
  full_day: "slotFullDay",
  morning: "slotMorning",
  afternoon: "slotAfternoon",
};

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingFlow({
  locale,
  boat,
  extras,
  blockedFullDates,
  blockedSlotsByDate,
}: {
  locale: string;
  boat: Boat;
  extras: Extra[];
  blockedFullDates: string[];
  blockedSlotsByDate: Record<string, Slot[]>;
}) {
  const t = useTranslations("reserva");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get("date");
  const initialSlot = searchParams.get("slot") as Slot | null;
  const initialExtras = searchParams.get("extras");

  const [date, setDate] = useState<Date | undefined>(
    initialDate ? new Date(`${initialDate}T00:00:00`) : undefined
  );
  const [slot, setSlot] = useState<Slot>(
    initialSlot && SLOTS.includes(initialSlot) ? initialSlot : "full_day"
  );
  const [selectedExtraKeys, setSelectedExtraKeys] = useState<Set<string>>(
    new Set(initialExtras ? initialExtras.split(",").filter(Boolean) : [])
  );
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unpriced extras (price === 0, not included) aren't bookable yet — showing them as
  // checkboxes would let a customer add a real add-on for free.
  const selectableExtras = extras.filter((e) => !e.isIncluded && e.price > 0);
  const includedExtras = extras.filter((e) => e.isIncluded);
  const askUsExtras = extras.filter((e) => !e.isIncluded && e.price === 0);

  const dateStr = date ? toDateOnly(date) : null;
  const blockedSlotsForDate = dateStr ? (blockedSlotsByDate[dateStr] ?? []) : [];

  function syncUrl(next: { date?: Date; slot?: Slot; extraKeys?: Set<string> }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("boat", boat.slug);
    const nextDate = next.date ?? date;
    const nextSlot = next.slot ?? slot;
    const nextExtras = next.extraKeys ?? selectedExtraKeys;
    if (nextDate) params.set("date", toDateOnly(nextDate));
    params.set("slot", nextSlot);
    if (nextExtras.size > 0) {
      params.set("extras", Array.from(nextExtras).join(","));
    } else {
      params.delete("extras");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSelectDate(d: Date | undefined) {
    setDate(d);
    if (d) {
      const ds = toDateOnly(d);
      const blockedForNewDate = blockedSlotsByDate[ds] ?? [];
      if (blockedForNewDate.includes(slot)) {
        const firstOpen = SLOTS.find((s) => !blockedForNewDate.includes(s));
        if (firstOpen) setSlot(firstOpen);
      }
      syncUrl({ date: d });
    }
  }

  function handleSelectSlot(s: Slot) {
    setSlot(s);
    syncUrl({ slot: s });
  }

  function toggleExtra(key: string) {
    const next = new Set(selectedExtraKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedExtraKeys(next);
    syncUrl({ extraKeys: next });
  }

  const extraLines: ExtraLine[] = useMemo(
    () =>
      selectableExtras
        .filter((e) => selectedExtraKeys.has(e.key))
        .map((e) => ({ extraId: e.id, unitPrice: e.price, qty: 1 })),
    [selectableExtras, selectedExtraKeys]
  );

  const priceAvailable = boat.priceFullDay > 0;
  const subtotal = priceAvailable ? bookingSubtotal(boat, slot, extraLines) : 0;
  const deposit = depositAmount(subtotal);
  const balance = subtotal - deposit;

  const disabledMatchers = useMemo(
    () => [{ before: new Date(new Date().setHours(0, 0, 0, 0)) }, ...blockedFullDates.map((d) => new Date(`${d}T00:00:00`))],
    [blockedFullDates]
  );

  const canSubmit =
    priceAvailable &&
    !!date &&
    !blockedSlotsForDate.includes(slot) &&
    guests >= 1 &&
    guests <= boat.capacity &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !dateStr) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatSlug: boat.slug,
          date: dateStr,
          slot,
          extraKeys: Array.from(selectedExtraKeys),
          guests,
          name,
          email,
          phone,
          notes,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "checkout_failed");
      }
      window.location.href = data.url;
    } catch {
      setError(t("errorGeneric"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 grid gap-12 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-12">
        <section>
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold-600">
            {t("stepDate")}
          </h2>
          <div className="mt-4 rdp-root inline-block rounded-sm border border-marine-950/10 p-4 [--rdp-accent-color:var(--color-marine-700)] [--rdp-today-color:var(--color-gold-600)]">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleSelectDate}
              disabled={disabledMatchers}
              defaultMonth={date}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold-600">
            {t("stepSlot")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {SLOTS.map((s) => {
              const blocked = blockedSlotsForDate.includes(s);
              const active = slot === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={blocked}
                  onClick={() => handleSelectSlot(s)}
                  className={`rounded-full border px-6 py-3 text-sm uppercase tracking-widest transition ${
                    active
                      ? "border-marine-950 bg-marine-950 text-sand-50"
                      : "border-marine-950/20 text-marine-900 hover:border-marine-950"
                  } ${blocked ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {t(SLOT_LABEL_KEY[s])}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold-600">
            {t("stepExtras")}
          </h2>
          <div className="mt-4 grid gap-px overflow-hidden rounded-sm bg-marine-950/10 sm:grid-cols-2">
            {selectableExtras.map((extra) => {
              const checked = selectedExtraKeys.has(extra.key);
              return (
                <label
                  key={extra.key}
                  className="flex cursor-pointer items-center justify-between gap-4 bg-sand-50 p-5"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExtra(extra.key)}
                      className="h-4 w-4 accent-marine-700"
                    />
                    <span className="text-marine-950">
                      {locale === "es" ? extra.labelEs : extra.labelEn}
                    </span>
                  </span>
                  <span className="text-sm text-gold-600">
                    {formatEuros(extra.price, locale)}
                  </span>
                </label>
              );
            })}
          </div>
          {includedExtras.length > 0 && (
            <p className="mt-3 text-xs uppercase tracking-wide text-marine-900/50">
              {includedExtras.map((e) => (locale === "es" ? e.labelEs : e.labelEn)).join(" · ")}
            </p>
          )}
          {askUsExtras.length > 0 && (
            <p className="mt-1 text-xs text-marine-900/40">
              {askUsExtras.map((e) => (locale === "es" ? e.labelEs : e.labelEn)).join(" · ")}
              {" "}
              ({t("askUsExtra")})
            </p>
          )}
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold-600">
            {t("stepDetails")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name")}
              className="rounded-sm border border-marine-950/20 bg-sand-50 px-4 py-3 text-marine-950 placeholder:text-marine-900/40 focus:border-marine-700 focus:outline-none"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="rounded-sm border border-marine-950/20 bg-sand-50 px-4 py-3 text-marine-950 placeholder:text-marine-900/40 focus:border-marine-700 focus:outline-none"
            />
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phone")}
              className="rounded-sm border border-marine-950/20 bg-sand-50 px-4 py-3 text-marine-950 placeholder:text-marine-900/40 focus:border-marine-700 focus:outline-none"
            />
            <div>
              <input
                required
                type="number"
                min={1}
                max={boat.capacity}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                placeholder={t("guests")}
                className="w-full rounded-sm border border-marine-950/20 bg-sand-50 px-4 py-3 text-marine-950 focus:border-marine-700 focus:outline-none"
              />
              {guests > boat.capacity && (
                <p className="mt-1 text-xs text-red-700">
                  {t("guestsOverCapacity", { capacity: boat.capacity })}
                </p>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="rounded-sm border border-marine-950/20 bg-sand-50 px-4 py-3 text-marine-950 placeholder:text-marine-900/40 focus:border-marine-700 focus:outline-none sm:col-span-2"
            />
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-sm border border-marine-950/10 p-8">
        <h2 className="font-display text-xl text-marine-950">{t("summaryTitle")}</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-marine-900/60">{t("summaryBoat")}</dt>
            <dd className="text-marine-950">{locale === "es" ? boat.nameEs : boat.nameEn}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-marine-900/60">{t("summaryDate")}</dt>
            <dd className="text-marine-950">{dateStr ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-marine-900/60">{t("summarySlot")}</dt>
            <dd className="text-marine-950">{t(SLOT_LABEL_KEY[slot])}</dd>
          </div>
        </dl>

        {!priceAvailable ? (
          <p className="mt-6 text-sm text-marine-900/70">{t("priceUnavailable")}</p>
        ) : date ? (
          <dl className="mt-6 space-y-3 border-t border-marine-950/10 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-marine-900/60">{t("summarySubtotal")}</dt>
              <dd className="text-marine-950">{formatEuros(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between font-display text-lg">
              <dt className="text-marine-950">{t("summaryDeposit")}</dt>
              <dd className="text-marine-950">{formatEuros(deposit, locale)}</dd>
            </div>
            <div className="flex justify-between text-xs text-marine-900/50">
              <dt>{t("summaryBalance")}</dt>
              <dd>{formatEuros(balance, locale)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-6 text-sm text-marine-900/50">{t("selectDatePrompt")}</p>
        )}

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-8 block w-full rounded-full bg-gold-500 px-8 py-4 text-center text-sm uppercase tracking-widest text-marine-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? t("submitting")
            : date
              ? t("payButton", { amount: formatEuros(deposit, locale) })
              : t("payButtonDisabled")}
        </button>
      </aside>
    </form>
  );
}

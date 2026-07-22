import { getAllBlockedDates } from "@/db/queries";
import { addBlockedDate, deleteBlockedDate } from "./actions";

const SLOT_LABELS: Record<string, string> = {
  full_day: "Full day",
  morning: "Morning",
  afternoon: "Afternoon",
};

export default async function BlockedDatesPage() {
  const blocked = await getAllBlockedDates();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-marine-950">Blocked dates</h1>
      <p className="mt-2 text-sm text-marine-900/70">
        Take a day off the booking calendar (maintenance, private use). Blocked days are
        greyed out on the public calendar and rejected at checkout.
      </p>

      <form action={addBlockedDate} className="mt-8 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-marine-900/60">
          Block a day
          <input
            required
            type="date"
            name="date"
            className="rounded-sm border border-marine-950/20 bg-white px-4 py-2.5 text-base normal-case tracking-normal text-marine-950 focus:border-marine-700 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-marine-950 px-6 py-2.5 text-sm uppercase tracking-widest text-sand-50 hover:bg-marine-900"
        >
          Block day
        </button>
      </form>

      <section className="mt-12">
        <h2 className="font-display text-xl text-marine-950">Currently blocked</h2>
        {blocked.length === 0 ? (
          <p className="mt-4 text-sm text-marine-900/60">No blocked dates.</p>
        ) : (
          <ul className="mt-4 divide-y divide-marine-950/10 border-y border-marine-950/10">
            {blocked.map((b) => {
              const remove = deleteBlockedDate.bind(null, b.id);
              return (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-marine-950">
                    {b.date}
                    <span className="ml-3 text-xs uppercase tracking-widest text-marine-900/50">
                      {b.slot ? SLOT_LABELS[b.slot] : "Whole day"}
                    </span>
                  </span>
                  <form action={remove}>
                    <button type="submit" className="text-xs text-red-700 hover:underline">
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

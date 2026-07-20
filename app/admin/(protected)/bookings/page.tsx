import Link from "next/link";
import { getAllBookings } from "@/db/queries";
import { formatEuros } from "@/lib/pricing";
import { cancelBooking } from "./actions";

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as Status) ? (status as Status) : undefined;
  const rows = await getAllBookings(activeStatus);

  return (
    <div>
      <h1 className="font-display text-3xl text-marine-950">Bookings</h1>

      <div className="mt-4 flex gap-2 text-sm">
        <Link
          href="/admin/bookings"
          className={`rounded-full px-4 py-1.5 ${!activeStatus ? "bg-marine-950 text-sand-50" : "border border-marine-950/20 text-marine-900"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/bookings?status=${s}`}
            className={`rounded-full px-4 py-1.5 capitalize ${activeStatus === s ? "bg-marine-950 text-sand-50" : "border border-marine-950/20 text-marine-900"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-marine-950/10 text-left text-xs uppercase tracking-wide text-marine-900/50">
            <th className="py-3">Reference</th>
            <th className="py-3">Boat</th>
            <th className="py-3">Date</th>
            <th className="py-3">Customer</th>
            <th className="py-3">Deposit</th>
            <th className="py-3">Status</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const cancelWithId = cancelBooking.bind(null, b.id);
            return (
              <tr key={b.id} className="border-b border-marine-950/5 align-top">
                <td className="py-3 font-mono text-marine-950">{b.reference}</td>
                <td className="py-3 text-marine-900/70">{b.boat.nameEn}</td>
                <td className="py-3 text-marine-900/70">
                  {b.bookingDate} · {b.slot.replace("_", " ")}
                </td>
                <td className="py-3 text-marine-900/70">
                  <div>{b.customerName}</div>
                  <div className="text-xs text-marine-900/50">{b.email}</div>
                  <div className="text-xs text-marine-900/50">{b.phone}</div>
                </td>
                <td className="py-3 text-marine-900/70">
                  {formatEuros(b.depositAmount, "en")}
                </td>
                <td className="py-3 capitalize text-marine-900/70">{b.status}</td>
                <td className="py-3 text-right">
                  {b.status !== "cancelled" && (
                    <form action={cancelWithId}>
                      <button type="submit" className="text-xs text-red-700 hover:underline">
                        Cancel
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-marine-900/50">
                No bookings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

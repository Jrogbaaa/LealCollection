import { NextRequest, NextResponse } from "next/server";
import { and, eq, or, isNull } from "drizzle-orm";
import { db } from "@/db/index";
import { boats, extras, bookings, bookingExtras, blockedDates } from "@/db/schema";
import { bookingSubtotal, depositAmount, slotPrice, type ExtraLine, type Slot } from "@/lib/pricing";
import { generateBookingReference } from "@/lib/booking-reference";
import { stripe } from "@/lib/stripe";

const SLOTS: Slot[] = ["full_day", "morning", "afternoon"];

/** A YYYY-MM-DD string can match the regex yet not be a real date (e.g. 2099-13-45). */
function isRealDate(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

type CheckoutBody = {
  boatSlug?: string;
  date?: string;
  slot?: string;
  extraKeys?: string[];
  guests?: number;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  locale?: string;
};

export async function POST(request: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { boatSlug, date, guests, name, email, phone, notes } = body;
  const slot = body.slot as Slot | undefined;
  const extraKeys = Array.isArray(body.extraKeys) ? body.extraKeys : [];
  const locale = body.locale === "es" ? "es" : "en";

  if (
    !boatSlug ||
    !date ||
    !slot ||
    !SLOTS.includes(slot) ||
    !guests ||
    !Number.isInteger(guests) ||
    !name?.trim() ||
    !email?.trim() ||
    !phone?.trim()
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRealDate(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json({ error: "date_in_past" }, { status: 400 });
  }

  const boat = await db.query.boats.findFirst({
    where: and(eq(boats.slug, boatSlug), eq(boats.isPublished, true)),
  });
  if (!boat) {
    return NextResponse.json({ error: "boat_not_found" }, { status: 404 });
  }
  // Gate on the SELECTED slot's price, not just the full-day price: a boat can have a
  // full-day price set while a morning/afternoon price is still 0, which would otherwise
  // produce a booking charged only for its extras (or a €0 Stripe session).
  if (slotPrice(boat, slot) <= 0) {
    return NextResponse.json({ error: "pricing_unavailable" }, { status: 409 });
  }
  if (guests < 1 || guests > boat.capacity) {
    return NextResponse.json({ error: "guests_out_of_range" }, { status: 400 });
  }

  const blockedForDate = await db.query.blockedDates.findMany({
    where: and(
      eq(blockedDates.date, date),
      or(eq(blockedDates.boatId, boat.id), isNull(blockedDates.boatId))
    ),
  });
  const dateFullyBlocked = blockedForDate.some((b) => !b.slot);
  const slotBlocked = blockedForDate.some((b) => b.slot === slot);
  if (dateFullyBlocked || slotBlocked) {
    return NextResponse.json({ error: "date_unavailable" }, { status: 409 });
  }

  const allExtras = await db.query.extras.findMany();
  const selectedExtras = allExtras.filter(
    (e) => !e.isIncluded && extraKeys.includes(e.key)
  );
  const extraLines: ExtraLine[] = selectedExtras.map((e) => ({
    extraId: e.id,
    unitPrice: e.price,
    qty: e.key === "towel_service" ? guests : 1,
  }));

  const subtotal = bookingSubtotal(boat, slot, extraLines);
  const deposit = depositAmount(subtotal);
  const reference = generateBookingReference();

  const [booking] = await db
    .insert(bookings)
    .values({
      reference,
      boatId: boat.id,
      bookingDate: date,
      slot,
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes?.trim() || null,
      guests,
      locale,
      subtotal,
      depositAmount: deposit,
      status: "pending",
    })
    .returning({ id: bookings.id });

  if (selectedExtras.length > 0) {
    await db.insert(bookingExtras).values(
      selectedExtras.map((e) => ({
        bookingId: booking.id,
        extraId: e.id,
        qty: e.key === "towel_service" ? guests : 1,
        unitPriceAtBooking: e.price,
      }))
    );
  }

  const origin = new URL(request.url).origin;
  const boatName = locale === "es" ? boat.nameEs : boat.nameEn;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: deposit,
          product_data: {
            name: `${boatName} — ${date} — deposit`,
            description: `Reservation ${reference}`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email.trim(),
    success_url: `${origin}/${locale}/reserva/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/reserva?boat=${boat.slug}`,
    metadata: { bookingId: String(booking.id), reference },
  });

  await db
    .update(bookings)
    .set({ stripeSessionId: session.id })
    .where(eq(bookings.id, booking.id));

  return NextResponse.json({ url: session.url });
}

import { Resend } from "resend";
import { db } from "@/db/index";
import { formatEuros } from "@/lib/pricing";

// No verified sending domain yet (TODOS.md [DOMAIN]) — Resend's sandbox sender only
// reliably delivers to the account owner's own address until that's set up.
const FROM = process.env.RESEND_FROM_EMAIL || "Leal Collection <onboarding@resend.dev>";

const copy = {
  en: {
    customerSubject: (ref: string) => `Your Leal Collection reservation ${ref} is confirmed`,
    ownerSubject: (ref: string) => `New booking ${ref}`,
    greeting: (name: string) => `Hi ${name},`,
    body: "Thank you — your deposit has been received and your charter is confirmed. Details below. The remaining balance is due before boarding.",
    boat: "Boat",
    date: "Date",
    slot: "Time",
    guests: "Guests",
    deposit: "Deposit paid",
    balance: "Balance due before boarding",
    slots: { full_day: "Full day", morning: "Morning", afternoon: "Afternoon" },
  },
  es: {
    customerSubject: (ref: string) => `Tu reserva ${ref} en Leal Collection está confirmada`,
    ownerSubject: (ref: string) => `Nueva reserva ${ref}`,
    greeting: (name: string) => `Hola ${name},`,
    body: "Gracias — hemos recibido tu depósito y tu chárter está confirmado. Detalles a continuación. El saldo restante se abona antes de embarcar.",
    boat: "Barco",
    date: "Fecha",
    slot: "Horario",
    guests: "Personas",
    deposit: "Depósito pagado",
    balance: "Saldo antes de embarcar",
    slots: { full_day: "Día completo", morning: "Mañana", afternoon: "Tarde" },
  },
} as const;

function renderBody(
  t: (typeof copy)[keyof typeof copy],
  recipientLine: string,
  reference: string,
  boatName: string,
  bookingDate: string,
  slot: "full_day" | "morning" | "afternoon",
  guests: number,
  depositAmount: number,
  balance: number,
  locale: string
) {
  return `
    <p>${recipientLine}</p>
    <p>${t.body}</p>
    <p><strong>${reference}</strong></p>
    <ul>
      <li>${t.boat}: ${boatName}</li>
      <li>${t.date}: ${bookingDate}</li>
      <li>${t.slot}: ${t.slots[slot]}</li>
      <li>${t.guests}: ${guests}</li>
      <li>${t.deposit}: ${formatEuros(depositAmount, locale)}</li>
      <li>${t.balance}: ${formatEuros(balance, locale)}</li>
    </ul>
  `;
}

/**
 * Fired once from the Stripe webhook after a booking flips to confirmed. Must never throw
 * back into the webhook handler — a failed send should not cause Stripe to retry the event
 * (which would double-book side effects), so callers should catch and log, not propagate.
 */
export async function sendBookingConfirmationEmails(bookingId: number) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email for booking", bookingId);
    return;
  }

  const booking = await db.query.bookings.findFirst({
    where: (b, { eq }) => eq(b.id, bookingId),
    with: { boat: true },
  });
  if (!booking) return;

  const locale = booking.locale === "es" ? "es" : "en";
  const t = copy[locale];
  const boatName = locale === "es" ? booking.boat.nameEs : booking.boat.nameEn;
  const balance = booking.subtotal - booking.depositAmount;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: booking.email,
    subject: t.customerSubject(booking.reference),
    html: renderBody(
      t,
      t.greeting(booking.customerName),
      booking.reference,
      boatName,
      booking.bookingDate,
      booking.slot,
      booking.guests,
      booking.depositAmount,
      balance,
      locale
    ),
  });

  const ownerEmail = process.env.ADMIN_EMAIL;
  if (ownerEmail) {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: t.ownerSubject(booking.reference),
      html: renderBody(
        t,
        `${booking.customerName} — ${booking.email} — ${booking.phone}`,
        booking.reference,
        boatName,
        booking.bookingDate,
        booking.slot,
        booking.guests,
        booking.depositAmount,
        balance,
        locale
      ),
    });
  }
}

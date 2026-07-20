import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db/index";
import { bookings } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { sendBookingConfirmationEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = Number(session.metadata?.bookingId);
    if (bookingId) {
      const existing = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });
      // Idempotent: a replayed webhook event must not re-trigger confirmation side effects.
      if (existing && existing.status === "pending") {
        await db
          .update(bookings)
          .set({
            status: "confirmed",
            stripePaymentIntent:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .where(eq(bookings.id, bookingId));

        // A failed send must not fail the webhook response — Stripe would retry the event,
        // which would re-run everything above against an already-confirmed booking.
        try {
          await sendBookingConfirmationEmails(bookingId);
        } catch (err) {
          console.error("Failed to send booking confirmation email", bookingId, err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

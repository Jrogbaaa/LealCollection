import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import { bookings } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { POST } from "./route";

function makeRequest(payload: string, signature: string) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

describe("stripe webhook", () => {
  let bookingId: number;

  beforeAll(async () => {
    await db.delete(bookings).where(eq(bookings.reference, "LC-TEST01"));
    const boat = await db.query.boats.findFirst({ where: (b, { eq }) => eq(b.slug, "cranchi-32") });
    if (!boat) throw new Error("Seed data missing — run db/seed.ts first");

    const [booking] = await db
      .insert(bookings)
      .values({
        reference: "LC-TEST01",
        boatId: boat.id,
        bookingDate: "2099-01-01",
        slot: "full_day",
        customerName: "Webhook Test",
        email: "webhook-test@example.com",
        phone: "+34600000000",
        guests: 2,
        locale: "en",
        subtotal: 95000,
        depositAmount: 47500,
        status: "pending",
        stripeSessionId: "cs_test_webhook_unit_test",
      })
      .returning({ id: bookings.id });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await db.delete(bookings).where(eq(bookings.id, bookingId));
  });

  function signedCompletedEvent() {
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_webhook_unit_test",
          object: "checkout.session",
          payment_intent: "pi_test_webhook",
          metadata: { bookingId: String(bookingId), reference: "LC-TEST01" },
        },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });
    return { payload, signature };
  }

  it("rejects a request with no signature", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }) as never
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid signature", async () => {
    const res = await POST(makeRequest("{}", "t=1,v1=invalid") as never);
    expect(res.status).toBe(400);
  });

  it("confirms the booking on checkout.session.completed", async () => {
    const { payload, signature } = signedCompletedEvent();
    const res = await POST(makeRequest(payload, signature) as never);
    expect(res.status).toBe(200);

    const updated = await db.query.bookings.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
    });
    expect(updated?.status).toBe("confirmed");
    expect(updated?.stripePaymentIntent).toBe("pi_test_webhook");
  });

  it("is idempotent on a replayed event", async () => {
    const { payload, signature } = signedCompletedEvent();
    const res = await POST(makeRequest(payload, signature) as never);
    expect(res.status).toBe(200);

    const updated = await db.query.bookings.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
    });
    expect(updated?.status).toBe("confirmed");
  });
});

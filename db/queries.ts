import { eq, isNull, or } from "drizzle-orm";
import { db } from "./index";
import { boats, boatImages, extras, blockedDates, bookings } from "./schema";

export async function getPublishedBoats() {
  return db.query.boats.findMany({
    where: eq(boats.isPublished, true),
    orderBy: (b, { asc }) => [asc(b.sortOrder)],
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
}

export async function getBoatBySlug(slug: string) {
  return db.query.boats.findFirst({
    where: eq(boats.slug, slug),
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
}

export async function getExtras() {
  return db.query.extras.findMany({
    orderBy: (e, { asc }) => [asc(e.sortOrder)],
  });
}

/** A null boatId blocks every boat (e.g. an island-wide closure), so it's included too. */
export async function getBlockedDatesForBoat(boatId: number) {
  return db.query.blockedDates.findMany({
    where: or(eq(blockedDates.boatId, boatId), isNull(blockedDates.boatId)),
  });
}

export async function getBookingBySessionId(sessionId: string) {
  return db.query.bookings.findFirst({
    where: eq(bookings.stripeSessionId, sessionId),
  });
}

/** Admin-only: includes unpublished boats, unlike getPublishedBoats(). */
export async function getAllBoats() {
  return db.query.boats.findMany({
    orderBy: (b, { asc }) => [asc(b.sortOrder)],
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
}

export async function getBoatById(id: number) {
  return db.query.boats.findFirst({
    where: eq(boats.id, id),
    with: {
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
}

export async function getAllBookings(status?: "pending" | "confirmed" | "cancelled") {
  return db.query.bookings.findMany({
    where: status ? eq(bookings.status, status) : undefined,
    orderBy: (b, { desc }) => [desc(b.createdAt)],
    with: { boat: true, extras: { with: { extra: true } } },
  });
}

export { boats, boatImages, extras, blockedDates, bookings };

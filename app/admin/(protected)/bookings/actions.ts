"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db/index";
import { bookings } from "@/db/schema";

export async function cancelBooking(bookingId: number) {
  await requireAdmin();
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, bookingId));
  revalidatePath("/admin/bookings");
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db/index";
import { blockedDates } from "@/db/schema";

// Every action re-checks the session even though the (protected) layout already gates the
// route — mutations must not depend on the UI layer alone (CLAUDE.md security checklist).

/** A YYYY-MM-DD string can match the shape yet not be a real date (e.g. 2099-13-45). */
function isRealDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Add a whole-day block for every boat. A null boatId + null slot blocks the entire day
 * across the fleet, which matches the current single-boat-type availability model. The
 * public booking calendar and the checkout route both already read blocked_dates.
 */
export async function addBlockedDate(formData: FormData) {
  await requireAdmin();

  const date = String(formData.get("date") ?? "").trim();
  if (!isRealDate(date)) throw new Error("invalid_date");

  // Ignore a duplicate whole-day block for the same date rather than erroring.
  const existing = await db.query.blockedDates.findMany({
    where: eq(blockedDates.date, date),
  });
  const alreadyBlocked = existing.some((b) => !b.slot && b.boatId === null);
  if (!alreadyBlocked) {
    await db.insert(blockedDates).values({ date, boatId: null, slot: null });
  }

  revalidatePath("/admin/blocked-dates");
  revalidatePath("/reserva");
}

export async function deleteBlockedDate(id: number) {
  await requireAdmin();
  await db.delete(blockedDates).where(eq(blockedDates.id, id));
  revalidatePath("/admin/blocked-dates");
  revalidatePath("/reserva");
}

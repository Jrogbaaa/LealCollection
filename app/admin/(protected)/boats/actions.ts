"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db/index";
import { boats, boatImages } from "@/db/schema";
import { isBlobUrl } from "@/lib/blob";

// Every action re-checks the session even though the (protected) layout already gates the
// route — mutations must not depend on the UI layer alone (CLAUDE.md security checklist).

function euroInputToCents(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export async function createBoat(formData: FormData) {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) throw new Error("slug_required");

  const [boat] = await db
    .insert(boats)
    .values({
      slug,
      nameEn: String(formData.get("nameEn") ?? ""),
      nameEs: String(formData.get("nameEs") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      descriptionEs: String(formData.get("descriptionEs") ?? ""),
      lengthFt: Number(formData.get("lengthFt") ?? 0),
      capacity: Number(formData.get("capacity") ?? 1),
      cabins: Number(formData.get("cabins") ?? 0),
      homeMarina: String(formData.get("homeMarina") ?? ""),
      priceFullDay: euroInputToCents(formData.get("priceFullDay")),
      priceMorning: euroInputToCents(formData.get("priceMorning")),
      priceAfternoon: euroInputToCents(formData.get("priceAfternoon")),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isPublished: formData.get("isPublished") === "on",
    })
    .returning({ id: boats.id });

  revalidatePath("/admin/boats");
  redirect(`/admin/boats/${boat.id}/edit`);
}

export async function updateBoat(boatId: number, formData: FormData) {
  await requireAdmin();

  await db
    .update(boats)
    .set({
      nameEn: String(formData.get("nameEn") ?? ""),
      nameEs: String(formData.get("nameEs") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      descriptionEs: String(formData.get("descriptionEs") ?? ""),
      lengthFt: Number(formData.get("lengthFt") ?? 0),
      capacity: Number(formData.get("capacity") ?? 1),
      cabins: Number(formData.get("cabins") ?? 0),
      homeMarina: String(formData.get("homeMarina") ?? ""),
      priceFullDay: euroInputToCents(formData.get("priceFullDay")),
      priceMorning: euroInputToCents(formData.get("priceMorning")),
      priceAfternoon: euroInputToCents(formData.get("priceAfternoon")),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isPublished: formData.get("isPublished") === "on",
    })
    .where(eq(boats.id, boatId));

  revalidatePath("/admin/boats");
  revalidatePath(`/admin/boats/${boatId}/edit`);
  revalidatePath("/fleet");
}

export async function deleteBoat(boatId: number) {
  await requireAdmin();
  // No onDelete cascade from bookings -> boats: the DB rejects this if bookings reference
  // the boat, which is the correct behavior (never silently orphan a customer's booking).
  await db.delete(boats).where(eq(boats.id, boatId));
  revalidatePath("/admin/boats");
  redirect("/admin/boats");
}

export async function addImage(boatId: number, formData: FormData) {
  await requireAdmin();

  const blobUrl = String(formData.get("blobUrl") ?? "").trim();
  if (!blobUrl) throw new Error("url_required");

  await db.insert(boatImages).values({
    boatId,
    blobUrl,
    altEn: String(formData.get("altEn") ?? "") || "Boat photo",
    altEs: String(formData.get("altEs") ?? "") || "Foto del barco",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  revalidatePath(`/admin/boats/${boatId}/edit`);
  revalidatePath("/fleet");
}

export async function deleteImage(imageId: number, boatId: number) {
  await requireAdmin();

  const [image] = await db
    .select({ blobUrl: boatImages.blobUrl })
    .from(boatImages)
    .where(and(eq(boatImages.id, imageId), eq(boatImages.boatId, boatId)));

  await db
    .delete(boatImages)
    .where(and(eq(boatImages.id, imageId), eq(boatImages.boatId, boatId)));

  if (image && isBlobUrl(image.blobUrl)) {
    // A stray remote file that fails to delete shouldn't block the admin from removing the
    // DB row — log and move on rather than throwing. Seeded local paths are skipped.
    await del(image.blobUrl).catch(() => {
      console.error("blob_delete_failed", { imageId });
    });
  }

  revalidatePath(`/admin/boats/${boatId}/edit`);
  revalidatePath("/fleet");
}

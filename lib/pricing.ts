export type Slot = "full_day" | "morning" | "afternoon";

export type BoatPricing = {
  priceFullDay: number;
  priceMorning: number;
  priceAfternoon: number;
};

export type ExtraLine = {
  extraId: number;
  unitPrice: number;
  qty: number;
};

export const DEPOSIT_RATE = 0.4;

export function slotPrice(boat: BoatPricing, slot: Slot): number {
  switch (slot) {
    case "full_day":
      return boat.priceFullDay;
    case "morning":
      return boat.priceMorning;
    case "afternoon":
      return boat.priceAfternoon;
  }
}

export function extrasTotal(extras: ExtraLine[]): number {
  return extras.reduce((sum, e) => sum + e.unitPrice * e.qty, 0);
}

export function bookingSubtotal(
  boat: BoatPricing,
  slot: Slot,
  extras: ExtraLine[]
): number {
  return slotPrice(boat, slot) + extrasTotal(extras);
}

export function depositAmount(subtotal: number): number {
  return Math.round(subtotal * DEPOSIT_RATE);
}

/** cents -> "€1,234" (no decimals; charter prices are always whole euros) */
export function formatEuros(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

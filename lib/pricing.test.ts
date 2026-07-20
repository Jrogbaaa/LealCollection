import { describe, it, expect } from "vitest";
import {
  slotPrice,
  extrasTotal,
  bookingSubtotal,
  depositAmount,
  formatEuros,
  type BoatPricing,
} from "./pricing";

const boat: BoatPricing = {
  priceFullDay: 190000,
  priceMorning: 110000,
  priceAfternoon: 120000,
};

describe("slotPrice", () => {
  it("returns the correct price per slot", () => {
    expect(slotPrice(boat, "full_day")).toBe(190000);
    expect(slotPrice(boat, "morning")).toBe(110000);
    expect(slotPrice(boat, "afternoon")).toBe(120000);
  });
});

describe("extrasTotal", () => {
  it("sums qty * unitPrice across lines", () => {
    expect(
      extrasTotal([
        { extraId: 1, unitPrice: 9000, qty: 1 },
        { extraId: 4, unitPrice: 25000, qty: 1 },
      ])
    ).toBe(34000);
  });

  it("returns 0 for no extras", () => {
    expect(extrasTotal([])).toBe(0);
  });

  it("respects qty > 1", () => {
    expect(extrasTotal([{ extraId: 1, unitPrice: 9000, qty: 3 }])).toBe(27000);
  });
});

describe("bookingSubtotal", () => {
  it("combines slot price and extras for every slot", () => {
    const extras = [{ extraId: 4, unitPrice: 25000, qty: 1 }];
    expect(bookingSubtotal(boat, "full_day", extras)).toBe(215000);
    expect(bookingSubtotal(boat, "morning", extras)).toBe(135000);
    expect(bookingSubtotal(boat, "afternoon", extras)).toBe(145000);
  });

  it("equals the bare slot price when there are no extras", () => {
    expect(bookingSubtotal(boat, "full_day", [])).toBe(190000);
  });
});

describe("depositAmount", () => {
  it("is 50% of the subtotal", () => {
    expect(depositAmount(190000)).toBe(95000);
  });

  it("rounds to the nearest cent on odd subtotals", () => {
    expect(depositAmount(100001)).toBe(50001); // .5 rounds up
    expect(depositAmount(100003)).toBe(50002); // 50001.5 rounds up (banker's-neutral)
  });

  it("is 0 for a 0 subtotal", () => {
    expect(depositAmount(0)).toBe(0);
  });
});

describe("formatEuros", () => {
  it("formats whole euros with no decimals, en locale", () => {
    expect(formatEuros(190000, "en")).toBe("€1,900");
  });

  it("formats with es-ES grouping", () => {
    expect(formatEuros(190000, "es")).toBe("1900 €");
  });
});

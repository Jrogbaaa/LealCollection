import { describe, it, expect } from "vitest";
import { generateBookingReference } from "./booking-reference";

describe("generateBookingReference", () => {
  it("has the LC- prefix followed by 6 characters", () => {
    expect(generateBookingReference()).toMatch(/^LC-[A-Z0-9]{6}$/);
  });

  it("never includes visually ambiguous characters in the suffix", () => {
    for (let i = 0; i < 200; i++) {
      const suffix = generateBookingReference().slice(3);
      expect(suffix).not.toMatch(/[01OIL]/);
    }
  });

  it("is not obviously deterministic across calls", () => {
    const refs = new Set(Array.from({ length: 20 }, () => generateBookingReference()));
    expect(refs.size).toBeGreaterThan(1);
  });
});

import { randomBytes } from "crypto";

// Excludes visually ambiguous characters (0/O, 1/I/L) since this is read aloud and typed by customers.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateBookingReference(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `LC-${suffix}`;
}

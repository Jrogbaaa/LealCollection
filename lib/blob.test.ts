import { describe, it, expect } from "vitest";
import { isBlobUrl } from "./blob";

describe("isBlobUrl", () => {
  it("returns true for a Vercel Blob public URL", () => {
    expect(isBlobUrl("https://abc123.public.blob.vercel-storage.com/boat.jpg")).toBe(true);
  });

  it("returns false for seeded local image paths", () => {
    expect(isBlobUrl("/images/boats/cranchi-32.jpg")).toBe(false);
  });

  it("returns false for an unrelated external URL", () => {
    expect(isBlobUrl("https://example.com/boat.jpg")).toBe(false);
  });
});

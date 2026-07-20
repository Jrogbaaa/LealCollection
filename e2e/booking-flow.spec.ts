import { test, expect } from "@playwright/test";
import { like } from "drizzle-orm";
import { db } from "../db/index";
import { bookings } from "../db/schema";

const TEST_EMAIL = "playwright-test@example.com";

// This suite drives the booking form up to the point of creating a Stripe Checkout
// session and stops there — Stripe's own hosted checkout page is third-party and out of
// scope to automate here (see stripe:test-cards skill for manual verification instead).
test.describe("booking flow", () => {
  test.afterAll(async () => {
    await db.delete(bookings).where(like(bookings.email, TEST_EMAIL));
  });

  test("fills through to a Stripe Checkout redirect with the right amount", async ({ page }) => {
    await page.goto("/en/reserva?boat=cranchi-32");

    // Pick the first selectable (non-disabled) date in the calendar.
    const firstAvailable = page.locator("button.rdp-day_button:not([disabled])").first();
    await firstAvailable.click();

    await expect(page.getByText(/€\d/).first()).toBeVisible();

    await page.getByPlaceholder("Full name").fill("Playwright Test");
    await page.getByPlaceholder("Email").fill(TEST_EMAIL);
    await page.getByPlaceholder("Phone").fill("+34600000099");

    const payButton = page.getByRole("button", { name: /Pay deposit/ });
    await expect(payButton).toBeEnabled();

    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
      payButton.click(),
    ]);

    expect(page.url()).toContain("checkout.stripe.com");
  });

  test("date/slot/extras selections are reflected in the URL for sharing", async ({ page }) => {
    await page.goto("/en/reserva?boat=cranchi-32");
    await page.getByRole("button", { name: "Morning" }).click();
    await expect(page).toHaveURL(/slot=morning/);
  });
});

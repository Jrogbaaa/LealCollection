import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// These exercise the real Vercel Blob token and the blocked_dates path, so they need the
// plaintext admin password. Skipped (not failed) when it's absent, like the CRUD suite.
test.describe("admin image upload + blocked dates", () => {
  test.skip(!ADMIN_PASSWORD, "Set E2E_ADMIN_PASSWORD to run authenticated admin tests");

  async function login(page: Page) {
    await page.goto("/admin/login");
    await page.getByPlaceholder("Email").fill(ADMIN_EMAIL);
    await page.getByPlaceholder("Password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/boats/);
  }

  test("uploads a real image to Vercel Blob and can delete it", async ({ page }) => {
    test.skip(
      !process.env.BLOB_READ_WRITE_TOKEN,
      "Set a real BLOB_READ_WRITE_TOKEN (vercel_blob_rw_…) to exercise the live upload"
    );
    await login(page);
    await page.goto("/admin/boats");
    await page.getByRole("link", { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/boats\/\d+\/edit/);

    // The dropzone hides a file input; setInputFiles drives the same path a click-pick does.
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, "fixtures", "test-image.png")
    );
    await page.getByPlaceholder("Alt text (EN)").fill("E2E upload probe");

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/boats/") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Add image" }).click(),
    ]);

    // A real Blob upload lands on *.public.blob.vercel-storage.com — this is what proves the
    // configured BLOB_READ_WRITE_TOKEN is valid, not just that the UI submitted.
    const uploaded = page.locator('img[src*=".public.blob.vercel-storage.com"]').first();
    await expect(uploaded).toBeVisible({ timeout: 15_000 });
    const blobUrl = await uploaded.getAttribute("src");
    expect(blobUrl).toContain(".public.blob.vercel-storage.com");

    // Clean up: remove the row we just added (also deletes the Blob file via del()).
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/boats/") && r.request().method() === "POST"),
      page.locator("li", { hasText: blobUrl! }).getByRole("button", { name: "Delete" }).click(),
    ]);
    await expect(page.locator(`img[src="${blobUrl}"]`)).toHaveCount(0);
  });

  test("a blocked whole-day date is rejected at checkout", async ({ page, request }) => {
    await login(page);
    const blockedDate = "2090-09-09";

    await page.goto("/admin/blocked-dates");
    await page.locator('input[type="date"]').fill(blockedDate);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/blocked-dates") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Block day" }).click(),
    ]);
    await expect(page.getByText(blockedDate)).toBeVisible();

    // The booking calendar and the checkout route both read blocked_dates; a 409
    // date_unavailable proves the block reaches the booking path end-to-end.
    const res = await request.post("/api/checkout", {
      data: {
        boatSlug: "cranchi-32",
        date: blockedDate,
        slot: "full_day",
        extraKeys: [],
        guests: 2,
        name: "Blocked Probe",
        email: "blocked-probe@example.com",
        phone: "+34600000000",
        locale: "en",
      },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toBe("date_unavailable");

    // Clean up the block.
    await page.reload();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/admin/blocked-dates") && r.request().method() === "POST"),
      page.locator("li", { hasText: blockedDate }).getByRole("button", { name: "Remove" }).click(),
    ]);
    await expect(page.getByText(blockedDate)).toHaveCount(0);
  });
});

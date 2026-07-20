import { test, expect, type Page } from "@playwright/test";

// Next.js server actions submitted via <form action={fn}> go out as a POST to the current
// URL but don't trigger a classic full-page navigation, so Playwright's click() can resolve
// before the round trip finishes. Waiting for that specific response is what makes the
// following reload see the new value reliably.
async function saveAndWait(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/admin/boats/") && res.request().method() === "POST"),
    page.getByRole("button", { name: "Save changes" }).click(),
  ]);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// Hardcoded rather than captured at runtime — capturing "whatever is on the page right now"
// as the value to restore to is not safe: if a previous run of this test failed midway, the
// live value is already the leftover test marker, and "restoring" to it would make the
// corruption permanent instead of fixing it. This must match db/seed.ts's descriptionEn.
const KNOWN_GOOD_DESCRIPTION_EN =
  "A sleek 32ft Cranchi built for the Ibiza coastline — spacious sundeck, a shaded lounge, and a private cabin below. Skippered charters to the island's best anchorages, Formentera included.";

test.describe("admin auth gate", () => {
  test("unauthenticated visits to /admin redirect to login", async ({ page }) => {
    await page.goto("/admin/boats");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("unauthenticated visits to /admin/bookings redirect to login", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("Email").fill(ADMIN_EMAIL);
    await page.getByPlaceholder("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/error=1/);
  });
});

// Requires E2E_ADMIN_PASSWORD in the environment (the plaintext admin password) — skipped
// otherwise rather than failing, since the password hash alone can't be reversed to log in.
test.describe("admin CRUD", () => {
  test.skip(!ADMIN_PASSWORD, "Set E2E_ADMIN_PASSWORD to run authenticated admin tests");

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("Email").fill(ADMIN_EMAIL);
    await page.getByPlaceholder("Password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/boats/);
  });

  test("editing a boat's description shows up on the public fleet page", async ({ page }) => {
    const marker = `E2E marker ${Date.now()}`;
    await page.getByRole("link", { name: "Edit" }).first().click();
    await expect(page.getByRole("heading", { name: /Edit/ })).toBeVisible();

    const descriptionEn = page.locator('textarea[name="descriptionEn"]');

    // The save is a server action with no client-visible confirmation, so each save is
    // confirmed by reloading and reading the field back before moving on — otherwise the
    // next navigation can race the in-flight request and this test becomes flaky.
    await descriptionEn.fill(marker);
    await saveAndWait(page);
    await page.reload();
    await expect(descriptionEn).toHaveValue(marker);

    await page.goto("/en/fleet/cranchi-32");
    await expect(page.getByText(marker)).toBeVisible();

    // Restore the known-good description so this test doesn't leave the public site
    // permanently altered.
    await page.goto("/admin/boats");
    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.locator('textarea[name="descriptionEn"]').fill(KNOWN_GOOD_DESCRIPTION_EN);
    await saveAndWait(page);
    await page.reload();
    await expect(page.locator('textarea[name="descriptionEn"]')).toHaveValue(
      KNOWN_GOOD_DESCRIPTION_EN
    );
  });

  test("bookings list is reachable and filterable", async ({ page }) => {
    await page.getByRole("link", { name: "Bookings" }).click();
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await page.getByRole("link", { name: "Confirmed" }).click();
    await expect(page).toHaveURL(/status=confirmed/);
  });

  test("admin routes stay readable without page overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    await page.goto("/admin/boats");
    await expect(page.getByTestId("mobile-boat-list")).toBeVisible();
    await expect(page.getByTestId("desktop-boat-table")).toBeHidden();

    const headerLayout = await page.locator("header").evaluate((header) => {
      const brand = header.querySelector("a");
      const nav = header.querySelector("nav");
      if (!brand || !nav) return null;
      const brandRect = brand.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      return { brandBottom: brandRect.bottom, navTop: navRect.top };
    });
    expect(headerLayout).not.toBeNull();
    expect(headerLayout!.navTop).toBeGreaterThanOrEqual(headerLayout!.brandBottom);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(360);

    await page.goto("/admin/bookings");
    await expect(page.getByTestId("mobile-booking-list")).toBeVisible();
    await expect(page.getByTestId("desktop-booking-table")).toBeHidden();
    await expect(page.getByText("Customer", { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(360);

    await page.goto("/admin/boats/new");
    await expect(page.getByRole("heading", { name: "New boat" })).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(360);

    await page.goto("/admin/boats");
    await page.getByRole("link", { name: "Edit" }).first().click();
    await expect(page.getByRole("heading", { name: /Edit/ })).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

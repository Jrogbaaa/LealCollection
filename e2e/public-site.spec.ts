import { test, expect } from "@playwright/test";

test.describe("public site", () => {
  test("homepage renders in English", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Private yacht charters, done properly" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toBeVisible();
  });

  test("homepage renders in Spanish", async ({ page }) => {
    await page.goto("/es");
    await expect(
      page.getByRole("heading", { name: "Chárteres privados de yates, hechos como es debido" })
    ).toBeVisible();
  });

  test("root redirects to the default locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("fleet listing shows the boat with real pricing", async ({ page }) => {
    await page.goto("/en/fleet");
    await expect(page.getByRole("heading", { name: "Cranchi 32" })).toBeVisible();
    await expect(page.getByText(/From €\d/)).toBeVisible();
  });

  test("boat detail page shows specs and a reserve CTA", async ({ page }) => {
    await page.goto("/en/fleet/cranchi-32");
    await expect(page.getByRole("heading", { name: "Cranchi 32" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reserve this boat" })).toHaveAttribute(
      "href",
      "/en/reserva?boat=cranchi-32"
    );
  });

  test("unknown boat slug 404s", async ({ page }) => {
    const res = await page.goto("/en/fleet/not-a-real-boat");
    expect(res?.status()).toBe(404);
  });

  test("WhatsApp bubble is present on every public route", async ({ page }) => {
    for (const path of ["/en", "/en/fleet", "/en/reserva"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toBeVisible();
    }
  });
});

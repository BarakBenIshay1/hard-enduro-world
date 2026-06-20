import { expect, test } from "@playwright/test";

test("loads the real-data homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /hard enduro data/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "View events" })).toBeVisible();
  await expect(page.getByText("Stage timing rows")).toBeVisible();
});

test("loads the seeded event detail with stage timing", async ({ page }) => {
  await page.goto("/events/sample-hard-enduro-gp-2026");

  await expect(
    page.getByRole("heading", { name: "Sample Hard Enduro GP" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prologue" })).toBeVisible();
  await expect(page.getByText("Manuel Lettenbichler")).toBeVisible();
  await expect(page.getByText("05:12.000")).toBeVisible();
});

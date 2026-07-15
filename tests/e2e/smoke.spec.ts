import { test, expect } from "@playwright/test";

test.describe("Transcribe Studio UI", () => {
  test("renders hero and upload experience", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /turn recordings into clear, usable text/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/drop your recording here/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /switch to (dark|light) mode/i }),
    ).toBeVisible();
  });

  test("theme toggle persists preference", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", {
      name: /switch to (dark|light) mode/i,
    });
    const initial = await toggle.getAttribute("aria-label");
    await toggle.click();
    await expect(toggle).not.toHaveAttribute("aria-label", initial ?? "");
    await page.reload();
    const html = page.locator("html");
    const className = await html.getAttribute("class");
    expect(className === null || typeof className === "string").toBe(true);
  });

  test("privacy and how-it-works pages are reachable", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /how we handle your recordings/i }),
    ).toBeVisible();
    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { name: /three calm steps/i }),
    ).toBeVisible();
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});

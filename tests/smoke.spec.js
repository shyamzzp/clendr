import { test, expect } from "@playwright/test";

test("creates an event and persists it in localStorage", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page.getByRole("heading", { name: "Clendr" })).toBeVisible();

  await page.getByRole("button", { name: /New Event/i }).click();
  await page.getByLabel("Title").fill("Smoke Test Event");
  await page.getByRole("button", { name: "Save Event" }).click();

  await expect(page.getByText("Smoke Test Event").first()).toBeVisible();
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("clendr.snapshot.v1")));
  expect(snapshot.events.some((event) => event.title === "Smoke Test Event")).toBe(true);
});

test("settings dialog updates calendar preferences", async ({ page }) => {
  await page.goto("http://localhost:3001");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Time format").selectOption("24h");
  await page.getByLabel("Density").selectOption("compact");
  await page.getByLabel("Theme").selectOption("light");
  await page.getByLabel("Interface scale").selectOption("80");
  await page.getByRole("button", { name: "×" }).click();

  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("clendr.snapshot.v1")));
  expect(snapshot.settings.timeFormat).toBe("24h");
  expect(snapshot.settings.density).toBe("compact");
  expect(snapshot.settings.theme).toBe("light");
  expect(snapshot.settings.uiScale).toBe("80");
  await expect(page.locator(".calendar-app")).toHaveClass(/theme-light/);
  await expect(page.locator(".calendar-app")).toHaveClass(/scale-80/);
});

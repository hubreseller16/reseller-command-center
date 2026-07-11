/**
 * Top Bar regression suite — verifies every clickable element in the Shell
 * routes correctly and every dropdown/menu opens & closes. Run against the
 * running dev server:
 *
 *   bunx playwright test tests/topbar.spec.ts
 *
 * These are the invariants that must hold for the Reseller Manager shell.
 * A break here means navigation has been silently rewired.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE ?? "http://localhost:8080";

const DIRECT_LINKS = [
  { label: "Dashboard", url: "/" },
  { label: "Support", url: "/support" },
  { label: "Settings", url: "/settings" },
];

const GROUPS: { group: string; items: { label: string; url: string }[] }[] = [
  { group: "Catalog", items: [
    { label: "Products", url: "/products" },
    { label: "Licenses", url: "/licenses" },
    { label: "Subscriptions", url: "/subscriptions" },
  ] },
  { group: "People", items: [
    { label: "Resellers", url: "/resellers" },
    { label: "Customers", url: "/customers" },
    { label: "KYC", url: "/kyc" },
    { label: "Approvals", url: "/approvals" },
  ] },
  { group: "Commerce", items: [
    { label: "Orders", url: "/orders" },
    { label: "Wallet", url: "/wallet" },
    { label: "Commission", url: "/commission" },
  ] },
  { group: "Insights", items: [
    { label: "Analytics", url: "/analytics" },
    { label: "Reports", url: "/reports" },
    { label: "Audit", url: "/audit" },
    { label: "Notifications", url: "/notifications" },
  ] },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
});

test("direct top-bar links navigate", async ({ page }) => {
  for (const link of DIRECT_LINKS) {
    await page.getByRole("link", { name: link.label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(link.url.replace("/", "\\/") + "$"));
  }
});

test("dropdown groups open and route to each child", async ({ page }) => {
  for (const g of GROUPS) {
    for (const item of g.items) {
      await page.goto(BASE);
      await page.getByRole("button", { name: g.group }).first().click();
      const menuItem = page.getByRole("link", { name: item.label, exact: true }).first();
      await expect(menuItem).toBeVisible();
      await menuItem.click();
      await expect(page).toHaveURL(new RegExp(item.url.replace("/", "\\/") + "$"));
    }
  }
});

test("global search opens with ⌘K and navigates", async ({ page }) => {
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByPlaceholder(/Search Walls/);
  await expect(input).toBeVisible();
  await input.fill("orders");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/orders$/);
});

test("notifications menu opens & links to Notifications Wall", async ({ page }) => {
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("You're all caught up")).toBeVisible();
  await page.getByRole("button", { name: /Open Notifications Wall/ }).click();
  await expect(page).toHaveURL(/\/notifications$/);
});

test("avatar menu opens with every item", async ({ page }) => {
  await page.locator('button:has-text("SV")').first().click();
  for (const label of ["Profile", "Preferences", "Help & Support", "Sign out"]) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }
});

test("avatar → Preferences routes to Settings", async ({ page }) => {
  await page.locator('button:has-text("SV")').first().click();
  await page.getByRole("button", { name: "Preferences" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});

test("mobile hamburger opens drawer with all nav items", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE);
  await page.getByRole("button", { name: "Open menu" }).click();
  // Every group + direct link label must appear in the drawer.
  for (const g of GROUPS) {
    await expect(page.locator("aside").getByText(g.group, { exact: true })).toBeVisible();
    for (const item of g.items) {
      await expect(page.locator("aside").getByRole("link", { name: item.label, exact: true })).toBeVisible();
    }
  }
  // Tap Products to navigate & auto-close.
  await page.locator("aside").getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.locator("aside")).toHaveCount(0);
});

test("SubBar Back button returns to previous wall", async ({ page }) => {
  await page.getByRole("link", { name: "Support", exact: true }).click();
  await expect(page).toHaveURL(/\/support$/);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/support$/);
});

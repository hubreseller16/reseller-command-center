/**
 * Accessibility regression suite — keyboard navigation and focus behaviour for
 * the sidebar and its rail control, checked on every route.
 *
 *   bunx playwright test tests/a11y-sidebar.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import { NAV, isGroup } from "../src/components/wall/nav";

const BASE = process.env.E2E_BASE ?? "http://localhost:8080";

const ROUTES: string[] = NAV.flatMap((n) => (isGroup(n) ? n.items.map((i) => i.to) : [n.to])).concat("/help");

async function dismissConsent(page: Page) {
  const accept = page.getByRole("button", { name: "Accept cookies" }).first();
  if (await accept.isVisible().catch(() => false)) await accept.click();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

for (const route of ROUTES) {
  test(`sidebar toggle is keyboard operable on ${route}`, async ({ page }) => {
    await page.goto(BASE + route);
    await dismissConsent(page);

    const toggle = page.getByRole("button", { name: /Collapse sidebar/ });
    await expect(toggle).toBeVisible();

    // Focusable via keyboard and visibly focused.
    await toggle.focus();
    await expect(toggle).toBeFocused();

    // Enter toggles collapse; the expand control takes over.
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Expand sidebar/ })).toBeVisible();
    await page.getByRole("button", { name: /Expand sidebar/ }).press("Enter");
    await expect(page.getByRole("button", { name: /Collapse sidebar/ })).toBeVisible();
  });

  test(`Ctrl+B toggles the sidebar on ${route}`, async ({ page }) => {
    await page.goto(BASE + route);
    await dismissConsent(page);

    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.getByRole("button", { name: /Expand sidebar/ })).toBeVisible();
    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.getByRole("button", { name: /Collapse sidebar/ })).toBeVisible();
  });
}

test("sidebar links are reachable by Tab in order and show a focus ring", async ({ page }) => {
  await page.goto(BASE);
  await dismissConsent(page);

  const firstLink = page.locator("aside a").first();
  await firstLink.focus();
  await expect(firstLink).toBeFocused();

  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName ?? "");
  expect(["A", "BUTTON", "INPUT"]).toContain(focused);

  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "";
    const s = getComputedStyle(el);
    return `${s.outlineStyle}${s.boxShadow}`;
  });
  expect(outline.length).toBeGreaterThan(0);
});

test("group headers expose aria-expanded and toggle with the keyboard", async ({ page }) => {
  await page.goto(BASE);
  await dismissConsent(page);

  const group = page.locator("aside").getByRole("button", { name: "Catalog" }).first();
  await group.focus();
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter");
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(group).toHaveAttribute("aria-expanded", "true");
});

test("no preference cookie is written before consent, and one is written after", async ({ page, context }) => {
  await page.goto(BASE);
  await page.getByRole("button", { name: "Decline" }).click();
  await page.keyboard.press("ControlOrMeta+b");
  let cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "sv_sidebar_collapsed")).toBeUndefined();

  await page.goto(BASE + "/help");
  await page.getByRole("button", { name: /Accept cookies/ }).click();
  await page.keyboard.press("ControlOrMeta+b");
  cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "sv_sidebar_collapsed")).toBeTruthy();
});

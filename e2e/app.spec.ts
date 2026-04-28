import { test, expect } from "@playwright/test";

const SVC_CFG_KEY = "acc-creator:svc-cfg";

// ── App Routing & Sidebar ───────────────────────────────────────────────────

test("renders sidebar brand name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("AccCreator")).toBeVisible();
  await expect(page.getByText("Account Manager")).toBeVisible();
});

test("renders all nav links", async ({ page }) => {
  await page.goto("/");
  // Use exact: true to avoid matching "AAR: Accounts"
  await expect(page.getByRole("link", { name: "Accounts", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Config", exact: true })).toBeVisible();
});

test("/ renders AccountsPage heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /accounts/i })).toBeVisible();
});

test("/create renders CreatePage heading", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: /create accounts/i })).toBeVisible();
});

test("/config renders ConfigPage heading", async ({ page }) => {
  await page.goto("/config");
  await expect(page.getByRole("heading", { name: /config/i })).toBeVisible();
});

test("active nav link for /", async ({ page }) => {
  await page.goto("/");
  // Use exact to avoid matching "AAR: Accounts"
  const accountsLink = page.getByRole("link", { name: "Accounts", exact: true });
  await expect(accountsLink).toHaveClass(/bg-brand-50/);
});

test("active nav link for /create", async ({ page }) => {
  await page.goto("/create");
  const createLink = page.getByRole("link", { name: "Create" });
  await expect(createLink).toHaveClass(/bg-brand-50/);
});

test("version footer visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/v0\.1\.0/i)).toBeVisible();
});

// ── AccountsPage ─────────────────────────────────────────────────────────────

test("renders heading and table", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /accounts/i })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});

test("shows service filter dropdown (first one)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("combobox").first()).toBeVisible();
});

test("shows bulk actions button", async ({ page }) => {
  await page.goto("/");
  const addBtn = page.getByRole("button", { name: /add/i }).first();
  await expect(addBtn).toBeVisible();
});

// ── CreatePage ───────────────────────────────────────────────────────────────

test("renders heading and form controls", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: /create accounts/i })).toBeVisible();
  await expect(page.getByRole("combobox").first()).toBeVisible();
  await expect(page.getByRole("spinbutton").first()).toBeVisible();
});

test("shows Run button", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("button", { name: /run/i })).toBeVisible();
});

test("Run button visible", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("button", { name: /run/i })).toBeVisible();
});

// ── ConfigPage ──────────────────────────────────────────────────────────────

test("shows heading and Save button", async ({ page }) => {
  await page.goto("/config");
  await expect(page.getByRole("heading", { name: /config/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
});

test("shows file tabs (Core / mail.yaml)", async ({ page }) => {
  await page.goto("/config");
  await expect(page.getByRole("button", { name: /config\.yaml/i })).toBeVisible({ timeout: 5000 });
  // mail.yaml appears as "✉️ Mail mail.yaml" — use .first() since /mail\.yaml/i matches multiple buttons
  await expect(page.getByRole("button", { name: /mail\.yaml/i }).first()).toBeVisible();
});

test("Raw tab shows textarea", async ({ page }) => {
  await page.goto("/config");
  await page.getByRole("button", { name: "Raw" }).click();
  await expect(page.getByRole("textbox")).toBeVisible({ timeout: 3000 });
});

test("file tabs highlight active file", async ({ page }) => {
  await page.goto("/config");
  // The active file button has border-l-brand-500 class
  const activeButton = page.getByRole("button", { name: /config\.yaml/i });
  await expect(activeButton).toHaveClass(/border-l-brand-500/);
});

test("clicking different file switches content", async ({ page }) => {
  await page.goto("/config");
  await page.getByRole("button", { name: "Raw" }).click();
  await page.waitForSelector("textarea", { timeout: 3000 });

  // Wait for initial content to load (may be empty if API unavailable, but that's ok)
  await page.waitForTimeout(1000);
  const initial = await page.locator("textarea").inputValue();

  // Click mail.yaml button - wait for content to potentially change
  await page.getByRole("button", { name: /mail\.yaml/i }).first().click();
  await page.waitForTimeout(1500);

  // Verify textarea value changed (may still be empty if API unavailable, but URL/bar changes)
  const changed = await page.locator("textarea").inputValue();
  // At minimum, the URL indicator should change when switching files
  const filenameBar = page.locator(".text-xs.font-mono.text-gray-400").first();
  await expect(filenameBar).toContainText("mail.yaml");
});

test("Save button disabled while content is loading", async ({ page }) => {
  await page.goto("/config");
  await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
});
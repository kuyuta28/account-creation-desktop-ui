import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

const renderApp = (initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );

describe("App routing & sidebar", () => {
  it("renders sidebar brand name", () => {
    renderApp();
    expect(screen.getByText("AccCreator")).toBeInTheDocument();
    expect(screen.getByText("Account Manager")).toBeInTheDocument();
  });

  it("renders all nav links", () => {
    renderApp();
    // Use getAllByRole for multiple links; each NavLink renders as <a>
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(13);
    // Check key labels are present (not using /accounts/i which matches AAR: Accounts too)
    expect(screen.getByRole("link", { name: /^accounts$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^create$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^config$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mail providers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gmail mailboxes/i })).toBeInTheDocument();
  });

  it("/ renders AccountsPage", () => {
    renderApp("/");
    expect(screen.getByRole("heading", { name: /accounts/i })).toBeInTheDocument();
  });

  it("/create renders CreatePage", () => {
    renderApp("/create");
    expect(screen.getByRole("heading", { name: /create accounts/i })).toBeInTheDocument();
  });

  it("/config renders ConfigPage", () => {
    renderApp("/config");
    expect(screen.getByRole("heading", { name: /config/i })).toBeInTheDocument();
  });

  it("shows version footer", () => {
    renderApp();
    expect(screen.getByText(/v0\.1\.0/i)).toBeInTheDocument();
  });

  it("active nav link has active class for /", () => {
    renderApp("/");
    // "Accounts" (exact, not "AAR: Accounts")
    const accountsLink = screen.getByRole("link", { name: /^accounts$/i });
    expect(accountsLink.className).toContain("text-brand-700");
  });

  it("active nav link for /create", () => {
    renderApp("/create");
    const link = screen.getByRole("link", { name: /^create$/i });
    expect(link.className).toContain("text-brand-700");
  });
});

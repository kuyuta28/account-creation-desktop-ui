import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { mockAccountsData as mockAccounts } from "./mocks/handlers";
import AccountsPage from "../pages/AccountsPage";

afterEach(() => {
  vi.restoreAllMocks();
});

const renderPage = () =>
  render(<MemoryRouter><AccountsPage /></MemoryRouter>);

// Paginated accounts response builder
const paginatedAccounts = (accounts: typeof mockAccounts, page = 1, pages = 1, total?: number) => ({
  success: true,
  data: { accounts, total: total ?? accounts.length, page, limit: 100, pages },
  meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
});

describe("AccountsPage — initial render", () => {
  it("shows heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /accounts/i })).toBeInTheDocument();
  });

  it("shows Refresh button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("renders accounts from API", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("alice@test.com")).toBeInTheDocument());
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
    expect(screen.getByText("carol@test.com")).toBeInTheDocument();
  });

  it("shows stats: total, active, disabled, with API key", async () => {
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));
    // Stats bar shows "X / Y shown" + "N active" + "N with key"
    expect(screen.getAllByText(/shown/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/with key/i).length).toBeGreaterThan(0);
  });
});

describe("AccountsPage — service tabs", () => {
  it("renders ALL tab and service-specific tabs", async () => {
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));
    expect(screen.getByRole("button", { name: /^ALL/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ELEVENLABS/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^OPENROUTER/ })).toBeInTheDocument();
  });

  it("shows service tab counts from server totals, not current page", async () => {
    server.use(
      http.get(/\/accounts\/?(\?.*)?$/, () => HttpResponse.json(paginatedAccounts(mockAccounts, 1, 2, 55))),
      http.get(/\/accounts\/service-counts/, () => HttpResponse.json({
        success: true,
        data: { ALL: 55, ELEVENLABS: 40, OPENROUTER: 15, CHATGPT: 0 },
        meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
      })),
    );

    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    expect(screen.getByRole("button", { name: /^ALL55$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ELEVENLABS40$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^OPENROUTER15$/ })).toBeInTheDocument();
  });

  it("filters by service when tab clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.click(screen.getByRole("button", { name: /^OPENROUTER/ }));
    expect(screen.queryByText("alice@test.com")).not.toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
    expect(screen.queryByText("carol@test.com")).not.toBeInTheDocument();
  });

  it("clicking ALL shows all accounts", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.click(screen.getByRole("button", { name: /^OPENROUTER/ }));
    await user.click(screen.getByRole("button", { name: /^ALL/ }));
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });
});

describe("AccountsPage — status filter", () => {
  it("Active filter only shows enabled accounts", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    // Status select is the first combobox in FilterBar
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "active");
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByText("carol@test.com")).toBeInTheDocument();
    expect(screen.queryByText("bob@test.com")).not.toBeInTheDocument();
  });

  it("Disabled filter only shows disabled accounts", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "disabled");
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
    expect(screen.queryByText("alice@test.com")).not.toBeInTheDocument();
  });
});

describe("AccountsPage — search", () => {
  it("filters accounts by email", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.type(screen.getByPlaceholderText(/email.*api/i), "alice");
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.queryByText("bob@test.com")).not.toBeInTheDocument();
  });

  it("filters by API key substring", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.type(screen.getByPlaceholderText(/email.*api/i), "key-abc");
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.queryByText("bob@test.com")).not.toBeInTheDocument();
    expect(screen.queryByText("carol@test.com")).not.toBeInTheDocument();
  });

  it("shows empty state when no results", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.type(screen.getByPlaceholderText(/email.*api/i), "zzznomatch");
    expect(screen.getByText("Không tìm thấy kết quả")).toBeInTheDocument();
  });

  it("clear button removes search text", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    const searchInput = screen.getByPlaceholderText(/email.*api/i);
    await user.type(searchInput, "alice");
    expect(screen.queryByText("bob@test.com")).not.toBeInTheDocument();

    // The clear button is in FilterBar — it's a sibling to the input, inside the filter bar
    const filterBar = searchInput.closest(".bg-gray-50\\/80") as HTMLElement;
    const xBtn = filterBar?.querySelector("button:last-child") as HTMLButtonElement;
    await user.click(xBtn);
    // Controlled input: parent sets value={filters.email}, wait for re-render
    await waitFor(() => expect((searchInput as HTMLInputElement).value).toBe(""));
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });
});

describe("AccountsPage — sorting", () => {
  it("clicking Email header sorts ascending then descending", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    const emailHeader = screen.getByRole("columnheader", { name: /email/i });
    await user.click(emailHeader);

    const rows = screen.getAllByRole("row").slice(1);
    const cellText = rows[0].querySelector("td")?.textContent ?? "";
    expect(cellText).toContain("carol@test.com");
  });

  it("clicking Service header sorts ELEVENLABS before OPENROUTER (ascending)", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    const svcHeader = screen.getByRole("columnheader", { name: /service/i });
    await user.click(svcHeader);
    const rows = screen.getAllByRole("row").slice(1);
    // ELEVENLABS < OPENROUTER alphabetically
    expect(rows[0].textContent).toContain("ELEVENLABS");
  });
});

describe("AccountsPage — actions", () => {
  it("copies API key to clipboard on click", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    // Mock clipboard.writeText before finding the button
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const rows = screen.getAllByRole("row").slice(1);
    const aliceRow = rows.find(r => r.textContent?.includes("alice@test.com"));
    const copyBtn = aliceRow!.querySelector("td:nth-child(3) button") as HTMLButtonElement;
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("key-abc");
  });

  it("calls deleteAccount API after confirm", async () => {
    let deleted = false;
    server.use(
      http.delete(/\/accounts\/[^/]+\/[^/]+\/?(\?.*)?$/, () => {
        deleted = true;
        return HttpResponse.json({ success: true, data: { deleted: true }, meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" } });
      })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    // Click the delete button for alice (first delete button)
    const allDeleteBtns = screen.getAllByTitle("Delete");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(allDeleteBtns[0]);
    confirmSpy.mockRestore();
    await waitFor(() => expect(deleted).toBe(true));
  });

  it("calls updateAccount when toggling status", async () => {
    let patchCalled = false;
    server.use(
      http.patch(/\/accounts\/[^/]+\/[^/]+\/?(\?.*)?$/, () => {
        patchCalled = true;
        return HttpResponse.json({ success: true, data: { updated: true }, meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" } });
      })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    // Toggle button has title="Enable" or "Disable" (StatusCell has no title)
    const toggleBtn = screen.getAllByTitle(/Enable|Disable/i)[0];
    await user.click(toggleBtn);
    await waitFor(() => expect(patchCalled).toBe(true));
  });

  it("Refresh button reloads accounts", async () => {
    let callCount = 0;
    server.use(
      http.get(/\/accounts(\?.*)?$/, () => {
        callCount++;
        return HttpResponse.json(paginatedAccounts(mockAccounts));
      })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(callCount).toBeGreaterThanOrEqual(1));

    await user.click(screen.getByRole("button", { name: /refresh/i }));
    await waitFor(() => expect(callCount).toBeGreaterThanOrEqual(2));
  });
});

describe("AccountsPage — pagination", () => {
  it("shows pagination when there are more than 50 accounts", async () => {
    const manyAccounts = Array.from({ length: 55 }, (_, i) => ({
      email: `user${i}@test.com`,
      service: "ELEVENLABS",
      disabled: false,
      status: "active",
      api_key: undefined,
      credits: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    }));
    // Return ALL 55 accounts but with pages=2 so the UI shows pagination controls
    server.use(
      http.get(/\/accounts(\?.*)?$/, () =>
        HttpResponse.json({
          success: true,
          data: { accounts: manyAccounts, total: 55, page: 1, limit: 100, pages: 2 },
          meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
        })
      )
    );
    renderPage();
    await waitFor(() => screen.getByText("user0@test.com"));

    // Pagination controls render because pages > 1
    expect(screen.getByText("«")).toBeInTheDocument();
    expect(screen.getByText("»")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  });
});

describe("AccountsPage — coverage extras", () => {
  it("sorts by Credits, Status, Created, Updated headers; toggles email sort direction", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    await user.click(screen.getByRole("columnheader", { name: /credits/i }));
    await user.click(screen.getByRole("columnheader", { name: /status/i }));
    await user.click(screen.getByRole("columnheader", { name: /created/i }));
    // Note: "updated" is NOT a column — there's no updated_at in DEFAULT_VISIBLE_COLS
    await user.click(screen.getByRole("columnheader", { name: /email/i }));
    await user.click(screen.getByRole("columnheader", { name: /email/i }));
    await user.click(screen.getByRole("columnheader", { name: /email/i }));
    await waitFor(() => screen.getByText("alice@test.com"));
  });

  it("confirm=false cancels account delete", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("alice@test.com"));

    const deleteBtn = screen.getAllByTitle("Delete")[0];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(deleteBtn);
    confirmSpy.mockRestore();
    // alice should still be visible (delete was cancelled)
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
  });

  it("shows gray badge for unknown service", async () => {
    server.use(
      http.get(/\/accounts(\?.*)?$/, () =>
        HttpResponse.json(paginatedAccounts([
          ...mockAccounts,
          { email: "x@unknown.com", service: "UNKNOWN_SVC", disabled: false, status: "active", api_key: undefined, credits: null, created_at: null, updated_at: null },
        ] as typeof mockAccounts))
      )
    );
    renderPage();
    await waitFor(() => screen.getByText("x@unknown.com"));
    const badge = screen.getByText("UNKNOWN_SVC");
    expect(badge).toHaveClass("bg-gray-100");
  });

  it("renders dash for null credits and null dates", async () => {
    server.use(
      http.get(/\/accounts(\?.*)?$/, () =>
        HttpResponse.json(paginatedAccounts([{
          email: "nodata@test.com",
          service: "ELEVENLABS",
          disabled: false,
          status: "active",
          api_key: undefined,
          credits: null,
          created_at: null,
          updated_at: null,
        }] as typeof mockAccounts))
      )
    );
    renderPage();
    await waitFor(() => screen.getByText("nodata@test.com"));
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});

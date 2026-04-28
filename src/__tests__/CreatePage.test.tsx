import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import CreatePage, { LogPanel } from "../pages/CreatePage";
import * as clientModule from "../api/client";

const renderPage = () =>
  render(<MemoryRouter><CreatePage /></MemoryRouter>);

const SVC_CFG_KEY = "acc-creator:svc-cfg";

// Default paginated jobs response for GET /registration/jobs (matches handlers.ts shape)
const _defaultJobsResponse = {
  success: true,
  data: [
    { id: "job-1", service: "ELEVENLABS", count: 10, workers: 2, status: "done", created_at: "2026-01-01T07:00:00Z", created_count: 10, processed_count: 10 },
    { id: "job-2", service: "OPENROUTER", count: 5, workers: 1, status: "done", created_at: "2026-01-01T08:00:00Z", created_count: 5, processed_count: 5 },
  ],
  meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
};

// Default services response
const _defaultServicesResponse = {
  success: true,
  data: ["ELEVENLABS", "OPENROUTER", "CHATGPT"],
  meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  server.resetHandlers();
});

// Stub WebSocket so jsdom doesn't throw on new WebSocket()
// Use a plain function so "new Mock()" works as a constructor
beforeEach(() => {
  vi.stubGlobal("WebSocket", class extends Function {
    constructor() { super(); return { onopen: null, onmessage: null, onerror: null, onclose: null, send: vi.fn(), close: vi.fn() }; }
  });
});

describe("CreatePage — initial render", () => {
  it("renders heading and form controls", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /create accounts/i })).toBeInTheDocument();
    // Waits for services to load
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  });

  it("populates service dropdown from API", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("option", { name: "ELEVENLABS" })).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "OPENROUTER" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "CHATGPT" })).toBeInTheDocument();
  });

  it("shows Run button", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /run/i })).toBeEnabled());
  });
});

describe("CreatePage — per-service config persistence", () => {
  it("saves count/workers to localStorage when changed", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));

    const [countInput, workersInput] = screen.getAllByRole("spinbutton");
    // fireEvent.change is more reliable than user.clear + user.type for number inputs
    fireEvent.change(countInput, { target: { value: "50" } });
    fireEvent.change(workersInput, { target: { value: "3" } });

    const stored = JSON.parse(localStorage.getItem(SVC_CFG_KEY) ?? "{}");
    const svc = (screen.getByRole("combobox") as HTMLSelectElement).value;
    expect(stored[svc].count).toBe(50);
    expect(stored[svc].workers).toBe(3);
  });

  it("restores saved config when switching service", async () => {
    localStorage.setItem(SVC_CFG_KEY, JSON.stringify({ OPENROUTER: { count: 99, workers: 4 } }));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("option", { name: "OPENROUTER" }));

    await user.selectOptions(screen.getByRole("combobox"), "OPENROUTER");

    const [countInput, workersInput] = screen.getAllByRole("spinbutton");
    expect((countInput as HTMLInputElement).value).toBe("99");
    expect((workersInput as HTMLInputElement).value).toBe("4");
  });

  it("defaults to count=1, workers=1 for unknown service", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("option", { name: "CHATGPT" }));

    await user.selectOptions(screen.getByRole("combobox"), "CHATGPT");
    const [countInput, workersInput] = screen.getAllByRole("spinbutton");
    expect((countInput as HTMLInputElement).value).toBe("1");
    expect((workersInput as HTMLInputElement).value).toBe("1");
  });
});

describe("CreatePage — start job", () => {
  it("adds active job card after clicking Run", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));

    await user.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => expect(screen.getByText("Active Jobs")).toBeInTheDocument());
    // ELEVENLABS also appears in history table, so use getAllByText
    expect(screen.getAllByText("ELEVENLABS").length).toBeGreaterThan(0);
  });

  it("shows error message on API failure", async () => {
    // Mock api.startJob to throw with the FastAPI detail field
    vi.spyOn(clientModule.api, "startJob").mockRejectedValueOnce(
      Object.assign(new Error('{"detail":"Service offline"}'), { isFetchError: true })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));

    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText(/service offline/i)).toBeInTheDocument());
  });

  it("shows fallback error message when detail absent", async () => {
    // Mock api.startJob to throw with a plain error message (no FastAPI detail)
    vi.spyOn(clientModule.api, "startJob").mockRejectedValueOnce(new Error("some other error"));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText(/some other error/i)).toBeInTheDocument());
  });

  it("shows error when API unreachable", async () => {
    // Simulate network error by mocking api.startJob to throw TypeError
    vi.spyOn(clientModule.api, "startJob").mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));

    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText(/không kết nối/i)).toBeInTheDocument());
  });

  it("saves config to localStorage when Run is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));

    const [countInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(countInput, { target: { value: "7" } });
    await user.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(SVC_CFG_KEY) ?? "{}");
      const svc = (screen.getByRole("combobox") as HTMLSelectElement).value;
      expect(stored[svc]?.count).toBe(7);
    });
  });
});

describe("CreatePage — active job card UI", () => {
  // Helper: mock startJob to return a running job
  const mockStartJob = (overrides: Partial<Parameters<typeof clientModule.api.startJob>[0]> = {}) => {
    vi.spyOn(clientModule.api, "startJob").mockResolvedValueOnce({
      id: "job-new", service: "ELEVENLABS", count: 3, workers: 1,
      status: "running", created_at: new Date().toISOString(), created_count: 0, processed_count: 0,
      ...overrides,
    } as Parameters<typeof clientModule.api.startJob>[0]);
  };

  it("shows stop button for running job", async () => {
    mockStartJob();
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByTitle("Stop")).toBeInTheDocument());
  });

  it("clicking stop calls cancel API", async () => {
    let cancelled = false;
    vi.spyOn(clientModule.api, "cancelJob").mockImplementation(() => {
      cancelled = true;
      return Promise.resolve({ cancelled: true } as any);
    });
    mockStartJob();
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => screen.getByTitle("Stop"));
    await user.click(screen.getByTitle("Stop"));
    await waitFor(() => expect(cancelled).toBe(true));
  });

  it("collapses and expands log panel on header click", async () => {
    mockStartJob();
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText("Active Jobs")).toBeInTheDocument());

    // Find the active job card header (has cursor-pointer class)
    const jobCard = document.querySelector("[class*='ring-']");
    const header = jobCard?.querySelector("[class*='cursor-pointer']") as HTMLElement;
    expect(header).not.toBeNull();

    // Log panel shows when expanded (default)
    expect(screen.getByText("Đợi logs...")).toBeInTheDocument();

    // click header → collapse
    await user.click(header);
    expect(screen.queryByText("Đợi logs...")).not.toBeInTheDocument();

    // click again → expand
    await user.click(header);
    expect(screen.getByText("Đợi logs...")).toBeInTheDocument();
  });

  it("shows workers badge when workers > 1", async () => {
    mockStartJob({ workers: 3, count: 5 });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText(/⚡3w/)).toBeInTheDocument());
  });
});

describe("CreatePage — restore running jobs on mount", () => {
  it("attaches to running jobs from history on load", async () => {
    server.resetHandlers(
      http.get(/\/accounts\/services/, () => HttpResponse.json(_defaultServicesResponse)),
      http.get(/\/registration\/jobs\/?/, () =>
        HttpResponse.json({
          success: true,
          data: [
            { id: "job-running", service: "OPENROUTER", count: 10, workers: 1,
              status: "running", created_at: new Date().toISOString(), created_count: 3, processed_count: 3 }
          ],
          meta: { request_id: "test", ts: "2026-01-01T00:00:00Z" },
        })
      )
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("Active Jobs")).toBeInTheDocument());
    // OPENROUTER also appears in history table (job-2), use getAllByText
    expect(screen.getAllByText("OPENROUTER").length).toBeGreaterThan(0);
  });
});

describe("CreatePage — job history table", () => {
  it("renders history rows from API", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Job History")).toBeInTheDocument());
    expect(screen.getAllByText("ELEVENLABS").length).toBeGreaterThan(0);
  });

  it("shows done/failed badge with correct style", async () => {
    vi.spyOn(clientModule.api, "getJobs").mockResolvedValueOnce([
      { id: "job-1", service: "ELEVENLABS", count: 10, workers: 2, status: "done", created_at: "2026-01-01T07:00:00Z", created_count: 10, processed_count: 10 },
      { id: "job-2", service: "OPENROUTER", count: 5, workers: 1, status: "done", created_at: "2026-01-01T08:00:00Z", created_count: 5, processed_count: 5 },
    ] as Parameters<typeof clientModule.api.getJobs>[0]);
    renderPage();
    await waitFor(() => screen.getByText("Job History"));
    // Find badges inside the history table
    const historyTable = document.querySelector("table") as HTMLElement;
    expect(historyTable).not.toBeNull();
    const doneBadges = within(historyTable).getAllByText("done");
    expect(doneBadges.length).toBeGreaterThan(0);
    expect(doneBadges[0].className).toContain("emerald");
  });
});

describe("CreatePage — stats grid", () => {
  it("renders stats when history exists", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jobs run")).toBeInTheDocument());
    expect(screen.getByText("Succeeded")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Acc. created")).toBeInTheDocument();
  });
});

describe("CreatePage — coverage extras", () => {
  it("loadSvcCfg falls back to defaults when localStorage has invalid JSON", async () => {
    localStorage.setItem(SVC_CFG_KEY, "not-valid-json{{{");
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));
    // Should still render with defaults (count=1, workers=1)
    const [countInput] = screen.getAllByRole("spinbutton");
    expect((countInput as HTMLInputElement).value).toBe("1");
  });

  it("dismisses a done job card when Dismiss button clicked", async () => {
    vi.spyOn(clientModule.api, "startJob").mockResolvedValueOnce({
      id: "job-done", service: "ELEVENLABS", count: 3, workers: 1,
      status: "done", created_at: new Date().toISOString(), created_count: 3, processed_count: 3,
    } as Parameters<typeof clientModule.api.startJob>[0]);
    // Stub cancelJob to avoid real API calls
    vi.spyOn(clientModule.api, "cancelJob").mockResolvedValue({ cancelled: true } as any);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => expect(screen.getByText("Active Jobs")).toBeInTheDocument());

    // Find all Delete buttons — one from active card, history ones too
    const before = screen.getAllByTitle("Delete");
    expect(before.length).toBeGreaterThan(0);
    await user.click(before[0]);

    // Clicking Delete dismisses the active card — verify the card count dropped
    // (active card had 2 Delete buttons; after dismiss only history buttons remain)
    await waitFor(() => expect(screen.getAllByTitle("Delete").length).toBeLessThan(before.length));
  });

  it("LogPanel renders color-coded log lines", () => {
    const logs = ["✅ Account created", "❌ ERROR: failed", "⚠️ Warning", "🛑 Stopped", "normal log"];
    render(<LogPanel logs={logs} />);
    expect(screen.getByText("✅ Account created")).toBeInTheDocument();
    expect(screen.getByText("❌ ERROR: failed")).toBeInTheDocument();
    expect(screen.getByText("⚠️ Warning")).toBeInTheDocument();
    expect(screen.getByText("🛑 Stopped")).toBeInTheDocument();
    expect(screen.getByText("normal log")).toBeInTheDocument();
  });

  it("LogPanel compact renders placeholder when empty", () => {
    render(<LogPanel logs={[]} compact />);
    expect(screen.getByText("Đợi logs...")).toBeInTheDocument();
  });

  it("LogPanel onScroll unpins when scrolled away from bottom", () => {
    render(<LogPanel logs={["line 1", "line 2"]} />);
    const container = document.querySelector(".overflow-y-auto") as HTMLElement;
    // Simulate scrolled up: scrollHeight=200, scrollTop=0, clientHeight=100 → 200-0-100=100 ≥ 40 → unpin
    Object.defineProperty(container, "scrollHeight", { value: 200, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 0, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 100, configurable: true });
    fireEvent.scroll(container);
    // "cuối" scroll-to-bottom button should appear
    expect(screen.getByText("cuối")).toBeInTheDocument();
    // Click it to re-pin
    fireEvent.click(screen.getByText("cuối"));
    expect(screen.queryByText("cuối")).not.toBeInTheDocument();
  });

  it("WS onerror appends error message to logs", async () => {
    // Spy on wsLogs to capture and control the WebSocket instance
    const mockWs = { onmessage: null as any, onerror: null as any, onclose: null as any, readyState: 1, close: vi.fn(), send: vi.fn() };
    const spy = vi.spyOn(clientModule, "wsLogs").mockReturnValue(mockWs as any);

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("combobox")); // wait for services to load
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => screen.getByText("Active Jobs"));

    // attachToJob should have set mockWs.onerror
    expect(mockWs.onerror).toBeTypeOf("function");

    // Fire onerror and let React commit the update
    await act(async () => { mockWs.onerror?.(); });
    await waitFor(() => expect(screen.getByText("[WS error]")).toBeInTheDocument());

    spy.mockRestore();
  });

  it("poll timer updates job status and clears interval when done", async () => {
    vi.spyOn(clientModule.api, "getJob").mockResolvedValue({
      id: "job-new", service: "ELEVENLABS", count: 3, workers: 1,
      status: "done", created_at: new Date().toISOString(), created_count: 3, processed_count: 3,
    } as Parameters<typeof clientModule.api.getJob>[0]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /run/i }));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => screen.getByText("Active Jobs"));
    // Short timeout since poll fires at 1500ms
    await waitFor(() => expect(screen.getByTitle("Delete")).toBeInTheDocument(), { timeout: 3000 });
  }, 8000);

  it("job card shows ⚡workers badge when workers > 1", async () => {
    vi.spyOn(clientModule.api, "startJob").mockResolvedValueOnce({
      id: "job-multi", service: "ELEVENLABS", count: 0, workers: 3,
      status: "running", created_at: new Date().toISOString(), created_count: 0, processed_count: 0,
    } as Parameters<typeof clientModule.api.startJob>[0]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: /run/i }));
    await waitFor(() => screen.getByText("Active Jobs"));
    // workers=3 → shows ⚡3w badge; count=0 → pct=0 (covers job.count>0 false branch)
    expect(screen.getByText("⚡3w")).toBeInTheDocument();
  });
});
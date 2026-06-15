import { http, HttpResponse } from "msw";

// MSW intercepts ALL fetch - use regex patterns so handlers match regardless of URL host
const mockAccounts = [
  { email: "alice@test.com", service: "ELEVENLABS", disabled: false, status: "active", api_key: "key-abc", credits: 100, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
  { email: "bob@test.com",   service: "OPENROUTER", disabled: true,  status: "disabled", api_key: undefined, credits: 0,   created_at: "2026-01-03T00:00:00Z", updated_at: "2026-01-04T00:00:00Z" },
  { email: "carol@test.com", service: "ELEVENLABS",  disabled: false, status: "active", api_key: "key-xyz", credits: 50,  created_at: "2026-01-05T00:00:00Z", updated_at: "2026-01-06T00:00:00Z" },
];

const _meta = { request_id: "test", ts: "2026-01-01T00:00:00Z" };

// Use `const` then single export - avoid duplicate export error in rolldown
const _handlers = [
  http.get(/\/accounts(\?.*)?$/, () => HttpResponse.json({
    success: true,
    data: { accounts: mockAccounts, total: 3, page: 1, limit: 100, pages: 1 },
    meta: _meta,
  })),
  http.get(/\/accounts\/services/, () => HttpResponse.json({
    success: true, data: ["ELEVENLABS", "OPENROUTER", "CHATGPT"], meta: _meta,
  })),
  http.get(/\/accounts\/service-counts/, () => HttpResponse.json({
    success: true, data: { ALL: 3, ELEVENLABS: 2, OPENROUTER: 1, CHATGPT: 0 }, meta: _meta,
  })),
  http.delete(/\/accounts\/[^/]+\/[^/]+/, () => HttpResponse.json({
    success: true, data: { deleted: true }, meta: _meta,
  })),
  http.patch(/\/accounts\/[^/]+\/[^/]+/, () => HttpResponse.json({
    success: true, data: { updated: true }, meta: _meta,
  })),
  http.post(/\/accounts\/check/, () => HttpResponse.json({
    success: true, data: { status: "valid" }, meta: _meta,
  })),
  http.get(/\/registration\/jobs/, () => HttpResponse.json({
    success: true,
    data: [
      { id: "job-1", service: "ELEVENLABS",  count: 10, workers: 2, status: "done", created_at: "2026-01-01T07:00:00Z", created_count: 10, processed_count: 10 },
      { id: "job-2", service: "OPENROUTER", count: 5,  workers: 1, status: "done", created_at: "2026-01-01T08:00:00Z", created_count: 5,  processed_count: 5 },
    ],
    meta: _meta,
  })),
  http.get(/\/registration\/jobs\/job-2\/?/, () => HttpResponse.json({
    success: true,
    data: { id: "job-2", service: "OPENROUTER", count: 5, workers: 1, status: "done", created_at: "2026-01-01T08:00:00Z", created_count: 5, processed_count: 5 },
    meta: _meta,
  })),
  http.post(/\/registration\/jobs\/?/, () => HttpResponse.json({
    success: true,
    data: { id: "job-new", service: "ELEVENLABS", count: 3, workers: 1, status: "running", created_at: "2026-01-01T07:00:00Z", created_count: 0, processed_count: 0 },
    meta: _meta,
  })),
  http.post(/\/registration\/jobs\/[^/]+\/cancel\/?/, () => HttpResponse.json({
    success: true, data: { cancelled: true }, meta: _meta,
  })),
  http.get(/\/config\/files\/?/, () => HttpResponse.json({
    success: true, data: { files: ["config.yaml", "mail.yaml"] }, meta: _meta,
  })),
  http.get(/\/config\/raw\/?/, () => HttpResponse.json({
    success: true, data: { content: "key: value\n", file: "config.yaml" }, meta: _meta,
  })),
  http.put(/\/config\/raw\/?/, () => HttpResponse.json({
    success: true, data: { saved: true }, meta: _meta,
  })),
];

export const handlers = _handlers;
export const mockAccountsData = mockAccounts;

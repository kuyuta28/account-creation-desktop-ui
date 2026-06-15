import { useState, useEffect, useMemo, useCallback } from "react";
import { api, Account } from "../../api/client";
import {
  Filters, DEFAULT_FILTERS, SortKey, SortDir,
  ColKey, DEFAULT_VISIBLE_COLS,
} from "./types";

export interface UseAccountsReturn {
  allAccounts: Account[];
  services: string[];
  loading: boolean;
  load: () => void;

  serviceFilter: string;
  setServiceFilter: (s: string) => void;

  sortKey: SortKey;
  sortDir: SortDir;
  handleSort: (col: SortKey) => void;

  filters: Filters;
  updateFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;

  page: number;
  setPage: (p: number) => void;

  filtered: Account[];
  sorted: Account[];
  pageData: Account[];
  total: number;
  totalPages: number;

  serviceCounts: Record<string, number>;
  disabledCountForService: number;
  activeCount: number;
  withKeyCount: number;

  visibleCols: Set<ColKey>;
  col: (k: ColKey) => boolean;
  toggleCol: (k: ColKey) => void;
}

interface ApiAccountsResponse {
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function useAccounts(onToast: (msg: string, ok: boolean) => void): UseAccountsReturn {
  // Server-side data from current page
  const [serverAccounts, setServerAccounts] = useState<Account[]>([]);
  const [serverTotal, setServerTotal]       = useState(0);
  const [serverPages, setServerPages]       = useState(1);
  const [services, setServices]             = useState<string[]>(["ALL"]);
  const [serviceCounts, setServiceCounts]   = useState<Record<string, number>>({ ALL: 0 });
  const [loading, setLoading]               = useState(false);

  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [filters, setFilters]             = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey]             = useState<SortKey>("email");
  const [sortDir, setSortDir]             = useState<SortDir>("asc");
  const [page, setPage]                   = useState(1);
  const [visibleCols, setVisibleCols]     = useState<Set<ColKey>>(new Set(DEFAULT_VISIBLE_COLS));

  const PAGE_SIZE = 100;

  const load = useCallback((pg?: number) => {
    setLoading(true);
    const p = pg ?? page;
    Promise.all([
      api.getAccounts(serviceFilter !== "ALL" ? serviceFilter : undefined, p, PAGE_SIZE),
      api.getServices(),
    ])
      .then(([resp, serviceList]) => {
        const r = resp as ApiAccountsResponse;
        setServerAccounts(r.accounts);
        setServerTotal(r.total);
        setServerPages(r.pages);
        setServices(["ALL", ...serviceList]);
      })
      .catch((err) => onToast(`Load lỗi: ${String(err)}`, false))
      .finally(() => setLoading(false));
    // Service counts is best-effort: the backend may not expose
    // /accounts/service-counts yet, and the table should still load
    // even when that endpoint is missing.
    api
      .getServiceCounts()
      .then((counts) => setServiceCounts(counts))
      .catch(() => {
        // swallow — leave serviceCounts as the empty default
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFilter]);

  // Reload when service filter changes
  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFilter]);

  // Reload when page changes
  useEffect(() => {
    if (page !== 1) load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Manual refresh (same page)
  const handleRefresh = useCallback(() => {
    load(page);
  }, [load, page]);

  const handleSort = useCallback((col: SortKey) => {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
    setPage(1);
  }, [sortKey]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const toggleCol = useCallback((col: ColKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }, []);

  const col = useCallback((k: ColKey) => visibleCols.has(k), [visibleCols]);

  // Client-side filter on current server page
  const filtered = useMemo(() => {
    const q = filters.email.toLowerCase().trim();
    const quotaNum = filters.quotaOp && filters.quotaVal ? parseInt(filters.quotaVal) : NaN;
    return serverAccounts.filter((a) => {
      if (serviceFilter !== "ALL" && a.service !== serviceFilter) return false;
      if (filters.status !== "all" && a.status !== filters.status) return false;
      if (q && !a.email.toLowerCase().includes(q) && !(a.api_key ?? "").toLowerCase().includes(q)) return false;
      if (filters.quotaOp && !isNaN(quotaNum)) {
        const aPct = a.quota_pct ?? 0;
        if (filters.quotaOp === ">" && aPct <= quotaNum) return false;
        if (filters.quotaOp === "<" && aPct >= quotaNum) return false;
        if (filters.quotaOp === "=" && aPct !== quotaNum) return false;
      }
      if (filters.hasKey === "yes" && !a.api_key) return false;
      if (filters.hasKey === "no" && !!a.api_key) return false;
      return true;
    });
  }, [serverAccounts, serviceFilter, filters]);

  const sorted = useMemo(() => {
    const statusRank = (x: Account) =>
      ({ active: 0, unchecked: 1, expired: 2, disabled: 3 }[x.status ?? "unchecked"] ?? 1);
    return [...filtered].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "email")      { va = a.email;            vb = b.email; }
      if (sortKey === "service")    { va = a.service;          vb = b.service; }
      if (sortKey === "credits")    { va = a.credits ?? -1;    vb = b.credits ?? -1; }
      if (sortKey === "status")     { va = statusRank(a);      vb = statusRank(b); }
      if (sortKey === "quota_pct")  { va = a.quota_pct ?? -1;  vb = b.quota_pct ?? -1; }
      if (sortKey === "created_at") { va = a.created_at ?? "";  vb = b.created_at ?? ""; }
      if (sortKey === "updated_at") { va = a.updated_at ?? "";  vb = b.updated_at ?? ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, serverPages);
  const pageData   = sorted;

  const disabledCountForService = useMemo(() => {
    const base = serviceFilter === "ALL" ? serverAccounts : serverAccounts.filter((a) => a.service === serviceFilter);
    return base.filter((a) => a.status === "disabled").length;
  }, [serverAccounts, serviceFilter]);

  const activeCount  = useMemo(() => serverAccounts.filter((a) => !a.disabled).length, [serverAccounts]);
  const withKeyCount = useMemo(() => serverAccounts.filter((a) => !!a.api_key).length, [serverAccounts]);

  return {
    get allAccounts() { return serverAccounts; },
    services, loading,
    get load() { return handleRefresh; },
    serviceFilter, setServiceFilter,
    sortKey, sortDir, handleSort,
    filters, updateFilters, resetFilters,
    page, setPage,
    get filtered() { return filtered; },
    get sorted() { return sorted; },
    get pageData() { return pageData; },
    get total() { return serverTotal; },
    totalPages,
    serviceCounts, disabledCountForService, activeCount, withKeyCount,
    visibleCols, col, toggleCol,
  };
}

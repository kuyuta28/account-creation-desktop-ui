import { useState, useEffect, useMemo, useCallback } from "react";
import { api, Account } from "../../api/client";
import { PAGE_SIZE } from "../../constants/accounts";
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
  totalPages: number;

  serviceCounts: Record<string, number>;
  disabledCountForService: number;
  activeCount: number;
  withKeyCount: number;

  visibleCols: Set<ColKey>;
  col: (k: ColKey) => boolean;
  toggleCol: (k: ColKey) => void;
}

export function useAccounts(onToast: (msg: string, ok: boolean) => void): UseAccountsReturn {
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [services, setServices]       = useState<string[]>(["ALL"]);
  const [loading, setLoading]         = useState(false);

  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [filters, setFilters]             = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey]             = useState<SortKey>("email");
  const [sortDir, setSortDir]             = useState<SortDir>("asc");
  const [page, setPage]                   = useState(1);
  const [visibleCols, setVisibleCols]     = useState<Set<ColKey>>(new Set(DEFAULT_VISIBLE_COLS));

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getAccounts(), api.getServices()])
      .then(([accounts, serviceList]) => {
        setAllAccounts(accounts);
        setServices(["ALL", ...serviceList]);
      })
      .catch((err) => onToast(`Load lỗi: ${String(err)}`, false))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const filtered = useMemo(() => {
    const q = filters.email.toLowerCase().trim();
    const quotaNum = filters.quotaOp && filters.quotaVal ? parseInt(filters.quotaVal) : NaN;
    return allAccounts.filter((a) => {
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
  }, [allAccounts, serviceFilter, filters]);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allAccounts.length };
    for (const a of allAccounts) counts[a.service] = (counts[a.service] ?? 0) + 1;
    return counts;
  }, [allAccounts]);

  const disabledCountForService = useMemo(() => {
    const base = serviceFilter === "ALL" ? allAccounts : allAccounts.filter((a) => a.service === serviceFilter);
    return base.filter((a) => a.status === "disabled").length;
  }, [allAccounts, serviceFilter]);

  const activeCount  = useMemo(() => allAccounts.filter((a) => !a.disabled).length, [allAccounts]);
  const withKeyCount = useMemo(() => allAccounts.filter((a) => !!a.api_key).length, [allAccounts]);

  return {
    allAccounts, services, loading, load,
    serviceFilter, setServiceFilter,
    sortKey, sortDir, handleSort,
    filters, updateFilters, resetFilters,
    page, setPage,
    filtered, sorted, pageData, totalPages,
    serviceCounts, disabledCountForService, activeCount, withKeyCount,
    visibleCols, col, toggleCol,
  };
}

// ── Sort / Col types ──────────────────────────────────────────────────────

export type SortKey = "email" | "service" | "credits" | "status" | "quota_pct" | "created_at" | "updated_at";
export type SortDir = "asc" | "desc";

export type ColKey =
  | "email" | "service" | "api_key" | "password" | "credits"
  | "status" | "quota_pct" | "created_at" | "last_checked" | "last_error" | "actions";

export const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: "email",        label: "Email" },
  { key: "service",      label: "Service" },
  { key: "api_key",      label: "API Key" },
  { key: "password",     label: "Password" },
  { key: "credits",      label: "Credits" },
  { key: "status",       label: "Status" },
  { key: "quota_pct",    label: "Quota" },
  { key: "created_at",   label: "Created" },
  { key: "last_checked", label: "Last Checked" },
  { key: "last_error",   label: "Last Error" },
  { key: "actions",      label: "Actions" },
];

export const DEFAULT_VISIBLE_COLS = new Set<ColKey>([
  "email", "service", "api_key", "password", "credits", "status", "quota_pct", "created_at", "actions",
]);

// ── Filters ───────────────────────────────────────────────────────────────

export interface Filters {
  email: string;
  status: "all" | "active" | "disabled" | "unchecked" | "expired";
  quotaOp: "" | ">" | "<" | "=";
  quotaVal: string;
  hasKey: "all" | "yes" | "no";
}

export const DEFAULT_FILTERS: Filters = {
  email: "", status: "all", quotaOp: "", quotaVal: "", hasKey: "all",
};

// ── Form state ────────────────────────────────────────────────────────────

export interface AddFormState {
  service: string;
  email: string;
  api_key: string;
  password: string;
  totp_secret: string;
  app_password: string;
  source_email: string;
}

export const DEFAULT_ADD_FORM: AddFormState = {
  service: "", email: "", api_key: "", password: "", totp_secret: "", app_password: "", source_email: "",
};

export interface EditFormState {
  api_key: string;
  password: string;
  totp_secret: string;
  app_password: string;
}

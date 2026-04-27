// ── Service metadata constants ─────────────────────────────────────────────

export const SERVICE_COLORS: Record<string, string> = {
  OPENROUTER:         "bg-violet-100 text-violet-700",
  ELEVENLABS:         "bg-amber-100 text-amber-700",
  CHATGPT:            "bg-emerald-100 text-emerald-700",
  LEONARDO:           "bg-blue-100 text-blue-700",
  PROTON:             "bg-orange-100 text-orange-700",
  ARTIFICIALANALYSIS: "bg-teal-100 text-teal-700",
  OLLAMA:             "bg-gray-100 text-gray-700",
};

export const PAGE_SIZE = 50;

/** Services that support individual account checking */
export const CHECKABLE_SERVICES = new Set(["CHATGPT", "ELEVENLABS", "OPENROUTER"]);

/** Services that are mailbox providers — NOT target services for adding accounts */
export const MAILBOX_PROVIDER_SERVICES = new Set(["GMAIL", "GOOGLEMAIL", "PROTONMAIL"]);

// ── Per-service add fields ─────────────────────────────────────────────────

export type AddField = "api_key" | "password" | "totp_secret" | "app_password" | "source_email";

/** Fields shown in Add Account modal per service, ordered by relevance */
export const SERVICE_FIELDS: Record<string, AddField[]> = {
  OPENROUTER:         ["api_key", "password"],
  ELEVENLABS:         ["api_key", "password"],
  CHATGPT:            ["password"],
  LEONARDO:           ["password"],
  PROTON:             ["password"],
  ARTIFICIALANALYSIS: ["api_key"],
  TESTMAIL:           ["api_key"],
  MAILOSAUR:          ["api_key", "password"],
  KLING:              [],
  KLINGAI:            [],
  OLLAMA:             ["api_key", "password"],
  GMAIL:              ["password", "totp_secret", "app_password", "source_email"],
  GOOGLEMAIL:         ["password", "totp_secret", "app_password", "source_email"],
};

const ALL_ADD_FIELDS: AddField[] = ["api_key", "password", "totp_secret", "app_password", "source_email"];

/** Return fields for given service; defaults to all fields for unknown services */
export const getServiceFields = (service: string): AddField[] =>
  SERVICE_FIELDS[service.toUpperCase()] ?? ALL_ADD_FIELDS;

// ── Utilities ─────────────────────────────────────────────────────────────

export const isGmailMailbox = (email?: string): boolean => {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com");
};

import type { AccountStatus } from "./useAAAccounts";

export const accountStatusLabel = (
  email: string,
  statuses: Record<string, AccountStatus>,
): string => {
  const s = statuses[email] ?? "unknown";
  if (s === "valid") return `✓ ${email}`;
  if (s === "expired") return `⚠ ${email}`;
  return `? ${email}`;
};

export const accountStatusColor = (
  email: string,
  statuses: Record<string, AccountStatus>,
): string => {
  const s = statuses[email] ?? "unknown";
  if (s === "valid") return "text-emerald-600";
  if (s === "expired") return "text-red-500";
  return "text-gray-400";
};

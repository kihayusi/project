import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a human-friendly order ID from a UUID and created_at timestamp.
 * Format: SCC-YYYYMMDD-XXXXX  (e.g. SCC-20260301-A3F7B)
 * Uses the first 5 hex chars of the UUID for uniqueness.
 */
export function generateOrderId(id: string, createdAt: string): string {
  const d = new Date(createdAt);
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const short = id.replace(/-/g, "").substring(0, 5).toUpperCase();
  return `SCC-${ymd}-${short}`;
}

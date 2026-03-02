/**
 * Centralised request-category detection.
 *
 * Uses the `category` database column as the primary signal and falls back
 * to a subject-prefix check for legacy rows that may not have the category
 * field set accurately.
 */

export type RequestCategory = "documents" | "business" | "health" | "concerns";

interface RequestLike {
  category?: string | null;
  subject?: string | null;
}

/** Classify a citizen_concerns row into one of the four UI categories. */
export function classifyRequest(request: RequestLike): RequestCategory {
  const cat = (request.category ?? "").toLowerCase();
  const subj = (request.subject ?? "").toLowerCase();

  // Document requests
  if (subj.startsWith("document request:")) return "documents";
  if (cat.includes("birth") || cat.includes("marriage") || cat.includes("death") || cat.includes("cedula") || cat.includes("residen")) {
    return "documents";
  }

  // Business services
  if (cat === "business services" || subj.startsWith("business") || subj.startsWith("new business") || subj.includes("permit renewal")) {
    return "business";
  }

  // Health services
  if (cat === "health services" || subj.startsWith("health") || subj.startsWith("vaccination") || subj.startsWith("medical") || subj.startsWith("schedule registration")) {
    return "health";
  }

  return "concerns";
}

/** Split an array of requests into the four category bins. */
export function partitionRequests<T extends RequestLike>(
  items: T[],
): Record<RequestCategory, T[]> {
  const result: Record<RequestCategory, T[]> = {
    documents: [],
    business: [],
    health: [],
    concerns: [],
  };

  for (const item of items) {
    result[classifyRequest(item)].push(item);
  }

  return result;
}

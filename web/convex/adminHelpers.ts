/**
 * Admin helper functions for authorization, field validation, and status determination.
 *
 * Exports:
 * - isAdmin: Auth guard stub (always true for Phase 5, future: Clerk check)
 * - hasRequiredFields: Field completeness check for auto-publish gate
 * - determineStatus: Resolves scholarship status from source trust + completeness
 */

/**
 * Authorization guard stub (D-08).
 * Phase 5: no auth, always returns true.
 * Future: check Clerk token via ctx.auth.getUserIdentity().
 */
export async function isAdmin(_ctx: any): Promise<boolean> {
  // Phase 5: no auth, always allow
  // Future: const identity = await ctx.auth.getUserIdentity();
  // return identity?.tokenIdentifier === ADMIN_TOKEN;
  return true;
}

/**
 * Field completeness check (D-15).
 * A scholarship must have title, description, host_country (not "International"),
 * and application_url to qualify for auto-publish.
 */
export function hasRequiredFields(scholarship: {
  title?: string;
  description?: string;
  host_country?: string;
  application_url?: string;
}): boolean {
  return !!(
    scholarship.title?.trim() &&
    scholarship.description?.trim() &&
    scholarship.host_country?.trim() &&
    scholarship.host_country !== "International" &&
    scholarship.application_url?.trim()
  );
}

/**
 * Determine scholarship status from source trust + field completeness (D-14, D-15, D-16).
 *
 * - blocked source -> "rejected"
 * - needs_review source -> "pending_review"
 * - auto_publish source + complete fields -> "published"
 * - auto_publish source + incomplete fields -> "pending_review"
 *
 * When multiple sources contribute, the highest trust level wins (D-16).
 */
export async function determineStatus(
  ctx: any,
  sourceIds: any[],
  scholarshipFields: {
    title?: string;
    description?: string;
    host_country?: string;
    application_url?: string;
  },
): Promise<"published" | "pending_review" | "rejected"> {
  // Resolve all sources, find highest trust level
  let highestTrust: "auto_publish" | "needs_review" | "blocked" = "needs_review";
  const trustOrder: Record<string, number> = {
    auto_publish: 3,
    needs_review: 2,
    blocked: 1,
  };

  for (const sourceId of sourceIds) {
    const source = await ctx.db.get(sourceId);
    if (!source) continue;
    const sourceTrust = source.trust_level as "auto_publish" | "needs_review" | "blocked";
    if ((trustOrder[sourceTrust] ?? 0) > (trustOrder[highestTrust] ?? 0)) {
      highestTrust = sourceTrust;
    }
  }

  if (highestTrust === "blocked") return "rejected";
  if (highestTrust === "needs_review") return "pending_review";

  // auto_publish: check field completeness (D-15)
  if (highestTrust === "auto_publish") {
    return hasRequiredFields(scholarshipFields) ? "published" : "pending_review";
  }

  return "pending_review";
}

/**
 * Admin helper functions for authorization, field validation, and status determination.
 *
 * Exports:
 * - isAdmin: Auth guard for admin queries/mutations
 * - hasAdminAccess: Non-throwing admin check for UI capability probing
 * - hasRequiredFields: Field completeness check for auto-publish gate
 * - determineStatus: Resolves scholarship status from source trust + completeness
 */

/**
 * Read a comma-separated env list into normalized entries.
 */
function readEnvList(name: string): string[] {
  if (typeof process === "undefined" || !process.env) return [];
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isUnsafeBypassEnabled(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  return process.env.CONVEX_ADMIN_BYPASS_UNSAFE === "true";
}

function isAuthEnforcementEnabled(): boolean {
  if (typeof process === "undefined" || !process.env) return false;

  // Temporary default: open admin until enforcement is explicitly enabled.
  // Set ADMIN_ENFORCE_AUTH=true when you're ready to lock this down.
  return process.env.ADMIN_ENFORCE_AUTH === "true";
}

/**
 * Authorization guard (D-08).
 *
 * Default behavior (temporary): allow access unless ADMIN_ENFORCE_AUTH=true.
 *
 * Enforced behavior requires:
 * 1) authenticated Convex identity
 * 2) identity tokenIdentifier OR email present in server-side allowlist env vars
 *
 * Allowlist env vars (comma-separated):
 * - ADMIN_TOKEN_IDENTIFIERS
 * - ADMIN_TOKEN_IDENTIFIER
 * - ADMIN_EMAILS
 *
 * Emergency local bypass (never enable in production):
 * - CONVEX_ADMIN_BYPASS_UNSAFE=true
 */
export async function isAdmin(ctx: any): Promise<boolean> {
  if (isUnsafeBypassEnabled() || !isAuthEnforcementEnabled()) {
    return true;
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: sign in required for admin access");
  }

  const allowedTokenIdentifiers = new Set([
    ...readEnvList("ADMIN_TOKEN_IDENTIFIERS"),
    ...readEnvList("ADMIN_TOKEN_IDENTIFIER"),
  ]);
  const allowedEmails = new Set(
    readEnvList("ADMIN_EMAILS").map((email) => email.toLowerCase()),
  );

  if (allowedTokenIdentifiers.size === 0 && allowedEmails.size === 0) {
    throw new Error(
      "Unauthorized: admin allowlist is not configured (set ADMIN_TOKEN_IDENTIFIERS or ADMIN_EMAILS)",
    );
  }

  const tokenIdentifier =
    typeof identity.tokenIdentifier === "string" ? identity.tokenIdentifier : "";
  const email = typeof identity.email === "string" ? identity.email.toLowerCase() : "";

  if (allowedTokenIdentifiers.has(tokenIdentifier)) {
    return true;
  }
  if (email && allowedEmails.has(email)) {
    return true;
  }

  throw new Error("Unauthorized: admin access denied");
}

/**
 * Non-throwing admin check for UI access probing.
 */
export async function hasAdminAccess(ctx: any): Promise<boolean> {
  try {
    await isAdmin(ctx);
    return true;
  } catch {
    return false;
  }
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
  // Start with null so the first source sets the baseline
  let highestTrust: "auto_publish" | "needs_review" | "blocked" | null = null;
  const trustOrder: Record<string, number> = {
    auto_publish: 3,
    needs_review: 2,
    blocked: 1,
  };

  for (const sourceId of sourceIds) {
    const source = await ctx.db.get(sourceId);
    if (!source) continue;
    const sourceTrust = source.trust_level as "auto_publish" | "needs_review" | "blocked";
    if (highestTrust === null || (trustOrder[sourceTrust] ?? 0) > (trustOrder[highestTrust] ?? 0)) {
      highestTrust = sourceTrust;
    }
  }

  // Default to needs_review if no sources found
  if (highestTrust === null) highestTrust = "needs_review";

  if (highestTrust === "blocked") return "rejected";
  if (highestTrust === "needs_review") return "pending_review";

  // auto_publish: check field completeness (D-15)
  if (highestTrust === "auto_publish") {
    return hasRequiredFields(scholarshipFields) ? "published" : "pending_review";
  }

  return "pending_review";
}

/**
 * Aggregation pipeline mutations.
 *
 * Batch-processes unpromoted raw_records through composite matching,
 * trust-weighted merging, cycle detection, and auto-archival.
 * All scholarship writes go through trigger-wrapped mutations so
 * prestige_score, prestige_tier, and search_text auto-compute.
 */

import { v } from "convex/values";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internal } from "./_generated/api";
import { internalMutation as rawInternalMutation } from "./_generated/server";
import { determineStatus } from "./adminHelpers";
import {
  computeExpectedReopenMonth,
  computeMatchKey,
  extractYear,
  getTrustRank,
  hasDegreeLevelOverlap,
  parseDeadlineToTimestamp,
  resolveField,
  shouldArchive,
  toSlug,
} from "./aggregationHelpers";
import { wrapDB } from "./triggers";

// Trigger-wrapped internalMutation so scholarship writes fire prestige/search_text triggers
const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

// Valid degree levels and funding types for validation
const VALID_DEGREES = new Set(["bachelor", "master", "phd", "postdoc"]);
const VALID_FUNDING = new Set(["fully_funded", "partial", "tuition_waiver", "stipend_only"]);

// ---------- Mutation 1: aggregateBatch ----------

export const aggregateBatch = triggeredInternalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
    runId: v.optional(v.id("scrape_runs")),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    const counts = { new: 0, updated: 0, duplicate: 0 };

    // Query unpromoted raw_records (canonical_id is undefined/null).
    // We use .take() instead of .paginate() because we set canonical_id on each
    // record as we process it, so the next batch query naturally skips processed records.
    const unpromoted = await ctx.db
      .query("raw_records")
      .filter((q) =>
        q.or(q.eq(q.field("canonical_id"), undefined), q.eq(q.field("canonical_id"), null)),
      )
      .take(batchSize);

    for (const record of unpromoted) {
      // Skip records with empty titles
      if (!record.title || !record.title.trim()) {
        await ctx.db.patch(record._id, { match_status: "new" as const });
        continue;
      }

      const org = record.provider_organization ?? "Unknown";
      const country = record.host_country ?? "International";
      const matchKey = computeMatchKey(record.title, org, country);

      // Look up existing scholarships by match_key
      const candidates = await ctx.db
        .query("scholarships")
        .withIndex("by_match_key", (q) => q.eq("match_key", matchKey))
        .collect();

      const recordDegrees = (record.degree_levels as string[]) ?? [];

      // Extract year from the incoming record for cycle detection
      const recordDeadlineTs = parseDeadlineToTimestamp(record.application_deadline);
      const recordYear = extractYear(record.title, recordDeadlineTs);

      // Full match (D-01): same match_key + degree overlap
      const fullMatches = candidates.filter((c) =>
        hasDegreeLevelOverlap(c.degree_levels, recordDegrees),
      );

      if (fullMatches.length > 0) {
        // Check for cycle: if years differ, this is a new cycle, not a duplicate (D-09/D-12)
        const sameYearMatches = fullMatches.filter((c) => {
          if (recordYear === null) return true; // No year info -> treat as same cycle
          const candidateYear = extractYear(c.title, c.application_deadline ?? undefined);
          return candidateYear === null || candidateYear === recordYear;
        });

        if (sameYearMatches.length > 0) {
          // Same year (or no year info): merge into existing scholarship
          const target =
            sameYearMatches.find((m) => m.status === "published") ??
            sameYearMatches.sort((a, b) => b._creationTime - a._creationTime)[0];

          await mergeIntoScholarship(ctx, target, record);
          counts.updated++;
        } else {
          // Different year: new cycle entry (D-09/D-12)
          const newId = await createScholarship(ctx, record, matchKey, false);
          await handleCycleDetection(ctx, newId, record, matchKey);
          await handleAutoArchive(ctx, newId, record);
          counts.new++;
        }
      } else if (candidates.length > 0) {
        // Partial match (D-03): same match_key but NO degree overlap
        const newId = await createScholarship(ctx, record, matchKey, true);
        await handleCycleDetection(ctx, newId, record, matchKey);
        await handleAutoArchive(ctx, newId, record);
        counts.duplicate++;
      } else {
        // No match: create new canonical entry
        const newId = await createScholarship(ctx, record, matchKey, false);
        await handleCycleDetection(ctx, newId, record, matchKey);
        await handleAutoArchive(ctx, newId, record);
        counts.new++;
      }
    }

    // Log run-level counts
    console.log(
      `[aggregation] batch complete: ${counts.new} new, ${counts.updated} updated, ${counts.duplicate} possible duplicates`,
    );

    // If there are more records, schedule next batch
    if (unpromoted.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.aggregation.aggregateBatch, {
        cursor: null,
        batchSize: batchSize,
        runId: args.runId,
      });
    }
  },
});

// ---------- Mutation 2: backfillMatchKeys ----------

export const backfillMatchKeys = triggeredInternalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;

    // Find scholarships without match_key
    const scholarships = await ctx.db
      .query("scholarships")
      .filter((q) => q.or(q.eq(q.field("match_key"), undefined), q.eq(q.field("match_key"), null)))
      .take(batchSize);

    for (const scholarship of scholarships) {
      const matchKey = computeMatchKey(
        scholarship.title,
        scholarship.provider_organization,
        scholarship.host_country,
      );
      await ctx.db.patch(scholarship._id, { match_key: matchKey });
    }

    // Schedule next batch if we processed a full batch
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.aggregation.backfillMatchKeys, {
        cursor: null,
        batchSize: batchSize,
      });
    }

    return { processed: scholarships.length };
  },
});

// ---------- Mutation 3: archiveExpired ----------

export const archiveExpired = triggeredInternalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const batchSize = 50;
    let archived = 0;

    // Query published scholarships
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(batchSize);

    for (const scholarship of scholarships) {
      // application_deadline on scholarships is stored as number (epoch ms)
      if (shouldArchive(scholarship.application_deadline)) {
        const reopenMonth = scholarship.application_deadline
          ? computeExpectedReopenMonth([scholarship.application_deadline])
          : null;

        await ctx.db.patch(scholarship._id, {
          status: "archived",
          ...(reopenMonth !== null ? { expected_reopen_month: reopenMonth } : {}),
        });
        archived++;
      }
    }

    // Self-schedule next batch if we found any to check
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.aggregation.archiveExpired, { cursor: null });
    }

    return { archived };
  },
});

// ---------- Helper: Merge raw_record into existing scholarship ----------

async function mergeIntoScholarship(ctx: any, scholarship: any, record: any) {
  // Load the source document for this raw_record
  const recordSource = await ctx.db.get(record.source_id);
  const recordCategory = recordSource?.category ?? "aggregator";

  // Load all existing raw_records linked to this scholarship
  const linkedRecords = await ctx.db
    .query("raw_records")
    .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarship._id))
    .collect();

  // Build candidates arrays for field resolution
  type Candidate<T> = {
    value: T | undefined | null;
    category: string;
    scrapedAt: number;
  };

  const buildCandidates = async <T>(fieldName: string): Promise<Candidate<T>[]> => {
    const candidates: Candidate<T>[] = [];

    // Add existing linked raw_records
    for (const lr of linkedRecords) {
      const lrSource = await ctx.db.get(lr.source_id);
      candidates.push({
        value: (lr as any)[fieldName],
        category: lrSource?.category ?? "aggregator",
        scrapedAt: lr.scraped_at,
      });
    }

    // Add the new record
    candidates.push({
      value: (record as any)[fieldName],
      category: recordCategory,
      scrapedAt: record.scraped_at,
    });

    return candidates;
  };

  // Resolve scalar fields using trust hierarchy
  const titleCandidates = await buildCandidates<string>("title");
  const descCandidates = await buildCandidates<string>("description");
  const orgCandidates = await buildCandidates<string>("provider_organization");
  const countryCandidates = await buildCandidates<string>("host_country");
  const appUrlCandidates = await buildCandidates<string>("application_url");
  const awardAmountCandidates = await buildCandidates<string>("award_amount");
  const fundingTypeCandidates = await buildCandidates<string>("funding_type");
  const deadlineCandidates = await buildCandidates<string>("application_deadline");

  const resolvedTitle = resolveField(titleCandidates) ?? scholarship.title;
  const resolvedDescription = resolveField(descCandidates) ?? scholarship.description;
  const resolvedOrg = resolveField(orgCandidates) ?? scholarship.provider_organization;
  const resolvedCountry = resolveField(countryCandidates) ?? scholarship.host_country;
  const resolvedAppUrl = resolveField(appUrlCandidates) ?? scholarship.application_url;
  const resolvedAwardAmount = resolveField(awardAmountCandidates);
  const resolvedFundingType = resolveField(fundingTypeCandidates) ?? scholarship.funding_type;
  const resolvedDeadlineStr = resolveField(deadlineCandidates);

  // Union merge for array fields: degree_levels, eligibility_nationalities, fields_of_study
  const allDegrees = new Set<string>(scholarship.degree_levels ?? []);
  for (const lr of linkedRecords) {
    for (const d of (lr.degree_levels as string[]) ?? []) allDegrees.add(d);
  }
  for (const d of (record.degree_levels as string[]) ?? []) allDegrees.add(d);
  const mergedDegrees = [...allDegrees].filter((d) => VALID_DEGREES.has(d)) as Array<
    "bachelor" | "master" | "phd" | "postdoc"
  >;

  const allNationalities = new Set<string>(scholarship.eligibility_nationalities ?? []);
  for (const lr of linkedRecords) {
    for (const n of lr.eligibility_nationalities ?? []) allNationalities.add(n);
  }
  for (const n of record.eligibility_nationalities ?? []) allNationalities.add(n);

  const allFields = new Set<string>(scholarship.fields_of_study ?? []);
  for (const lr of linkedRecords) {
    for (const f of lr.fields_of_study ?? []) allFields.add(f);
  }
  for (const f of record.fields_of_study ?? []) allFields.add(f);

  // OR merge for funding booleans
  const fundingTuition =
    scholarship.funding_tuition ||
    linkedRecords.some((lr: any) => lr.funding_tuition) ||
    record.funding_tuition ||
    false;
  const fundingLiving =
    scholarship.funding_living ||
    linkedRecords.some((lr: any) => lr.funding_living) ||
    record.funding_living ||
    false;
  const fundingTravel =
    scholarship.funding_travel ||
    linkedRecords.some((lr: any) => lr.funding_travel) ||
    record.funding_travel ||
    false;
  const fundingInsurance =
    scholarship.funding_insurance ||
    linkedRecords.some((lr: any) => lr.funding_insurance) ||
    record.funding_insurance ||
    false;

  // Build updated source_ids
  const sourceIds = [...scholarship.source_ids];
  if (!sourceIds.includes(record.source_id)) {
    sourceIds.push(record.source_id);
  }

  // Parse the resolved deadline string to timestamp
  const resolvedDeadline = parseDeadlineToTimestamp(resolvedDeadlineStr);

  // Validate funding type
  const validFundingType = VALID_FUNDING.has(resolvedFundingType)
    ? (resolvedFundingType as "fully_funded" | "partial" | "tuition_waiver" | "stipend_only")
    : scholarship.funding_type;

  // Patch the scholarship with merged values
  await ctx.db.patch(scholarship._id, {
    title: resolvedTitle,
    description: resolvedDescription,
    provider_organization: resolvedOrg,
    host_country: resolvedCountry,
    application_url: resolvedAppUrl,
    degree_levels: mergedDegrees.length > 0 ? mergedDegrees : scholarship.degree_levels,
    eligibility_nationalities: allNationalities.size > 0 ? [...allNationalities] : undefined,
    fields_of_study: allFields.size > 0 ? [...allFields] : undefined,
    funding_type: validFundingType,
    funding_tuition: fundingTuition || undefined,
    funding_living: fundingLiving || undefined,
    funding_travel: fundingTravel || undefined,
    funding_insurance: fundingInsurance || undefined,
    source_ids: sourceIds,
    award_amount_min: resolvedAwardAmount ? scholarship.award_amount_min : undefined,
    application_deadline: resolvedDeadline ?? scholarship.application_deadline,
    application_deadline_text: resolvedDeadlineStr ?? scholarship.application_deadline_text,
    last_verified: Date.now(),
  });

  // Re-evaluate status if scholarship is not yet published (D-14/D-16)
  if (scholarship.status !== "published") {
    const newStatus = await determineStatus(ctx, sourceIds, {
      title: resolvedTitle,
      description: resolvedDescription,
      host_country: resolvedCountry,
      application_url: resolvedAppUrl,
    });
    if (newStatus === "published") {
      await ctx.db.patch(scholarship._id, { status: "published" });
    }
  }

  // Link raw_record to the scholarship
  await ctx.db.patch(record._id, {
    canonical_id: scholarship._id,
    match_status: "matched" as const,
  });
}

// ---------- Helper: Create new canonical scholarship ----------

async function createScholarship(
  ctx: any,
  record: any,
  matchKey: string,
  isPossibleDuplicate = false,
): Promise<any> {
  // Generate slug
  let slug = toSlug(record.title);
  const existingSlug = await ctx.db
    .query("scholarships")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();
  if (existingSlug) {
    // Append counter suffix for collision
    let counter = 2;
    while (true) {
      const candidateSlug = `${slug}-${counter}`;
      const collision = await ctx.db
        .query("scholarships")
        .withIndex("by_slug", (q: any) => q.eq("slug", candidateSlug))
        .first();
      if (!collision) {
        slug = candidateSlug;
        break;
      }
      counter++;
    }
  }

  // Map degree_levels: filter valid, default to ["master"]
  let degreeLevels: Array<"bachelor" | "master" | "phd" | "postdoc"> = [];
  if (record.degree_levels && Array.isArray(record.degree_levels)) {
    degreeLevels = (record.degree_levels as string[]).filter((d) =>
      VALID_DEGREES.has(d.toLowerCase()),
    ) as Array<"bachelor" | "master" | "phd" | "postdoc">;
  }
  if (degreeLevels.length === 0) {
    degreeLevels = ["master"];
  }

  // Map funding_type: validate, default to "partial"
  let fundingType: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only" = "partial";
  if (record.funding_type && VALID_FUNDING.has(record.funding_type)) {
    fundingType = record.funding_type as typeof fundingType;
  }

  // Parse deadline
  const deadlineTimestamp = parseDeadlineToTimestamp(record.application_deadline);

  // Determine status from source trust level + field completeness (D-14, D-15, D-16)
  const status = await determineStatus(ctx, [record.source_id], {
    title: record.title,
    description: record.description,
    host_country: record.host_country,
    application_url: record.application_url || record.source_url,
  });

  const scholarshipId = await ctx.db.insert("scholarships", {
    title: record.title.trim(),
    slug,
    description: record.description || undefined,
    provider_organization: record.provider_organization || "Unknown",
    host_country: record.host_country || "International",
    eligibility_nationalities: record.eligibility_nationalities || undefined,
    degree_levels: degreeLevels,
    fields_of_study: record.fields_of_study || undefined,
    funding_type: fundingType,
    funding_tuition: record.funding_tuition || undefined,
    funding_living: record.funding_living || undefined,
    funding_travel: record.funding_travel || undefined,
    funding_insurance: record.funding_insurance || undefined,
    application_deadline: deadlineTimestamp,
    application_deadline_text: record.application_deadline || undefined,
    application_url: record.application_url || record.source_url,
    status,
    source_ids: [record.source_id],
    match_key: matchKey,
    last_verified: Date.now(),
  });

  // Link raw_record to the new scholarship
  if (isPossibleDuplicate) {
    await ctx.db.patch(record._id, {
      canonical_id: scholarshipId,
      match_status: "possible_duplicate" as const,
    });
  } else {
    await ctx.db.patch(record._id, {
      canonical_id: scholarshipId,
      match_status: "new" as const,
    });
  }

  return scholarshipId;
}

// ---------- Helper: Cycle detection (D-09/D-12) ----------

async function handleCycleDetection(ctx: any, scholarshipId: any, record: any, matchKey: string) {
  // Extract year from the raw record
  const deadlineTs = parseDeadlineToTimestamp(record.application_deadline);
  const year = extractYear(record.title, deadlineTs);
  if (year === null) return;

  // Look for other scholarships with the same match_key
  const sameKeyScholarships = await ctx.db
    .query("scholarships")
    .withIndex("by_match_key", (q: any) => q.eq("match_key", matchKey))
    .collect();

  for (const other of sameKeyScholarships) {
    if (other._id === scholarshipId) continue;

    // Extract year from the other scholarship
    const otherYear = extractYear(other.title, other.application_deadline ?? undefined);
    if (otherYear === null || otherYear === year) continue;

    // Different years detected -- link cycles
    if (year > otherYear) {
      // Current is newer -- point current to older, archive older
      await ctx.db.patch(scholarshipId, {
        previous_cycle_id: other._id,
      });
      const reopenMonth = other.application_deadline
        ? computeExpectedReopenMonth([other.application_deadline])
        : null;
      await ctx.db.patch(other._id, {
        status: "archived",
        ...(reopenMonth !== null ? { expected_reopen_month: reopenMonth } : {}),
      });
    } else {
      // Current is older -- point other to current, archive current
      await ctx.db.patch(other._id, {
        previous_cycle_id: scholarshipId,
      });
      const scholarship = await ctx.db.get(scholarshipId);
      const reopenMonth = scholarship?.application_deadline
        ? computeExpectedReopenMonth([scholarship.application_deadline])
        : null;
      await ctx.db.patch(scholarshipId, {
        status: "archived",
        ...(reopenMonth !== null ? { expected_reopen_month: reopenMonth } : {}),
      });
    }
    // Only link to the first different-year match
    break;
  }
}

// ---------- Helper: Auto-archive (D-10/D-11) ----------

async function handleAutoArchive(ctx: any, scholarshipId: any, record: any) {
  const deadlineTs = parseDeadlineToTimestamp(record.application_deadline);
  if (!shouldArchive(deadlineTs)) return;

  const scholarship = await ctx.db.get(scholarshipId);
  if (!scholarship || scholarship.status !== "published") return;

  const reopenMonth = deadlineTs ? computeExpectedReopenMonth([deadlineTs]) : null;

  await ctx.db.patch(scholarshipId, {
    status: "archived",
    ...(reopenMonth !== null ? { expected_reopen_month: reopenMonth } : {}),
  });
}

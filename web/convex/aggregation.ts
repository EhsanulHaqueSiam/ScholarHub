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
import { classifyScholarshipType } from "./classification";
import { wrapDB } from "./triggers";

// Trigger-wrapped internalMutation so scholarship writes fire prestige/search_text triggers
const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

// Valid degree levels and funding types for validation
const VALID_DEGREES = new Set(["bachelor", "master", "phd", "postdoc"]);
const VALID_FUNDING = new Set(["fully_funded", "partial", "tuition_waiver", "stipend_only"]);
const DEFAULT_AGGREGATION_BATCH_SIZE = 10;
const MAX_CANDIDATES_PER_MATCH_KEY = 25;
const MAX_LINKED_RAW_RECORDS_FOR_MERGE = 20;
const AGGREGATION_LOCK_NAME = "aggregation.aggregateBatch";
const AGGREGATION_LOCK_LEASE_MS = 2 * 60 * 1000;
const AGGREGATION_RETRY_DELAY_MS = 3 * 1000;

async function getSourceCategory(
  ctx: any,
  sourceId: any,
  cache: Map<string, string>,
): Promise<string> {
  const key = String(sourceId);
  if (cache.has(key)) return cache.get(key)!;
  const source = await ctx.db.get(sourceId);
  const category = source?.category ?? "aggregator";
  cache.set(key, category);
  return category;
}

async function acquireAggregationLock(
  ctx: any,
  owner: string,
): Promise<{ acquired: boolean; lockId?: any }> {
  const now = Date.now();
  const existing = await ctx.db
    .query("pipeline_locks")
    .withIndex("by_name", (q: any) => q.eq("name", AGGREGATION_LOCK_NAME))
    .first();

  if (!existing) {
    const lockId = await ctx.db.insert("pipeline_locks", {
      name: AGGREGATION_LOCK_NAME,
      owner,
      lease_expires_at: now + AGGREGATION_LOCK_LEASE_MS,
      updated_at: now,
    });
    return { acquired: true, lockId };
  }

  if (existing.lease_expires_at > now && existing.owner !== owner) {
    return { acquired: false, lockId: existing._id };
  }

  await ctx.db.patch(existing._id, {
    owner,
    lease_expires_at: now + AGGREGATION_LOCK_LEASE_MS,
    updated_at: now,
  });
  return { acquired: true, lockId: existing._id };
}

async function releaseAggregationLock(ctx: any, lockId: any, owner: string): Promise<void> {
  if (!lockId) return;
  const existing = await ctx.db.get(lockId);
  if (!existing || existing.owner !== owner) return;
  await ctx.db.patch(lockId, {
    lease_expires_at: 0,
    updated_at: Date.now(),
  });
}

// ---------- Mutation 1: aggregateBatch ----------

export const aggregateBatch = triggeredInternalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
    runId: v.optional(v.id("scrape_runs")),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? DEFAULT_AGGREGATION_BATCH_SIZE, 40));
    const counts = { new: 0, updated: 0, duplicate: 0 };
    const owner = `${args.runId ?? "manual"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const sourceCategoryCache = new Map<string, string>();

    const lock = await acquireAggregationLock(ctx, owner);
    if (!lock.acquired) {
      await ctx.scheduler.runAfter(AGGREGATION_RETRY_DELAY_MS, internal.aggregation.aggregateBatch, {
        cursor: null,
        batchSize,
        runId: args.runId,
      });
      console.log("[aggregation] lock busy, deferred batch");
      return;
    }

    try {

      // Query unpromoted raw_records (canonical_id is undefined) via index to avoid full scans.
      const unpromoted = await ctx.db
        .query("raw_records")
        .withIndex("by_canonical", (q) => q.eq("canonical_id", undefined))
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
          .take(MAX_CANDIDATES_PER_MATCH_KEY);

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

            await mergeIntoScholarship(ctx, target, record, sourceCategoryCache);
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
    } finally {
      await releaseAggregationLock(ctx, lock.lockId, owner);
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

// ---------- Mutation 3: backfillScholarshipTypes ----------

export const backfillScholarshipTypes = triggeredInternalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;

    const scholarships = await ctx.db
      .query("scholarships")
      .filter((q) =>
        q.or(q.eq(q.field("scholarship_type"), undefined), q.eq(q.field("scholarship_type"), null)),
      )
      .take(batchSize);

    for (const scholarship of scholarships) {
      // Look up source category from first source
      let sourceCategory: string | undefined;
      if (scholarship.source_ids.length > 0) {
        const source = await ctx.db.get(scholarship.source_ids[0]);
        sourceCategory = source?.category;
      }

      const scholarshipType = classifyScholarshipType(
        sourceCategory,
        scholarship.tags ?? undefined,
        scholarship.provider_organization,
        scholarship.description,
      );

      await ctx.db.patch(scholarship._id, { scholarship_type: scholarshipType });
    }

    // Schedule next batch if we processed a full batch
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.aggregation.backfillScholarshipTypes, {
        cursor: null,
        batchSize,
      });
    }

    return { processed: scholarships.length };
  },
});

// ---------- Mutation 4: archiveExpired ----------

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

async function mergeIntoScholarship(
  ctx: any,
  scholarship: any,
  record: any,
  sourceCategoryCache: Map<string, string>,
) {
  // Load recent linked raw_records for this scholarship.
  // Keeping this bounded prevents read-limit spikes on long-lived scholarships.
  const linkedRecords = await ctx.db
    .query("raw_records")
    .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarship._id))
    .order("desc")
    .take(MAX_LINKED_RAW_RECORDS_FOR_MERGE);

  // Resolve source categories once per unique source id.
  const sourceCategoryById = new Map<string, string>();
  const linkedSourceIds = [...new Set(linkedRecords.map((lr: any) => String(lr.source_id)))];
  await Promise.all(
    linkedSourceIds.map(async (sourceId) => {
      sourceCategoryById.set(
        sourceId,
        await getSourceCategory(ctx, sourceId, sourceCategoryCache),
      );
    }),
  );
  sourceCategoryById.set(
    String(record.source_id),
    await getSourceCategory(ctx, record.source_id, sourceCategoryCache),
  );

  // Build candidates arrays for trust-weighted field resolution
  type Candidate<T> = {
    value: T | undefined | null;
    category: string;
    scrapedAt: number;
  };

  const titleCandidates: Candidate<string>[] = [];
  const descCandidates: Candidate<string>[] = [];
  const orgCandidates: Candidate<string>[] = [];
  const countryCandidates: Candidate<string>[] = [];
  const appUrlCandidates: Candidate<string>[] = [];
  const awardAmountCandidates: Candidate<string>[] = [];
  const fundingTypeCandidates: Candidate<string>[] = [];
  const deadlineCandidates: Candidate<string>[] = [];

  const pushCandidates = (raw: any, category: string) => {
    const scrapedAt = raw.scraped_at;
    titleCandidates.push({ value: raw.title, category, scrapedAt });
    descCandidates.push({ value: raw.description, category, scrapedAt });
    orgCandidates.push({ value: raw.provider_organization, category, scrapedAt });
    countryCandidates.push({ value: raw.host_country, category, scrapedAt });
    appUrlCandidates.push({ value: raw.application_url, category, scrapedAt });
    awardAmountCandidates.push({ value: raw.award_amount, category, scrapedAt });
    fundingTypeCandidates.push({ value: raw.funding_type, category, scrapedAt });
    deadlineCandidates.push({ value: raw.application_deadline, category, scrapedAt });
  };

  for (const lr of linkedRecords) {
    pushCandidates(lr, sourceCategoryById.get(String(lr.source_id)) ?? "aggregator");
  }
  pushCandidates(record, sourceCategoryById.get(String(record.source_id)) ?? "aggregator");

  // Resolve scalar fields using trust hierarchy
  const resolvedTitle = resolveField(titleCandidates) ?? scholarship.title;
  const resolvedDescription = resolveField(descCandidates) ?? scholarship.description;
  const resolvedOrg = resolveField(orgCandidates) ?? scholarship.provider_organization;
  const resolvedCountry = resolveField(countryCandidates) ?? scholarship.host_country;
  const resolvedAppUrl = resolveField(appUrlCandidates) ?? scholarship.application_url;
  const resolvedAwardAmount = resolveField(awardAmountCandidates);
  const resolvedFundingType = resolveField(fundingTypeCandidates) ?? scholarship.funding_type;
  const resolvedDeadlineStr = resolveField(deadlineCandidates);

  // Merge arrays and booleans in one pass to minimize work/read amplification.
  const allDegrees = new Set<string>(scholarship.degree_levels ?? []);
  const allNationalities = new Set<string>(scholarship.eligibility_nationalities ?? []);
  const allFields = new Set<string>(scholarship.fields_of_study ?? []);
  let fundingTuition = Boolean(scholarship.funding_tuition);
  let fundingLiving = Boolean(scholarship.funding_living);
  let fundingTravel = Boolean(scholarship.funding_travel);
  let fundingInsurance = Boolean(scholarship.funding_insurance);
  let fundingBooks = Boolean(scholarship.funding_books);
  let fundingResearch = Boolean(scholarship.funding_research);

  const absorbRawRecord = (raw: any) => {
    for (const d of (raw.degree_levels as string[]) ?? []) allDegrees.add(d);
    for (const n of raw.eligibility_nationalities ?? []) allNationalities.add(n);
    for (const f of raw.fields_of_study ?? []) allFields.add(f);

    fundingTuition = fundingTuition || Boolean(raw.funding_tuition);
    fundingLiving = fundingLiving || Boolean(raw.funding_living);
    fundingTravel = fundingTravel || Boolean(raw.funding_travel);
    fundingInsurance = fundingInsurance || Boolean(raw.funding_insurance);
    fundingBooks = fundingBooks || Boolean(raw.funding_books);
    fundingResearch = fundingResearch || Boolean(raw.funding_research);
  };

  for (const lr of linkedRecords) absorbRawRecord(lr);
  absorbRawRecord(record);

  const mergedDegrees = [...allDegrees].filter((d) => VALID_DEGREES.has(d)) as Array<
    "bachelor" | "master" | "phd" | "postdoc"
  >;

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
    funding_books: fundingBooks || undefined,
    funding_research: fundingResearch || undefined,
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

  // Classify scholarship type from source category, tags, and provider name
  const source = await ctx.db.get(record.source_id);
  const sourceCategory = source?.category;
  const scholarshipType = classifyScholarshipType(
    sourceCategory,
    undefined, // raw_records don't have tags; trigger will re-classify when tags are auto-generated
    record.provider_organization || "Unknown",
    record.description,
  );

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
    funding_books: record.funding_books || undefined,
    funding_research: record.funding_research || undefined,
    scholarship_type: scholarshipType,
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
    .take(MAX_CANDIDATES_PER_MATCH_KEY);

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

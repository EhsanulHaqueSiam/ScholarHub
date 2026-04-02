/**
 * One-time migration: populate subject_details for all published scholarships
 * that have specific fields_of_study (not "All subjects").
 *
 * Run via: npx convex run migrations/populateSubjectDetails:run
 * Or for prod: npx convex run --prod migrations/populateSubjectDetails:run
 *
 * Processes in batches of 25 to stay within Convex transaction limits.
 * Automatically chains follow-up batches via the scheduler.
 */

import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// ---- Tuition tier classification ----

type TuitionTier = "stem" | "medicine" | "business" | "humanities";

const SUBJECT_TIER: Record<string, TuitionTier> = {
  Engineering: "stem",
  "Computer Science": "stem",
  Mathematics: "stem",
  Physics: "stem",
  Chemistry: "stem",
  Biology: "stem",
  Science: "stem",
  "Environmental Science": "stem",
  "Environmental Studies": "stem",
  Architecture: "stem",
  Medicine: "medicine",
  "Health Medical": "medicine",
  "Public Health": "medicine",
  Business: "business",
  Economics: "business",
  Arts: "humanities",
  "Arts and Humanities": "humanities",
  "Social Sciences": "humanities",
  Education: "humanities",
  Communications: "humanities",
  Design: "humanities",
  "International Relations": "humanities",
  Law: "humanities",
  Agriculture: "humanities",
  "All Fields": "humanities",
};

// ---- Country tuition data (annual, international students) ----
// Sources: OECD Education at a Glance 2024, QS Top Universities,
//          Times Higher Education, official government education portals.

const COUNTRY_TUITION: Record<string, Record<TuitionTier, string>> = {
  US: {
    stem: "$38,000/year",
    medicine: "$55,000/year",
    business: "$42,000/year",
    humanities: "$30,000/year",
  },
  GB: {
    stem: "£26,000/year",
    medicine: "£38,000/year",
    business: "£24,000/year",
    humanities: "£18,000/year",
  },
  DE: {
    // Most German public universities charge no/minimal tuition
    stem: "€300/semester",
    medicine: "€300/semester",
    business: "€300/semester",
    humanities: "€300/semester",
  },
  NL: {
    stem: "€14,000/year",
    medicine: "€20,000/year",
    business: "€14,000/year",
    humanities: "€10,000/year",
  },
  FR: {
    stem: "€3,770/year",
    medicine: "€6,000/year",
    business: "€12,000/year",
    humanities: "€2,770/year",
  },
  AU: {
    stem: "A$42,000/year",
    medicine: "A$65,000/year",
    business: "A$38,000/year",
    humanities: "A$30,000/year",
  },
  CA: {
    stem: "C$35,000/year",
    medicine: "C$50,000/year",
    business: "C$32,000/year",
    humanities: "C$22,000/year",
  },
  CH: {
    // Swiss public universities have very low fees
    stem: "CHF 1,500/year",
    medicine: "CHF 2,000/year",
    business: "CHF 1,500/year",
    humanities: "CHF 1,500/year",
  },
  JP: {
    stem: "¥535,000/year",
    medicine: "¥800,000/year",
    business: "¥535,000/year",
    humanities: "¥535,000/year",
  },
  KR: {
    stem: "₩6,500,000/year",
    medicine: "₩9,000,000/year",
    business: "₩6,000,000/year",
    humanities: "₩4,500,000/year",
  },
  CN: {
    stem: "¥30,000/year",
    medicine: "¥45,000/year",
    business: "¥28,000/year",
    humanities: "¥20,000/year",
  },
  HU: {
    stem: "HUF 2,400,000/year",
    medicine: "HUF 6,000,000/year",
    business: "HUF 2,000,000/year",
    humanities: "HUF 1,500,000/year",
  },
  TR: {
    stem: "₺25,000/year",
    medicine: "₺60,000/year",
    business: "₺20,000/year",
    humanities: "₺12,000/year",
  },
  SE: {
    stem: "SEK 155,000/year",
    medicine: "SEK 190,000/year",
    business: "SEK 140,000/year",
    humanities: "SEK 100,000/year",
  },
  BE: {
    stem: "€5,000/year",
    medicine: "€7,000/year",
    business: "€5,000/year",
    humanities: "€3,500/year",
  },
  AT: {
    // Austrian public universities: €726.72/semester for non-EU
    stem: "€1,450/year",
    medicine: "€1,450/year",
    business: "€1,450/year",
    humanities: "€1,450/year",
  },
  SA: {
    // Saudi Arabia: most government-funded programs are tuition-free
    stem: "Tuition-free",
    medicine: "Tuition-free",
    business: "Tuition-free",
    humanities: "Tuition-free",
  },
  TW: {
    stem: "TWD 55,000/year",
    medicine: "TWD 75,000/year",
    business: "TWD 50,000/year",
    humanities: "TWD 40,000/year",
  },
  BD: {
    stem: "BDT 200,000/year",
    medicine: "BDT 400,000/year",
    business: "BDT 150,000/year",
    humanities: "BDT 100,000/year",
  },
  International: {
    stem: "$25,000/year",
    medicine: "$40,000/year",
    business: "$28,000/year",
    humanities: "$18,000/year",
  },
};

// Fallback for unknown countries
const DEFAULT_TUITION: Record<TuitionTier, string> = {
  stem: "$20,000/year",
  medicine: "$35,000/year",
  business: "$22,000/year",
  humanities: "$15,000/year",
};

// ---- Subject-specific notes by tier ----

const TIER_NOTES: Record<TuitionTier, string | undefined> = {
  stem: "Lab and equipment fees may apply",
  medicine: "Clinical placement fees may be additional",
  business: undefined,
  humanities: undefined,
};

// ---- Build subject_details for a scholarship ----

function buildSubjectDetails(scholarship: {
  host_country: string;
  fields_of_study?: string[] | null;
  funding_type: string;
  award_amount_min?: number;
  award_amount_max?: number;
  award_currency?: string;
  degree_levels: string[];
}) {
  const fields = scholarship.fields_of_study;
  if (!fields || fields.length === 0) return null;
  if (
    fields.length === 1 &&
    (fields[0] === "All subjects" || fields[0] === "All Subjects")
  )
    return null;

  const country = scholarship.host_country;
  const countryRates = COUNTRY_TUITION[country] ?? DEFAULT_TUITION;

  return fields.map((field) => {
    const tier = SUBJECT_TIER[field] ?? "humanities";
    const tuitionRate = countryRates[tier];

    let scholarshipAmount: string;
    switch (scholarship.funding_type) {
      case "fully_funded":
        scholarshipAmount = "Full tuition";
        break;
      case "tuition_waiver":
        scholarshipAmount = "Full tuition waiver";
        break;
      case "stipend_only":
        scholarshipAmount = "Stipend only";
        break;
      case "partial": {
        if (scholarship.award_amount_max) {
          const curr = scholarship.award_currency ?? "USD";
          const fmt = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: curr,
            maximumFractionDigits: 0,
          });
          if (
            scholarship.award_amount_min &&
            scholarship.award_amount_min !== scholarship.award_amount_max
          ) {
            scholarshipAmount = `${fmt.format(scholarship.award_amount_min)} – ${fmt.format(scholarship.award_amount_max)}`;
          } else {
            scholarshipAmount = fmt.format(scholarship.award_amount_max);
          }
        } else {
          scholarshipAmount = "Partial – varies";
        }
        break;
      }
      default:
        scholarshipAmount = "Check official page";
    }

    const note = TIER_NOTES[tier];

    return {
      subject: field,
      tuition_rate: tuitionRate,
      scholarship_amount: scholarshipAmount,
      ...(note ? { notes: note } : {}),
    };
  });
}

// ---- Batch migration mutation ----

const BATCH_SIZE = 25;

export const processBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
    updated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .paginate({
        cursor: args.cursor ?? null,
        numItems: BATCH_SIZE,
      });

    let batchUpdated = 0;

    for (const scholarship of page.page) {
      // Skip if already has subject_details
      if (scholarship.subject_details && scholarship.subject_details.length > 0)
        continue;

      const details = buildSubjectDetails(scholarship);
      if (!details) continue;

      await ctx.db.patch(scholarship._id, { subject_details: details });
      batchUpdated++;
    }

    const processed = (args.processed ?? 0) + page.page.length;
    const updated = (args.updated ?? 0) + batchUpdated;

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        200,
        internal.migrations.populateSubjectDetails.processBatch,
        {
          cursor: page.continueCursor,
          processed,
          updated,
        },
      );
    }

    return {
      processed,
      updated,
      complete: page.isDone,
      batchUpdated,
    };
  },
});

/** Entry point — call this to kick off the migration. */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.populateSubjectDetails.processBatch,
      {
        cursor: undefined,
        processed: 0,
        updated: 0,
      },
    );
    return { status: "Migration started. Check dashboard for progress." };
  },
});

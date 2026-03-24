import { query } from "./_generated/server";
import { v } from "convex/values";
import { degreeLevelValidator } from "./schema";

const SCAN_CAP = 600;

/**
 * Lightweight count query for live wizard updates (D-07).
 *
 * Returns the number of published, non-expired scholarships matching
 * the user's nationality, degree level, and fields of study.
 * All args are optional so partial profiles (mid-wizard) still return counts.
 */
export const getMatchCount = query({
  args: {
    nationalities: v.optional(v.array(v.string())),
    degreeLevels: v.optional(v.array(degreeLevelValidator)),
    fieldsOfStudy: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await ctx.db
      .query("scholarships")
      .withIndex("by_status_deadline", (q) => q.eq("status", "published"))
      .take(SCAN_CAP);

    let count = 0;
    for (const s of results) {
      // Exclude expired
      if (s.application_deadline && s.application_deadline < now) continue;

      // Nationality filter: if user provided nationalities, check eligibility
      if (args.nationalities && args.nationalities.length > 0) {
        if (s.eligibility_nationalities && s.eligibility_nationalities.length > 0) {
          if (!args.nationalities.some((n) => s.eligibility_nationalities!.includes(n))) continue;
        }
        // If scholarship has no nationality restrictions, it passes (open to all)
      }

      // Degree filter: if user provided degree levels
      if (args.degreeLevels && args.degreeLevels.length > 0) {
        if (s.degree_levels && s.degree_levels.length > 0) {
          if (!args.degreeLevels.some((d) => s.degree_levels.includes(d))) continue;
        }
      }

      // Field filter: if user provided fields of study
      if (args.fieldsOfStudy && args.fieldsOfStudy.length > 0) {
        if (s.fields_of_study && s.fields_of_study.length > 0) {
          if (!args.fieldsOfStudy.some((f) => s.fields_of_study!.includes(f))) continue;
        }
      }

      count++;
    }

    return { count };
  },
});

/**
 * Returns lean scholarship summaries for client-side scoring (D-20 hybrid compute).
 *
 * Server-side: filters by status=published, excludes expired, filters nationality + degree.
 * Client-side: scoring engine handles field, funding, demographics scoring.
 *
 * The returned shape matches the EligibilitySummary interface from
 * web/src/lib/eligibility/types.ts for direct consumption by the scoring engine.
 */
export const getEligibleScholarships = query({
  args: {
    nationalities: v.array(v.string()),
    degreeLevels: v.array(degreeLevelValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await ctx.db
      .query("scholarships")
      .withIndex("by_status_deadline", (q) => q.eq("status", "published"))
      .take(SCAN_CAP);

    return results
      .filter((s) => {
        // Exclude expired per D-21
        if (s.application_deadline && s.application_deadline < now) return false;
        // Nationality: open-to-all or matches
        const natMatch =
          !s.eligibility_nationalities ||
          s.eligibility_nationalities.length === 0 ||
          args.nationalities.some((n) => s.eligibility_nationalities!.includes(n));
        // Degree: matches at least one
        const degMatch =
          !s.degree_levels ||
          s.degree_levels.length === 0 ||
          args.degreeLevels.some((d) => s.degree_levels.includes(d));
        return natMatch && degMatch;
      })
      .map((s) => ({
        _id: s._id,
        title: s.title,
        slug: s.slug ?? "",
        host_countries: [s.host_country],
        degree_levels: s.degree_levels ?? [],
        fields_of_study: s.fields_of_study,
        funding_type: s.funding_type,
        eligibility_nationalities: s.eligibility_nationalities,
        application_deadline: s.application_deadline,
        prestige_tier: s.prestige_tier ?? "unranked",
        scholarship_type: s.scholarship_type,
        funding_amount:
          s.award_amount_max != null
            ? `${s.award_currency ?? ""}${s.award_amount_max}`.trim()
            : undefined,
        language_requirements: s.study_info?.lang_ielts
          ? `IELTS ${s.study_info.lang_ielts}`
          : undefined,
        gender_requirement: undefined as string | undefined,
        source_name: undefined as string | undefined,
      }));
  },
});

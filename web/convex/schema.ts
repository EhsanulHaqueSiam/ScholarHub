import { defineSchema, defineTable } from "convex/server";
import { type Infer, v } from "convex/values";

// ---- Reusable Validators ----

export const degreeLevelValidator = v.union(
  v.literal("bachelor"),
  v.literal("master"),
  v.literal("phd"),
  v.literal("postdoc"),
);
export type DegreeLevel = Infer<typeof degreeLevelValidator>;

export const fundingTypeValidator = v.union(
  v.literal("fully_funded"),
  v.literal("partial"),
  v.literal("tuition_waiver"),
  v.literal("stipend_only"),
);
export type FundingType = Infer<typeof fundingTypeValidator>;

export const sourceCategoryValidator = v.union(
  v.literal("official_program"),
  v.literal("university"),
  v.literal("aggregator"),
  v.literal("government"),
  v.literal("foundation"),
);
export type SourceCategory = Infer<typeof sourceCategoryValidator>;

export const trustLevelValidator = v.union(
  v.literal("auto_publish"),
  v.literal("needs_review"),
  v.literal("blocked"),
);
export type TrustLevel = Infer<typeof trustLevelValidator>;

export const scholarshipStatusValidator = v.union(
  v.literal("draft"),
  v.literal("pending_review"),
  v.literal("published"),
  v.literal("rejected"),
  v.literal("archived"),
);
export type ScholarshipStatus = Infer<typeof scholarshipStatusValidator>;

export const scrapeMethodValidator = v.union(
  v.literal("api"),
  v.literal("scrape"),
  v.literal("scrapling"),
  v.literal("rss"),
);
export type ScrapeMethod = Infer<typeof scrapeMethodValidator>;

// ---- Schema Definition ----

export default defineSchema({
  // Source catalog -- where scholarship data comes from
  sources: defineTable({
    name: v.string(),
    url: v.string(),
    category: sourceCategoryValidator,
    scrape_method: scrapeMethodValidator,
    trust_level: trustLevelValidator,
    scrape_frequency_hours: v.number(),
    last_scraped: v.optional(v.number()),
    consecutive_failures: v.number(),
    geographic_coverage: v.optional(v.array(v.string())),
    data_quality_rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    is_active: v.boolean(),
    wave: v.optional(v.number()),
    auth_required: v.optional(v.boolean()),
    has_api: v.optional(v.boolean()),
    estimated_volume: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_trust_level", ["trust_level"])
    .index("by_active_category", ["is_active", "category"])
    .index("by_url", ["url"])
    .index("by_wave", ["wave"])
    .index("by_active_wave", ["is_active", "wave"]),

  // Raw scraped records -- staging area before aggregation
  raw_records: defineTable({
    source_id: v.id("sources"),
    external_id: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    provider_organization: v.optional(v.string()),
    host_country: v.optional(v.string()),
    eligibility_nationalities: v.optional(v.array(v.string())),
    degree_levels: v.optional(v.array(degreeLevelValidator)),
    fields_of_study: v.optional(v.array(v.string())),
    funding_type: v.optional(fundingTypeValidator),
    funding_tuition: v.optional(v.boolean()),
    funding_living: v.optional(v.boolean()),
    funding_travel: v.optional(v.boolean()),
    funding_insurance: v.optional(v.boolean()),
    award_amount: v.optional(v.string()),
    award_currency: v.optional(v.string()),
    application_deadline: v.optional(v.string()),
    application_url: v.optional(v.string()),
    source_url: v.string(),
    scraped_at: v.number(),
    raw_data: v.optional(v.string()),
    canonical_id: v.optional(v.id("scholarships")),
    scrape_run_id: v.optional(v.string()),
  })
    .index("by_source", ["source_id"])
    .index("by_canonical", ["canonical_id"])
    .index("by_source_external", ["source_id", "external_id"])
    .index("by_scrape_run", ["scrape_run_id"]),

  // Canonical scholarships -- merged, deduplicated, publishable
  scholarships: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    provider_organization: v.string(),
    host_country: v.string(),
    eligibility_nationalities: v.optional(v.array(v.string())),
    degree_levels: v.array(degreeLevelValidator),
    fields_of_study: v.optional(v.array(v.string())),
    funding_type: fundingTypeValidator,
    funding_tuition: v.optional(v.boolean()),
    funding_living: v.optional(v.boolean()),
    funding_travel: v.optional(v.boolean()),
    funding_insurance: v.optional(v.boolean()),
    award_amount_min: v.optional(v.number()),
    award_amount_max: v.optional(v.number()),
    award_currency: v.optional(v.string()),
    application_deadline: v.optional(v.number()),
    application_deadline_text: v.optional(v.string()),
    application_url: v.optional(v.string()),
    status: scholarshipStatusValidator,
    editorial_notes: v.optional(v.string()),
    source_ids: v.array(v.id("sources")),
    last_verified: v.optional(v.number()),
    previous_cycle_id: v.optional(v.id("scholarships")),
    expected_reopen_month: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_country_status", ["host_country", "status"])
    .index("by_funding_status", ["funding_type", "status"])
    .index("by_deadline", ["application_deadline"])
    .index("by_status_deadline", ["status", "application_deadline"])
    .index("by_country_deadline", ["host_country", "application_deadline"])
    .index("by_slug", ["slug"])
    .searchIndex("search_title_description", {
      searchField: "title",
      filterFields: ["status", "host_country", "funding_type"],
    }),
});

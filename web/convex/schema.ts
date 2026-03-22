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

export const prestigeTierValidator = v.union(
  v.literal("gold"),
  v.literal("silver"),
  v.literal("bronze"),
  v.literal("unranked"),
);
export type PrestigeTier = Infer<typeof prestigeTierValidator>;

export const scrapeMethodValidator = v.union(
  v.literal("api"),
  v.literal("scrape"),
  v.literal("scrapling"),
  v.literal("rss"),
  v.literal("jsonld"),
  v.literal("ajax"),
  v.literal("inertia"),
);
export type ScrapeMethod = Infer<typeof scrapeMethodValidator>;

export const scrapeRunStatusValidator = v.union(
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);
export type ScrapeRunStatus = Infer<typeof scrapeRunStatusValidator>;

export const sourceHealthStatusValidator = v.union(
  v.literal("healthy"),
  v.literal("degraded"),
  v.literal("failing"),
  v.literal("deactivated"),
);
export type SourceHealthStatus = Infer<typeof sourceHealthStatusValidator>;

export const sourceResultStatusValidator = v.union(
  v.literal("success"),
  v.literal("failed"),
  v.literal("skipped"),
);
export type SourceResultStatus = Infer<typeof sourceResultStatusValidator>;

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
    .index("by_active_wave", ["is_active", "wave"])
    .index("by_name", ["name"]),

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
    scrape_run_id: v.optional(v.id("scrape_runs")),
    quality_flags: v.optional(v.array(v.string())),
    match_status: v.optional(
      v.union(v.literal("matched"), v.literal("possible_duplicate"), v.literal("new")),
    ),
    last_verified: v.optional(v.number()),
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
    // Per-scholarship study info (admin-editable, overrides static country data)
    study_info: v.optional(
      v.object({
        tuition_undergrad: v.optional(v.string()),
        tuition_postgrad: v.optional(v.string()),
        tuition_phd: v.optional(v.string()),
        tuition_mba: v.optional(v.string()),
        living_cost_note: v.optional(v.string()),
        cost_accommodation: v.optional(v.string()),
        cost_food: v.optional(v.string()),
        cost_transport: v.optional(v.string()),
        cost_utilities: v.optional(v.string()),
        admission_requirements: v.optional(v.string()),
        lang_ielts: v.optional(v.string()),
        lang_toefl: v.optional(v.string()),
        lang_pte: v.optional(v.string()),
        visa_documents: v.optional(v.string()),
        intake_main_name: v.optional(v.string()),
        intake_main_months: v.optional(v.string()),
        intake_secondary_name: v.optional(v.string()),
        intake_secondary_months: v.optional(v.string()),
        post_study_visa: v.optional(v.string()),
        post_study_duration: v.optional(v.string()),
        post_study_description: v.optional(v.string()),
      }),
    ),
    prestige_tier: v.optional(prestigeTierValidator),
    prestige_score: v.optional(v.number()),
    search_text: v.optional(v.string()),
    match_key: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_country_status", ["host_country", "status"])
    .index("by_funding_status", ["funding_type", "status"])
    .index("by_deadline", ["application_deadline"])
    .index("by_status_deadline", ["status", "application_deadline"])
    .index("by_country_deadline", ["host_country", "application_deadline"])
    .index("by_slug", ["slug"])
    .index("by_prestige_status", ["prestige_tier", "status"])
    .index("by_match_key", ["match_key"])
    .index("by_status_prestige_deadline", ["status", "prestige_tier", "application_deadline"])
    .searchIndex("search_scholarships", {
      searchField: "search_text",
      filterFields: ["status", "host_country", "funding_type", "prestige_tier"],
    }),

  // Scrape run tracking -- one entry per pipeline execution
  scrape_runs: defineTable({
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    status: scrapeRunStatusValidator,
    triggered_by: v.string(),
    sources_targeted: v.number(),
    sources_completed: v.number(),
    sources_failed: v.number(),
    records_inserted: v.number(),
    records_updated: v.number(),
    records_unchanged: v.number(),
    duration_seconds: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_started_at", ["started_at"]),

  // Source health tracking -- monitors reliability per source
  source_health: defineTable({
    source_id: v.id("sources"),
    status: sourceHealthStatusValidator,
    consecutive_failures: v.number(),
    last_success: v.optional(v.number()),
    last_failure: v.optional(v.number()),
    last_yield: v.optional(v.number()),
    avg_yield: v.optional(v.number()),
    yield_trend: v.optional(v.string()),
    last_error_type: v.optional(v.string()),
    last_error_message: v.optional(v.string()),
    github_issue_number: v.optional(v.number()),
    deactivation_reason: v.optional(v.string()),
  })
    .index("by_source", ["source_id"])
    .index("by_status", ["status"]),

  // Per-source results within a scrape run
  scrape_run_sources: defineTable({
    run_id: v.id("scrape_runs"),
    source_id: v.id("sources"),
    status: sourceResultStatusValidator,
    method_used: scrapeMethodValidator,
    records_found: v.number(),
    records_new: v.number(),
    records_updated: v.number(),
    records_unchanged: v.number(),
    duration_seconds: v.number(),
    bytes_downloaded: v.optional(v.number()),
    error_type: v.optional(v.string()),
    error_message: v.optional(v.string()),
    fallback_used: v.optional(v.boolean()),
  })
    .index("by_run", ["run_id"])
    .index("by_source", ["source_id"])
    .index("by_run_source", ["run_id", "source_id"]),

  // Field-level change log for audit trail
  change_log: defineTable({
    record_id: v.id("raw_records"),
    source_id: v.id("sources"),
    run_id: v.id("scrape_runs"),
    changed_at: v.number(),
    field_name: v.string(),
    old_value: v.optional(v.string()),
    new_value: v.optional(v.string()),
  })
    .index("by_record", ["record_id"])
    .index("by_source", ["source_id"])
    .index("by_changed_at", ["changed_at"]),

  // Admin revision history for scholarship edits
  scholarship_revisions: defineTable({
    scholarship_id: v.id("scholarships"),
    field_name: v.string(),
    old_value: v.optional(v.string()),
    new_value: v.optional(v.string()),
    changed_at: v.number(),
    changed_by: v.optional(v.string()),
  })
    .index("by_scholarship", ["scholarship_id", "changed_at"])
    .index("by_changed_at", ["changed_at"]),
});

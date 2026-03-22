/**
 * Seed mutation for 10 launch collections (D-95, D-96, D-97).
 *
 * Idempotent: checks if collections table is empty before seeding.
 * Each collection gets appropriate filter criteria, default sort, and featured flag.
 */

import { internalMutation } from "./_generated/server";

const SEED_COLLECTIONS = [
  {
    name: "Top Fully Funded",
    emoji: "\u{1F4B0}",
    slug: "top-fully-funded",
    funding_types: ["fully_funded"] as const,
    default_sort: "prestige",
    is_featured: true,
    sort_order: 1,
    description:
      "The best fully funded scholarships covering tuition, living expenses, and more.",
  },
  {
    name: "Study in Europe",
    emoji: "\u{1F30D}",
    slug: "study-in-europe",
    host_countries: [
      "DE",
      "FR",
      "NL",
      "SE",
      "DK",
      "NO",
      "FI",
      "AT",
      "BE",
      "IE",
      "IT",
      "ES",
      "CH",
      "PL",
      "CZ",
      "PT",
    ],
    default_sort: "deadline",
    is_featured: true,
    sort_order: 2,
    description: "Scholarships for studying in European countries.",
  },
  {
    name: "Study in Asia",
    emoji: "\u{1F30F}",
    slug: "study-in-asia",
    host_countries: ["JP", "KR", "CN", "SG", "IN", "MY", "TH", "TW"],
    default_sort: "deadline",
    is_featured: true,
    sort_order: 3,
    description: "Scholarships for studying in Asian countries.",
  },
  {
    name: "Study in North America",
    emoji: "\u{1F30E}",
    slug: "study-in-north-america",
    host_countries: ["US", "CA"],
    default_sort: "deadline",
    is_featured: true,
    sort_order: 4,
    description: "Scholarships for studying in the US and Canada.",
  },
  {
    name: "No GRE Required",
    emoji: "\u{1F4DA}",
    slug: "no-gre-required",
    tags: ["no_gre"],
    default_sort: "deadline",
    is_featured: true,
    sort_order: 5,
    description: "Scholarships that don't require GRE scores.",
  },
  {
    name: "STEM Scholarships",
    emoji: "\u{1F52C}",
    slug: "stem-scholarships",
    tags: ["stem"],
    default_sort: "prestige",
    is_featured: true,
    sort_order: 6,
    description:
      "Scholarships for science, technology, engineering, and mathematics.",
  },
  {
    name: "Government Scholarships",
    emoji: "\u{1F3C6}",
    slug: "government-scholarships",
    tags: ["government"],
    default_sort: "prestige",
    is_featured: false,
    sort_order: 7,
    description: "Scholarships funded by national governments worldwide.",
  },
  {
    name: "For Women",
    emoji: "\u{1F469}\u{200D}\u{1F393}",
    slug: "for-women",
    tags: ["women_only"],
    default_sort: "deadline",
    is_featured: false,
    sort_order: 8,
    description:
      "Scholarships exclusively for women and female applicants.",
  },
  {
    name: "Closing This Month",
    emoji: "\u{231B}",
    slug: "closing-this-month",
    // deadline_before/after set dynamically at seed time
    default_sort: "deadline",
    is_featured: false,
    sort_order: 9,
    description: "Scholarships with deadlines approaching this month.",
  },
  {
    name: "Recently Added",
    emoji: "\u{2728}",
    slug: "recently-added",
    // added_since set dynamically at seed time
    default_sort: "newest",
    is_featured: false,
    sort_order: 10,
    description: "The latest scholarships added to ScholarHub.",
  },
] as const;

/**
 * Seed 10 launch collections. Idempotent -- skips if collections already exist.
 */
export const seedCollections = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if collections already exist (idempotent)
    const existing = await ctx.db.query("collections").first();
    if (existing) {
      return { seeded: false, reason: "Collections already exist" };
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    for (const seed of SEED_COLLECTIONS) {
      const doc: Record<string, unknown> = {
        name: seed.name,
        slug: seed.slug,
        emoji: seed.emoji,
        description: seed.description,
        status: "active" as const,
        is_featured: seed.is_featured,
        sort_order: seed.sort_order,
        default_sort: seed.default_sort,
        scholarship_count: 0,
        view_count: 0,
        created_at: now,
        updated_at: now,
      };

      // Set filter criteria per collection type
      if ("funding_types" in seed && seed.funding_types) {
        doc.funding_types = [...seed.funding_types];
      }
      if ("host_countries" in seed && seed.host_countries) {
        doc.host_countries = [...seed.host_countries];
      }
      if ("tags" in seed && seed.tags) {
        doc.tags = [...seed.tags];
      }

      // Dynamic time-based criteria
      if (seed.slug === "closing-this-month") {
        doc.deadline_after = now;
        doc.deadline_before = now + thirtyDays;
      }
      if (seed.slug === "recently-added") {
        doc.added_since = now - thirtyDays;
      }

      await ctx.db.insert("collections", doc as any);
    }

    return { seeded: true, count: SEED_COLLECTIONS.length };
  },
});

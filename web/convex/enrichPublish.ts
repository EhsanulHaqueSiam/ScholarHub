/**
 * Batch enrichment and publish mutation for pending_review scholarships.
 *
 * Processes scholarships in small batches:
 * - Infers host_country from application URL domain
 * - Infers provider_organization from domain
 * - Generates tags from title/description keywords
 * - Parses application_deadline from deadline text
 * - Extracts award amounts from linked raw_records
 * - Computes match_key for dedup
 * - Publishes (sets status to "published")
 *
 * Self-schedules next batch until target count is reached.
 */

import { v } from "convex/values";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internal } from "./_generated/api";
import { internalMutation as rawInternalMutation } from "./_generated/server";
import { computeMatchKey, parseDeadlineToTimestamp } from "./aggregationHelpers";
import { wrapDB } from "./triggers";

const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

// Batch size tuned for Convex free-tier read limits
const ENRICH_BATCH_SIZE = 8;

// ---- Domain -> Country Code mapping ----

const TLD_COUNTRY: Record<string, string> = {
  au: "AU",
  uk: "GB",
  nz: "NZ",
  sg: "SG",
  jp: "JP",
  cn: "CN",
  kr: "KR",
  my: "MY",
  de: "DE",
  fr: "FR",
  nl: "NL",
  se: "SE",
  no: "NO",
  dk: "DK",
  fi: "FI",
  ch: "CH",
  ca: "CA",
  in: "IN",
  ph: "PH",
  ie: "IE",
  it: "IT",
  es: "ES",
  pt: "PT",
  at: "AT",
  be: "BE",
  br: "BR",
  mx: "MX",
  za: "ZA",
  ng: "NG",
  ke: "KE",
  gh: "GH",
  th: "TH",
  vn: "VN",
  tw: "TW",
  hk: "HK",
  id: "ID",
  pk: "PK",
  bd: "BD",
  lk: "LK",
  np: "NP",
};

// Known .edu domains that are NOT US-based (e.g., Australian universities using .edu)
const NON_US_EDU_DOMAINS: Record<string, string> = {
  "www.monash.edu": "AU",
  "monash.edu": "AU",
};

function inferCountryFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Check specific domain overrides first
    if (NON_US_EDU_DOMAINS[hostname]) return NON_US_EDU_DOMAINS[hostname];

    // Check for country-coded TLDs (e.g., .edu.au, .ac.uk, .co.nz)
    const parts = hostname.split(".");
    const tld = parts[parts.length - 1];

    if (TLD_COUNTRY[tld]) return TLD_COUNTRY[tld];

    // .edu with no country TLD = US
    if (tld === "edu" || tld === "gov") return "US";

    // Special domains
    if (hostname.includes("studyaustralia")) return "AU";

    return null;
  } catch {
    return null;
  }
}

// ---- Domain -> Organization mapping ----

const DOMAIN_ORG: Record<string, string> = {
  "study.anu.edu.au": "Australian National University",
  "scholarships.unimelb.edu.au": "University of Melbourne",
  "law.unimelb.edu.au": "University of Melbourne",
  "www.monash.edu": "Monash University",
  "www.qut.edu.au": "Queensland University of Technology",
  "www.deakin.edu.au": "Deakin University",
  "www.uts.edu.au": "University of Technology Sydney",
  "scholarships.uq.edu.au": "University of Queensland",
  "www.uow.edu.au": "University of Wollongong",
  "www.mq.edu.au": "Macquarie University",
  "www.ecu.edu.au": "Edith Cowan University",
  "www.sydney.edu.au": "University of Sydney",
  "www.une.edu.au": "University of New England",
  "www.swinburne.edu.au": "Swinburne University of Technology",
  "www.griffith.edu.au": "Griffith University",
  "www.flinders.edu.au": "Flinders University",
  "researchdegrees.uwa.edu.au": "University of Western Australia",
  "www.uwa.edu.au": "University of Western Australia",
  "www.canberra.edu.au": "University of Canberra",
  "www.think.edu.au": "Think Education Group",
  "www.avondale.edu.au": "Avondale University",
  "www.scu.edu.au": "Southern Cross University",
  "scholarships.curtin.edu.au": "Curtin University",
  "www.latrobe.edu.au": "La Trobe University",
  "www.latrobecollegeaustralia.edu.au": "La Trobe College Australia",
  "www.jcu.edu.au": "James Cook University",
  "www.murdoch.edu.au": "Murdoch University",
  "www.newcastle.edu.au": "University of Newcastle",
  "www.notredame.edu.au": "University of Notre Dame Australia",
  "www.scholarships.unsw.edu.au": "University of New South Wales",
  "www.csu.edu.au": "Charles Sturt University",
  "www.cqu.edu.au": "CQUniversity",
  "www.usc.edu.au": "University of the Sunshine Coast",
  "www.utas.edu.au": "University of Tasmania",
  "www.unisq.edu.au": "University of Southern Queensland",
  "www.torrens.edu.au": "Torrens University Australia",
  "www.tafensw.edu.au": "TAFE NSW",
  "www.angliss.edu.au": "William Angliss Institute",
  "www.bluemountains.edu.au": "Blue Mountains International Hotel Management School",
  "utscollege.edu.au": "UTS College",
  "sibt.nsw.edu.au": "Sydney Institute of Business and Technology",
  "aim.edu.au": "Australian Institute of Music",
  "bond.edu.au": "Bond University",
  "chs.edu.au": "Curtin Heritage School",
  "federation.edu.au": "Federation University Australia",
  "ikon.edu.au": "IKON Institute of Australia",
  "international.collarts.edu.au": "Collarts",
  "kent.edu.au": "Kent Institute Australia",
  "moore.edu.au": "Moore Theological College",
  "rgit.edu.au": "Royal Gurkhas Institute of Technology",
  "sae.edu.au": "SAE Creative Media Institute",
  "sheridan.edu.au": "Sheridan College Australia",
  "www.ac.edu.au": "Australian College",
  "www.heli.edu.au": "Higher Education Leadership Institute",
  "www.imc.edu.au": "International Management College",
  "www.oranacollege.com.au": "Orana College",
  "www.uowcollege.edu.au": "UOW College",
  "threadheads.com.au": "Threadheads",
  "search.studyaustralia.gov.au": "Study Australia",
};

function inferOrgFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return DOMAIN_ORG[hostname] ?? null;
  } catch {
    return null;
  }
}

// Try extracting org from title if URL doesn't give us one
function inferOrgFromTitle(title: string): string | null {
  // Common patterns: "University of X Scholarship", "X University Scholarship"
  const patterns = [
    /^(.+?)\s+(?:scholarship|award|prize|grant|fellowship|bursary)/i,
    /(?:at|from)\s+(.+?)\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      // Only use if it looks like an organization name
      if (
        candidate.toLowerCase().includes("university") ||
        candidate.toLowerCase().includes("institute") ||
        candidate.toLowerCase().includes("college") ||
        candidate.toLowerCase().includes("foundation")
      ) {
        return candidate;
      }
    }
  }
  return null;
}

// ---- Tag generation ----

function generateTags(
  title: string,
  description: string | undefined,
  degreeLevels: string[],
  fundingType: string,
): string[] {
  const tags: string[] = [];
  const text = `${title} ${description ?? ""}`.toLowerCase();

  // Degree-based tags
  if (degreeLevels.includes("phd") || degreeLevels.includes("postdoc")) {
    tags.push("research_grant");
  }

  // Funding-based tags
  if (fundingType === "fully_funded") tags.push("full_degree");

  // Keyword-based tags
  if (/\bstem\b|engineering|science|technology|mathematics|computer/i.test(text)) {
    tags.push("stem");
  }
  if (/women\s+only|female\s+only|for\s+women\b/i.test(text)) {
    tags.push("women_only");
  }
  if (/merit[\s-]based|academic\s+merit|academic\s+excellence/i.test(text)) {
    tags.push("merit_based");
  }
  if (/need[\s-]based|financial\s+need/i.test(text)) {
    tags.push("need_based");
  }
  if (/developing\s+(countr|nation)|low[\s-]income|global\s+south/i.test(text)) {
    tags.push("developing_countries");
  }
  if (/no\s+gre|gre\s*(is\s*)?(not\s+)?required|gre\s*waived|without\s+gre/i.test(text)) {
    tags.push("no_gre");
  }
  if (/research\s+(grant|funding|fellowship)|dissertation/i.test(text)) {
    if (!tags.includes("research_grant")) tags.push("research_grant");
  }
  if (/international\s+student/i.test(text)) {
    tags.push("international_students");
  }
  if (/indigenous|aboriginal|torres\s+strait/i.test(text)) {
    tags.push("indigenous");
  }
  if (/postgraduate|master|mba/i.test(text) && !tags.includes("research_grant")) {
    tags.push("postgraduate");
  }

  // Region tag for Australia
  tags.push("oceania");

  return [...new Set(tags)]; // dedupe
}

// ---- Funding boolean inference ----

function inferFundingBooleans(
  description: string | undefined,
  fundingType: string,
): {
  funding_tuition: boolean;
  funding_living: boolean;
  funding_travel: boolean;
  funding_insurance: boolean;
} {
  const text = (description ?? "").toLowerCase();

  let tuition = false;
  let living = false;
  let travel = false;
  let insurance = false;

  // If fully funded, assume all major benefits
  if (fundingType === "fully_funded") {
    tuition = true;
    living = true;
  }

  // Keyword detection
  if (/tuition|fee\s*(waiver|discount|reduction|cover|exempt)/i.test(text)) tuition = true;
  if (/stipend|living\s*(allowance|cost|expense)|accommodation/i.test(text)) living = true;
  if (/travel\s*(allowance|grant|support)|airfare|flight/i.test(text)) travel = true;
  if (/health\s*insurance|medical\s*(cover|insurance)|oshc/i.test(text)) insurance = true;

  // Tuition waiver type
  if (fundingType === "tuition_waiver") tuition = true;

  return {
    funding_tuition: tuition,
    funding_living: living,
    funding_travel: travel,
    funding_insurance: insurance,
  };
}

// ---- Fields of study inference ----

function inferFieldsOfStudy(title: string, description: string | undefined): string[] {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const fields: string[] = [];

  const FIELD_PATTERNS: [string, RegExp][] = [
    ["Engineering", /\bengineering\b/],
    ["Computer Science", /\b(computer\s+science|computing|software|IT|informatics)\b/],
    ["Business", /\b(business|management|mba|commerce|accounting|finance)\b/],
    ["Medicine", /\b(medicine|medical|clinical|health\s+science|nursing|pharmacy)\b/],
    ["Law", /\b(law|legal|jurisprudence)\b/],
    ["Education", /\b(education|teaching|pedagogy)\b/],
    ["Arts", /\b(arts|humanities|literature|creative\s+arts|music|visual\s+arts)\b/],
    ["Science", /\b(science|physics|chemistry|biology|mathematics|natural\s+science)\b/],
    ["Agriculture", /\b(agriculture|agri|farming|food\s+science|veterinary)\b/],
    [
      "Social Sciences",
      /\b(social\s+science|sociology|psychology|political\s+science|international\s+relations)\b/,
    ],
    ["Environmental Studies", /\b(environment|sustainability|climate|ecology|conservation)\b/],
    ["Architecture", /\b(architecture|urban\s+planning|built\s+environment)\b/],
    ["Design", /\b(design|graphic|fashion|industrial\s+design)\b/],
    ["Communications", /\b(communications?|journalism|media|public\s+relations)\b/],
    ["Economics", /\b(economics?|econometrics)\b/],
  ];

  for (const [field, pattern] of FIELD_PATTERNS) {
    if (pattern.test(text)) fields.push(field);
  }

  // If title mentions "all fields" or no specific field detected
  if (fields.length === 0 && /all\s+(field|discipline|subject|program)/i.test(text)) {
    fields.push("All Fields");
  }

  return fields;
}

// ---- Main batch enrichment mutation ----

export const enrichAndPublishBatch = triggeredInternalMutation({
  args: {
    batchSize: v.optional(v.number()),
    totalTarget: v.optional(v.number()),
    processed: v.optional(v.number()),
    skipped: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? ENRICH_BATCH_SIZE, 20));
    const totalTarget = args.totalTarget ?? 200;
    const processedSoFar = args.processed ?? 0;
    const skippedSoFar = args.skipped ?? 0;

    if (processedSoFar >= totalTarget) {
      console.log(
        `[enrichPublish] Target reached: ${processedSoFar} published, ${skippedSoFar} skipped`,
      );
      return { published: processedSoFar, skipped: skippedSoFar, complete: true };
    }

    // Query pending_review scholarships
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(batchSize);

    if (scholarships.length === 0) {
      console.log(`[enrichPublish] No more pending scholarships. Published: ${processedSoFar}`);
      return { published: processedSoFar, skipped: skippedSoFar, complete: true };
    }

    let published = 0;
    let skipped = 0;

    for (const scholarship of scholarships) {
      const appUrl = scholarship.application_url ?? "";
      const isGenericUrl =
        appUrl.includes("search.studyaustralia.gov.au/scholarships") &&
        !appUrl.includes("/scholarship/"); // detail page has /scholarship/slug

      // --- Reject low-quality entries: no description + generic URL ---
      if (!scholarship.description?.trim() && isGenericUrl) {
        await ctx.db.patch(scholarship._id, { status: "rejected" });
        skipped++;
        continue;
      }

      // --- Reject entries with very generic/short titles and no description ---
      if (!scholarship.description?.trim() && scholarship.title.split(/\s+/).length <= 2) {
        await ctx.db.patch(scholarship._id, { status: "rejected" });
        skipped++;
        continue;
      }

      // --- Infer host_country ---
      let country = scholarship.host_country;
      if (!country || country === "International" || country === "( All Countries)") {
        const inferred = scholarship.application_url
          ? inferCountryFromUrl(scholarship.application_url)
          : null;
        country = inferred ?? "AU"; // Default to AU for Study Australia source
      }

      // --- Infer provider_organization ---
      let org = scholarship.provider_organization;
      if (!org || org === "Unknown") {
        const fromUrl = scholarship.application_url
          ? inferOrgFromUrl(scholarship.application_url)
          : null;
        const fromTitle = inferOrgFromTitle(scholarship.title);
        org = fromUrl ?? fromTitle ?? "Study Australia";
      }

      // --- Parse deadline ---
      let deadline = scholarship.application_deadline;
      if (!deadline && scholarship.application_deadline_text) {
        deadline = parseDeadlineToTimestamp(scholarship.application_deadline_text);
      }

      // --- Get award amount from linked raw_records ---
      let awardMin = scholarship.award_amount_min;
      let awardMax = scholarship.award_amount_max;
      let awardCurrency = scholarship.award_currency;

      if (!awardMin) {
        // Check raw_records for this scholarship
        const rawRecords = await ctx.db
          .query("raw_records")
          .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarship._id))
          .take(3);

        for (const raw of rawRecords) {
          if (raw.award_amount && !awardMin) {
            const amountStr = String(raw.award_amount).replace(/[,$\s]/g, "");
            const parsed = Number.parseFloat(amountStr);
            if (!Number.isNaN(parsed) && parsed > 0) {
              awardMin = parsed;
              awardMax = parsed;
              awardCurrency = awardCurrency ?? "AUD";
            }
          }
        }
      }

      // Default currency for AU scholarships
      if (awardMin && !awardCurrency && country === "AU") {
        awardCurrency = "AUD";
      }

      // --- Generate tags ---
      const tags = generateTags(
        scholarship.title,
        scholarship.description,
        scholarship.degree_levels,
        scholarship.funding_type,
      );

      // --- Infer fields of study ---
      const fieldsOfStudy =
        scholarship.fields_of_study && scholarship.fields_of_study.length > 0
          ? scholarship.fields_of_study
          : inferFieldsOfStudy(scholarship.title, scholarship.description);

      // --- Infer funding booleans ---
      const fundingBools = inferFundingBooleans(scholarship.description, scholarship.funding_type);

      // --- Compute match_key ---
      const matchKey = computeMatchKey(scholarship.title, org, country);

      // --- Check for duplicate match_key before publishing ---
      const existingWithKey = await ctx.db
        .query("scholarships")
        .withIndex("by_match_key", (q) => q.eq("match_key", matchKey))
        .take(5);

      const hasDuplicate = existingWithKey.some(
        (s) => s._id !== scholarship._id && s.status === "published",
      );

      if (hasDuplicate) {
        // Skip this one - already published under same key
        skipped++;
        await ctx.db.patch(scholarship._id, { match_key: matchKey });
        continue;
      }

      // --- Skip scholarships without a title or description (too incomplete) ---
      if (!scholarship.title?.trim()) {
        skipped++;
        continue;
      }

      // --- Build the update patch ---
      const patch: Record<string, any> = {
        host_country: country,
        provider_organization: org,
        match_key: matchKey,
        status: "published",
        last_verified: Date.now(),
      };

      if (tags.length > 0) patch.tags = tags;
      if (fieldsOfStudy.length > 0) patch.fields_of_study = fieldsOfStudy;
      if (deadline) patch.application_deadline = deadline;
      if (awardMin) patch.award_amount_min = awardMin;
      if (awardMax) patch.award_amount_max = awardMax;
      if (awardCurrency) patch.award_currency = awardCurrency;
      if (fundingBools.funding_tuition) patch.funding_tuition = true;
      if (fundingBools.funding_living) patch.funding_living = true;
      if (fundingBools.funding_travel) patch.funding_travel = true;
      if (fundingBools.funding_insurance) patch.funding_insurance = true;

      // Apply the patch (triggers will auto-compute prestige, search_text, etc.)
      await ctx.db.patch(scholarship._id, patch);
      published++;
    }

    const newProcessed = processedSoFar + published;
    const newSkipped = skippedSoFar + skipped;

    console.log(
      `[enrichPublish] Batch done: ${published} published, ${skipped} skipped. Total: ${newProcessed}/${totalTarget}`,
    );

    // Schedule next batch if we haven't reached the target
    if (newProcessed < totalTarget && scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(100, internal.enrichPublish.enrichAndPublishBatch, {
        batchSize,
        totalTarget,
        processed: newProcessed,
        skipped: newSkipped,
      });
    }

    return { published: newProcessed, skipped: newSkipped, complete: newProcessed >= totalTarget };
  },
});

// ---- Refresh scholarship_counts cache ----

const STATUSES = ["pending_review", "published", "rejected", "archived"] as const;
const COUNT_SCAN_CAP = 15000;

export const refreshCounts = rawInternalMutation({
  args: {},
  handler: async (ctx) => {
    for (const status of STATUSES) {
      const rows = await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(COUNT_SCAN_CAP);
      const count = rows.length;

      const existing = await ctx.db
        .query("scholarship_counts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { count, updated_at: Date.now() });
      } else {
        await ctx.db.insert("scholarship_counts", {
          status,
          count,
          updated_at: Date.now(),
        });
      }
    }
    console.log("[enrichPublish] Counts cache refreshed");
  },
});

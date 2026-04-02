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
import {
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "./_generated/server";
import { computeMatchKey, parseDeadlineToTimestamp } from "./aggregationHelpers";
import { wrapDB } from "./triggers";
import { getRegion } from "../src/lib/regions";
import { ALL_TAGS } from "../src/lib/tags";

const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));
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

function normalizeText(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function isGenericListingUrl(url: string | undefined): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("search.studyaustralia.gov.au/scholarships") &&
    !lower.includes("/scholarship/")
  );
}

function isValidHttpUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function chooseBestUrl(...urls: Array<string | undefined>): string | undefined {
  const valid = urls.filter((url): url is string => isValidHttpUrl(url));
  if (valid.length === 0) return undefined;
  const nonGeneric = valid.find((url) => !isGenericListingUrl(url));
  return nonGeneric ?? valid[0];
}

function appendEditorialNote(existing: string | undefined, note: string): string {
  const current = normalizeText(existing);
  if (!current) return note;
  if (current.includes(note)) return current;
  return `${current} ${note}`.slice(0, 1200);
}

function isPlaceholderCountry(country: string | undefined): boolean {
  if (!country) return true;
  const normalized = country.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "international" ||
    normalized === "( all countries)" ||
    normalized === "all countries"
  );
}

function parseAwardRange(rawAmount: string | undefined): { min?: number; max?: number } {
  if (!rawAmount) return {};
  const nums = rawAmount
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/g)
    ?.map((n) => Number.parseFloat(n))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!nums || nums.length === 0) return {};
  if (nums.length === 1) return { min: nums[0], max: nums[0] };

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max };
}

function inferDegreeLevels(
  title: string,
  description: string | undefined,
  current: string[] | undefined,
): Array<"bachelor" | "master" | "phd" | "postdoc"> {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const levels = new Set<string>(current ?? []);

  if (/\b(bachelor|undergraduate|honours)\b/.test(text)) levels.add("bachelor");
  if (/\b(master|masters|postgraduate|mba)\b/.test(text)) levels.add("master");
  if (/\b(phd|doctorate|doctoral)\b/.test(text)) levels.add("phd");
  if (/\bpostdoc|post-doctoral|post doctoral\b/.test(text)) levels.add("postdoc");

  const ordered: Array<"bachelor" | "master" | "phd" | "postdoc"> = [];
  for (const key of ["bachelor", "master", "phd", "postdoc"] as const) {
    if (levels.has(key)) ordered.push(key);
  }
  return ordered.length > 0 ? ordered : ["master"];
}

function selectBestRawRecord(rawRecords: any[]): any | undefined {
  if (rawRecords.length === 0) return undefined;

  const scored = rawRecords.map((raw) => {
    let score = 0;
    if (normalizeText(raw.description)?.length) score += 4;
    if (normalizeText(raw.provider_organization)?.length) score += 2;
    if (chooseBestUrl(raw.application_url, raw.source_url)) score += 4;
    if (normalizeText(raw.application_deadline)?.length) score += 2;
    if (!isPlaceholderCountry(raw.host_country)) score += 2;
    return { raw, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.raw;
}

function getHardRejectReason(
  title: string,
  description: string | undefined,
  applyUrl: string | undefined,
  providerOrganization: string | undefined,
): string | null {
  const lowerTitle = title.trim().toLowerCase();
  const lowerText = `${title} ${description ?? ""}`.toLowerCase();
  const provider = (providerOrganization ?? "").trim().toLowerCase();

  if (!isValidHttpUrl(applyUrl)) {
    return "invalid or relative application link";
  }

  const exactBadTitles = new Set([
    "study",
    "emergencies",
    "language selection",
    "page not available",
    "k-12 schools",
    "all scholarships",
    "scholarships",
  ]);

  if (exactBadTitles.has(lowerTitle)) {
    return "not a specific scholarship page";
  }

  if (/privacy policy|cookie policy|404|not available|language selection|emergenc/.test(lowerTitle)) {
    return "policy/error/navigation page instead of scholarship page";
  }

  let urlPath = "";
  try {
    const parsed = new URL(applyUrl);
    urlPath = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return "invalid application link";
  }

  if (/(\/privacy|\/cookie|\/emergency|\/healthandsafety\/emergency|\/404)/.test(urlPath)) {
    return "application link points to a non-scholarship policy/emergency page";
  }

  const genericDirectoryTitle =
    /scholarship directory|find free scholarships|bachelorsportal scholarships/.test(lowerTitle) ||
    /all scholarships/.test(lowerTitle);
  const providerUnknown =
    provider.length === 0 || provider === "unknown" || provider === "study australia";

  if (genericDirectoryTitle && providerUnknown) {
    return "aggregator directory page without a specific scholarship entry";
  }

  const scholarshipSignals = /\b(scholarship|fellowship|grant|bursary|studentship|award)\b/.test(
    lowerText,
  );
  if (!scholarshipSignals && /\bk-12|high school|best schools\b/.test(lowerText)) {
    return "education directory page rather than scholarship record";
  }

  return null;
}

// ---- Tag generation ----

const VALID_TAG_IDS = new Set(ALL_TAGS.map((tag) => tag.id));
const REGION_TO_TAG: Record<string, string> = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  Americas: "americas",
  Oceania: "oceania",
  "Middle East": "middle_east",
};

function generateTags(
  title: string,
  description: string | undefined,
  degreeLevels: string[],
  fundingType: string,
  hostCountry: string | undefined,
  existingTags: string[] | undefined,
  hasEligibilityList: boolean,
): string[] {
  const tags = new Set<string>((existingTags ?? []).filter((tag) => VALID_TAG_IDS.has(tag)));
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (degreeLevels.includes("phd") || degreeLevels.includes("postdoc")) tags.add("research_grant");
  if (degreeLevels.length === 1 && degreeLevels[0] === "bachelor") tags.add("undergraduate_only");
  if (fundingType === "fully_funded") tags.add("full_degree");

  if (/\bstem\b|engineering|science|technology|mathematics|computer|informatics/.test(text))
    tags.add("stem");
  if (/arts|humanities|literature|philosophy|history|music|visual\s+arts/.test(text))
    tags.add("arts_humanities");
  if (/business|management|mba|commerce|accounting|finance|economics/.test(text))
    tags.add("business");
  if (/sociology|psychology|political|international relations|social science/.test(text))
    tags.add("social_sciences");
  if (/medicine|medical|health|nursing|pharmacy|public health|clinical/.test(text))
    tags.add("health_medical");

  if (/women\s+only|female\s+only|for\s+women\b/.test(text)) tags.add("women_only");
  if (/merit[\s-]based|academic\s+merit|academic\s+excellence/.test(text)) tags.add("merit_based");
  if (/need[\s-]based|financial\s+need/.test(text)) tags.add("need_based");
  if (/developing\s+(countr|nation)|low[\s-]income|global\s+south/.test(text))
    tags.add("developing_countries");
  if (/no\s+gre|gre\s*(is\s*)?(not\s+)?required|gre\s*waived|without\s+gre/.test(text))
    tags.add("no_gre");
  if (/research\s+(grant|funding|fellowship)|dissertation/.test(text))
    tags.add("research_grant");
  if (/summer\s+(program|school)|winter\s+program/.test(text)) tags.add("summer_program");
  if (/\bexchange\b|semester abroad|study abroad/.test(text)) tags.add("exchange");
  if (/short[\s-]?term|certificate|6\s*months|3\s*months/.test(text)) tags.add("short_term");

  if (
    !hasEligibilityList &&
    /open to all|all nationalities|international students from any country|no nationality restrictions/.test(
      text,
    )
  ) {
    tags.add("open_to_all");
  }

  if (hostCountry && !isPlaceholderCountry(hostCountry)) {
    const region = getRegion(hostCountry);
    const regionTag = REGION_TO_TAG[region];
    if (regionTag) tags.add(regionTag);
  }

  return Array.from(tags).filter((tag) => VALID_TAG_IDS.has(tag));
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

// Uses rawInternalMutation to skip prestige/search_text triggers during bulk ops.
// This halves the write amplification. Prestige is recomputed later or by the trigger
// on individual admin edits.
export const enrichAndPublishBatch = rawInternalMutation({
  args: {
    batchSize: v.optional(v.number()),
    totalTarget: v.optional(v.number()),
    processed: v.optional(v.number()),
    skipped: v.optional(v.number()),
    rejected: v.optional(v.number()),
    reviewed: v.optional(v.number()),
    autoSchedule: v.optional(v.boolean()),
    rejectIncomplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? ENRICH_BATCH_SIZE, 20));
    const totalTarget = args.totalTarget ?? 200;
    const publishedSoFar = args.processed ?? 0;
    const skippedSoFar = args.skipped ?? 0;
    const rejectedSoFar = args.rejected ?? 0;
    const reviewedSoFar = args.reviewed ?? 0;
    const isLegacyScheduledInvocation =
      args.reviewed === undefined && args.processed !== undefined && args.processed > 0;

    // Prevent legacy scheduled payloads (from the previous batching logic) from restarting full runs.
    if (isLegacyScheduledInvocation) {
      console.log(
        `[enrichPublish] Ignoring legacy scheduled invocation (processed=${publishedSoFar}, skipped=${skippedSoFar})`,
      );
      return {
        reviewed: 0,
        published: publishedSoFar,
        skipped: skippedSoFar,
        rejected: rejectedSoFar,
        complete: true,
      };
    }

    if (reviewedSoFar >= totalTarget) {
      console.log(
        `[enrichPublish] Review target reached: ${reviewedSoFar} reviewed, ${publishedSoFar} published, ${skippedSoFar} skipped, ${rejectedSoFar} rejected`,
      );
      return {
        reviewed: reviewedSoFar,
        published: publishedSoFar,
        skipped: skippedSoFar,
        rejected: rejectedSoFar,
        complete: true,
      };
    }

    // When rejectIncomplete is true, all items leave pending (published or rejected),
    // so always read from position 0. Otherwise use the moving window approach.
    let scholarships;
    if (args.rejectIncomplete) {
      scholarships = await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .take(batchSize);
    } else {
      const windowSize = Math.min(totalTarget, reviewedSoFar + batchSize);
      const pendingWindow = await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .take(windowSize);
      scholarships = pendingWindow.slice(reviewedSoFar, reviewedSoFar + batchSize);
    }

    if (scholarships.length === 0) {
      console.log(
        `[enrichPublish] No more pending scholarships in target window. Reviewed: ${reviewedSoFar}, Published: ${publishedSoFar}`,
      );
      return {
        reviewed: reviewedSoFar,
        published: publishedSoFar,
        skipped: skippedSoFar,
        rejected: rejectedSoFar,
        complete: true,
      };
    }

    let published = 0;
    let skipped = 0;
    let rejected = 0;

    for (const scholarship of scholarships) {
      const rawRecords = await ctx.db
        .query("raw_records")
        .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarship._id))
        .take(8);
      const bestRaw = selectBestRawRecord(rawRecords);

      const extractedDescription =
        normalizeText(scholarship.description) ?? normalizeText(bestRaw?.description);
      let description = extractedDescription;
      const applyUrl = chooseBestUrl(
        scholarship.application_url,
        bestRaw?.application_url,
        bestRaw?.source_url,
      );

      let country = scholarship.host_country;
      if (isPlaceholderCountry(country)) {
        country = !isPlaceholderCountry(bestRaw?.host_country)
          ? bestRaw?.host_country
          : undefined;
      }
      if (isPlaceholderCountry(country)) {
        country = applyUrl ? inferCountryFromUrl(applyUrl) : null;
      }
      if (isPlaceholderCountry(country)) {
        country = "AU";
      }

      let org = normalizeText(scholarship.provider_organization);
      if (!org || org.toLowerCase() === "unknown") {
        org =
          normalizeText(bestRaw?.provider_organization) ??
          (applyUrl ? inferOrgFromUrl(applyUrl) : null) ??
          inferOrgFromTitle(scholarship.title) ??
          "Study Australia";
      }

      const hardRejectReason = getHardRejectReason(
        scholarship.title,
        extractedDescription,
        applyUrl,
        org,
      );

      if (!description && !hardRejectReason) {
        description = normalizeText(
          `${scholarship.title} scholarship opportunity by ${org}. Please check the official application page for eligibility, benefits, and deadline details.`,
        );
      }

      const deadlineText =
        normalizeText(scholarship.application_deadline_text) ??
        normalizeText(bestRaw?.application_deadline);
      const deadline =
        scholarship.application_deadline ??
        (deadlineText ? parseDeadlineToTimestamp(deadlineText) : undefined);

      let awardMin = scholarship.award_amount_min;
      let awardMax = scholarship.award_amount_max;
      let awardCurrency = scholarship.award_currency ?? normalizeText(bestRaw?.award_currency);
      if (!awardMin) {
        for (const raw of rawRecords) {
          const parsed = parseAwardRange(normalizeText(raw.award_amount));
          if (parsed.min) {
            awardMin = parsed.min;
            awardMax = parsed.max ?? parsed.min;
            awardCurrency = awardCurrency ?? normalizeText(raw.award_currency) ?? "AUD";
            break;
          }
        }
      }
      if (awardMin && !awardCurrency && country === "AU") awardCurrency = "AUD";

      const degreeLevels = inferDegreeLevels(scholarship.title, description, scholarship.degree_levels);
      const fieldsOfStudy =
        scholarship.fields_of_study && scholarship.fields_of_study.length > 0
          ? scholarship.fields_of_study
          : inferFieldsOfStudy(scholarship.title, description);
      const fundingBools = inferFundingBooleans(description, scholarship.funding_type);

      const tags = generateTags(
        scholarship.title,
        description,
        degreeLevels,
        scholarship.funding_type,
        country,
        scholarship.tags,
        (scholarship.eligibility_nationalities?.length ?? 0) > 0,
      );

      const matchKey = computeMatchKey(scholarship.title, org, country);
      const existingWithKey = await ctx.db
        .query("scholarships")
        .withIndex("by_match_key", (q) => q.eq("match_key", matchKey))
        .take(5);
      const hasDuplicate = existingWithKey.some(
        (s) => s._id !== scholarship._id && s.status === "published",
      );

      const patch: Record<string, any> = {
        host_country: country,
        provider_organization: org,
        match_key: matchKey,
        last_verified: Date.now(),
      };

      if (description) patch.description = description;
      if (applyUrl) patch.application_url = applyUrl;
      if (deadline) patch.application_deadline = deadline;
      if (deadlineText) patch.application_deadline_text = deadlineText;
      if (awardMin) patch.award_amount_min = awardMin;
      if (awardMax) patch.award_amount_max = awardMax;
      if (awardCurrency) patch.award_currency = awardCurrency;
      if (tags.length > 0) patch.tags = tags;
      if (fieldsOfStudy.length > 0) patch.fields_of_study = fieldsOfStudy;
      if (degreeLevels.length > 0) patch.degree_levels = degreeLevels;
      if (fundingBools.funding_tuition) patch.funding_tuition = true;
      if (fundingBools.funding_living) patch.funding_living = true;
      if (fundingBools.funding_travel) patch.funding_travel = true;
      if (fundingBools.funding_insurance) patch.funding_insurance = true;
      if (
        (scholarship.eligibility_nationalities?.length ?? 0) === 0 &&
        (bestRaw?.eligibility_nationalities?.length ?? 0) > 0
      ) {
        patch.eligibility_nationalities = bestRaw.eligibility_nationalities;
      }

      // Don't publish scholarships with expired deadlines — they'd immediately
      // get archived by the cron, wasting function calls and bandwidth.
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const deadlineExpired = deadline && deadline < Date.now() - THIRTY_DAYS_MS;

      const canPublish =
        !hasDuplicate &&
        !deadlineExpired &&
        scholarship.title.trim().length > 0 &&
        !!description &&
        description.length >= 20 &&
        isValidHttpUrl(applyUrl) &&
        !isPlaceholderCountry(country);

      if (hardRejectReason) {
        patch.status = "rejected";
        patch.editorial_notes = appendEditorialNote(
          scholarship.editorial_notes,
          `Auto-rejected: ${hardRejectReason}.`,
        );
        await ctx.db.patch(scholarship._id, patch);
        rejected++;
      } else if (canPublish) {
        patch.status = "published";
        patch.editorial_notes = appendEditorialNote(
          scholarship.editorial_notes,
          "Auto-enriched and published from source data.",
        );
        await ctx.db.patch(scholarship._id, patch);
        published++;
      } else if (args.rejectIncomplete) {
        patch.status = "rejected";
        patch.editorial_notes = appendEditorialNote(
          scholarship.editorial_notes,
          "Auto-rejected: insufficient data for publication (missing application link or complete details).",
        );
        await ctx.db.patch(scholarship._id, patch);
        rejected++;
      } else {
        patch.editorial_notes = appendEditorialNote(
          scholarship.editorial_notes,
          "Needs manual review: missing official application link and/or complete details.",
        );
        await ctx.db.patch(scholarship._id, patch);
        skipped++;
      }
    }

    const newPublished = publishedSoFar + published;
    const newSkipped = skippedSoFar + skipped;
    const newRejected = rejectedSoFar + rejected;
    const newReviewed = reviewedSoFar + scholarships.length;

    console.log(
      `[enrichPublish] Batch done: reviewed ${scholarships.length}, ${published} published, ${skipped} skipped, ${rejected} rejected. Total reviewed: ${newReviewed}/${totalTarget}`,
    );

    // Schedule next batch if we haven't reached the target
    if (args.autoSchedule === true && newReviewed < totalTarget && scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(1000, internal.enrichPublish.enrichAndPublishBatch, {
        batchSize,
        totalTarget,
        processed: newPublished,
        skipped: newSkipped,
        rejected: newRejected,
        reviewed: newReviewed,
        autoSchedule: true,
        rejectIncomplete: args.rejectIncomplete,
      });
    }

    return {
      reviewed: newReviewed,
      published: newPublished,
      skipped: newSkipped,
      rejected: newRejected,
      complete: newReviewed >= totalTarget,
    };
  },
});

// ---- Public trigger for bulk review ----
// Kicks off enrichAndPublishBatch with rejectIncomplete mode.
// Processes `totalTarget` items in batches of 15 with 1s delay between batches.
// Cost: ~2 function calls per 15 items (batch + schedule) = ~670 calls for 5000 items.

export const triggerBulkReview = rawMutation({
  args: {
    totalTarget: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const target = Math.min(args.totalTarget ?? 500, 5000);
    const batch = Math.min(args.batchSize ?? 15, 20);
    await ctx.scheduler.runAfter(0, internal.enrichPublish.enrichAndPublishBatch, {
      totalTarget: target,
      batchSize: batch,
      autoSchedule: true,
      rejectIncomplete: true,
    });
    return { scheduled: true, target, batchSize: batch };
  },
});

// ---- Refresh scholarship_counts cache ----
// Counts one status at a time via pagination to stay well under Convex bandwidth limits.
// Each page reads only IDs (via the index), not full documents.

const STATUSES = ["pending_review", "published", "rejected", "archived"] as const;
const COUNT_PAGE_SIZE = 500;

export const refreshCounts = rawInternalMutation({
  args: {},
  handler: async (ctx) => {
    // Schedule per-status counters sequentially to avoid bandwidth spikes
    for (let i = 0; i < STATUSES.length; i++) {
      await ctx.scheduler.runAfter(i * 500, internal.enrichPublish.refreshCountForStatus, {
        status: STATUSES[i],
        cursor: null,
        accumulated: 0,
      });
    }
    console.log("[enrichPublish] Counts refresh scheduled for all statuses");
  },
});

export const refreshCountForStatus = rawInternalMutation({
  args: {
    status: v.string(),
    cursor: v.union(v.string(), v.null()),
    accumulated: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .paginate({ numItems: COUNT_PAGE_SIZE, cursor: args.cursor === null ? null : args.cursor });

    const accumulated = args.accumulated + result.page.length;

    if (!result.isDone) {
      // More pages to count — schedule next page
      await ctx.scheduler.runAfter(100, internal.enrichPublish.refreshCountForStatus, {
        status: args.status,
        cursor: result.continueCursor,
        accumulated,
      });
      return;
    }

    // Final page — save the total count
    const existing = await ctx.db
      .query("scholarship_counts")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: accumulated, updated_at: Date.now() });
    } else {
      await ctx.db.insert("scholarship_counts", {
        status: args.status as any,
        count: accumulated,
        updated_at: Date.now(),
      });
    }
    console.log(`[enrichPublish] Count for ${args.status}: ${accumulated}`);
  },
});


/**
 * Shared projection for scholarship cards/list pages.
 *
 * Returning a lean shape from high-traffic queries keeps Convex bytes-read
 * and response payloads small without losing fields needed by list UIs.
 */

export interface ScholarshipSummary {
  _id: any;
  _creationTime: number;
  title: string;
  slug?: string;
  description?: string;
  provider_organization: string;
  host_country: string;
  eligibility_nationalities?: string[] | null;
  degree_levels: string[];
  fields_of_study?: string[] | null;
  funding_type: string;
  funding_tuition?: boolean;
  funding_living?: boolean;
  funding_travel?: boolean;
  funding_insurance?: boolean;
  funding_books?: boolean;
  funding_research?: boolean;
  award_amount_min?: number;
  award_amount_max?: number;
  award_currency?: string;
  application_deadline?: number | null;
  prestige_tier?: string | null;
  scholarship_type?: string | null;
}

export function toScholarshipSummary(s: any): ScholarshipSummary {
  return {
    _id: s._id,
    _creationTime: s._creationTime,
    title: s.title,
    slug: s.slug,
    description: s.description,
    provider_organization: s.provider_organization,
    host_country: s.host_country,
    eligibility_nationalities: s.eligibility_nationalities,
    degree_levels: s.degree_levels,
    fields_of_study: s.fields_of_study,
    funding_type: s.funding_type,
    funding_tuition: s.funding_tuition,
    funding_living: s.funding_living,
    funding_travel: s.funding_travel,
    funding_insurance: s.funding_insurance,
    funding_books: s.funding_books,
    funding_research: s.funding_research,
    award_amount_min: s.award_amount_min,
    award_amount_max: s.award_amount_max,
    award_currency: s.award_currency,
    application_deadline: s.application_deadline,
    prestige_tier: s.prestige_tier,
    scholarship_type: s.scholarship_type,
  };
}

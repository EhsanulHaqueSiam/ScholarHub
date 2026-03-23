export interface ScholarshipSummary {
  _id: string;
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

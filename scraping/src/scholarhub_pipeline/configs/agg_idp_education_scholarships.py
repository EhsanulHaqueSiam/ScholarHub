"""IDP Education Scholarships source configuration.

Next.js SSR site with 6300+ scholarships. Data is embedded in
__NEXT_DATA__ JSON on every page. Listing pages at
/find-a-scholarship/all-subject/all-study-level/all-destination/?page=N
return 12 scholarships per page (14 fields each). Detail pages at
/scholarship/{inst}/{name}/{id}/ return 35 fields including eligibility,
application URL, award coverage, and subject taxonomy.

Uses ApiScraper with format='nextdata' to extract structured JSON
from __NEXT_DATA__ script tags, with detail page follow-through
for complete field extraction.

URL: https://www.idp.com/find-a-scholarship/all-subject/all-study-level/all-destination/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IDP Education scholarship finder config.

    Uses ApiScraper with format='nextdata' to extract scholarship data
    from __NEXT_DATA__ JSON embedded in Next.js SSR pages. Listing pages
    provide 14 fields; detail pages add eligibility, application URL,
    award coverage, subject taxonomy, and more (35 fields total).
    """

    name: str = "IDP Education Scholarships"
    url: str = "https://www.idp.com/find-a-scholarship/all-subject/all-study-level/all-destination/"
    source_id: str = "idp_education_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = "scrape"
    rate_limit_delay: float = 2.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        # --- Listing page nextdata extraction ---
        "format": "nextdata",
        "items_path": "props.pageProps.scholarshipSearchResult",
        "nextdata_script_id": "__NEXT_DATA__",
        # --- Detail page nextdata extraction ---
        "detail_url_template": (
            "https://www.idp.com/scholarship/"
            "{url_slug.institution_name}/{slug:scholarship_name}/{scholarship_id}/"
        ),
        "detail_items_path": "props.pageProps.apiData",
        "detail_field_mappings": {
            # Eligibility & requirements
            "eligibility_req": "eligibility_criteria",
            "gender_code": "eligibility_gender",
            "country_of_residence": "eligibility_nationalities",
            "selection_basis": "selection_basis",
            "selection_criteria": "selection_criteria",
            "selection_approach": "selection_approach",
            # Application info
            "scholarship_award_website": "application_url",
            "application_process": "application_process",
            "application_details": "application_details",
            "application_req_details": "application_requirements",
            # Award details
            "award_coverage": "award_coverage",
            "no_of_awards_available": "number_of_awards",
            "award_type": "award_type",
            # Subject taxonomy
            "category": "field_of_study",
            "subject_area": "subject_area",
            "course_subject_you_are_applying_for": "course_subject",
            # Institution details
            "institution_url": "institution_url",
            "institution_logo_url": "institution_logo_url",
            # Study mode
            "study_mode": "study_mode",
            "delivery_mode": "delivery_mode",
            "qualification": "qualification",
        },
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        # --- Listing page field mappings (14 fields) ---
        "scholarship_id": "external_id",
        "scholarship_name": "title",
        "institution_name.value": "provider_organization",
        "institution_country_name": "host_country",
        "level_of_study.value": "degree_levels",
        "funding_type": "funding_type",
        "application_deadline": "application_deadline",
        "value_of_award.funding_details": "description",
        "value_of_award.funding_value": "award_amount",
        "value_of_award.funding_currency": "award_currency",
        "country_of_residence": "eligibility_nationalities",
        "eligible_intake": "eligible_intake",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 526,
    })
    detail_page: bool = True
    max_records: int | None = 1200


CONFIG = Config()

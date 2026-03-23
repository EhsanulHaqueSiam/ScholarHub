"""IDP Education Scholarships source configuration.

Next.js SSR site with 6300+ scholarships. Data is embedded in
__NEXT_DATA__ JSON on every page. Listing pages at
/find-a-scholarship/all-subject/all-study-level/all-destination/?page=N
return 12 scholarships per page with structured fields.

Uses ApiScraper with format='nextdata' to extract scholarship data
from __NEXT_DATA__ JSON embedded in Next.js SSR pages, replacing
the previous fragile CSS selector approach.

URL: https://www.idp.com/find-a-scholarship/all-subject/all-study-level/all-destination/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IDP Education scholarship finder config.

    Uses ApiScraper with format='nextdata' to extract scholarship data
    from __NEXT_DATA__ JSON embedded in Next.js SSR pages. The listing
    page JSON provides 14 rich fields per scholarship without needing
    detail page scraping.
    """

    name: str = "IDP Education Scholarships"
    url: str = "https://www.idp.com/find-a-scholarship/all-subject/all-study-level/all-destination/"
    source_id: str = "idp_education_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = "scrape"
    rate_limit_delay: float = 2.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "format": "nextdata",
        "items_path": "props.pageProps.scholarshipSearchResult",
        "nextdata_script_id": "__NEXT_DATA__",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
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
    detail_page: bool = False  # Listing __NEXT_DATA__ provides 14 rich fields
    max_records: int | None = 6400


CONFIG = Config()

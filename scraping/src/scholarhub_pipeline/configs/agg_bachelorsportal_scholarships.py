"""BachelorsPortal Scholarships source configuration.

StudyPortals network site with 2200+ bachelor-level scholarships.
Content is JS-rendered (React SPA), requiring Scrapling/StealthyFetcher.
Listing at /search/scholarships/bachelor shows 20 cards per page with
ScholarshipCard components. Detail pages at /scholarships/{id}/{slug}.html
include JSON-LD (MonetaryGrant schema) and rich HTML fields.

URL: https://www.bachelorsportal.com/search/scholarships/bachelor
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """BachelorsPortal Scholarships aggregator config.

    JS-rendered React SPA from the StudyPortals network. Uses Scrapling
    as primary method since content is dynamically loaded. Listing pages
    show 20 scholarship cards per page across 247 pages. Detail pages
    have JSON-LD MonetaryGrant schema and additional fields.
    """

    name: str = "BachelorsPortal Scholarships"
    url: str = "https://www.bachelorsportal.com/search/scholarships/bachelor"
    source_id: str = "bachelorsportal_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a.ScholarshipCard",
        "title": ".ScholarshipName::text",
        "provider": ".Name::text",
        "country": ".Location::text",
        "amount": ".CurrencyType::text",
        "deadline_raw": ".QFValue::text",
        "detail_link": "::attr(href)",
        "next_page": (
            "a[aria-label='Next']::attr(href),"
            " a[rel='next']::attr(href),"
            " .Pagination .next::attr(href)"
        ),
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "provider": "provider_organization",
        "country": "host_country",
        "amount": "award_amount",
        "deadline_raw": "application_deadline",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 100,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": (
            ".ArticleTitle + div::text,"
            " .ProviderDescription::text,"
            " .ItemInformation::text,"
            " .SectionTitle + div::text"
        ),
        "eligibility": (
            ".ItemInformation::text,"
            " [class*='Eligib']::text"
        ),
        "degree": ".Tag::text",
        "application_url": (
            "a.ChampionButton::attr(href),"
            " a.CTAButton::attr(href)"
        ),
    })
    max_records: int | None = 2000


CONFIG = Config()

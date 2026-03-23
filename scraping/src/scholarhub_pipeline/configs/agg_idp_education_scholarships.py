"""IDP Education Scholarships source configuration.

Next.js SSR site with 6300+ scholarships. The scholarship finder at
/find-a-scholarship/ renders cards with title, institution, country,
degree level, funding type, and deadline. Detail pages at
/scholarship/{inst}/{name}/{id}/ add eligibility, application info,
and award coverage.

URL: https://www.idp.com/find-a-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IDP Education scholarship finder config.

    Next.js SSR site with 6300+ scholarships. Listing pages render
    scholarship cards; detail pages at /scholarship/{inst}/{name}/{id}/
    contain full eligibility, award, and application info.
    """

    name: str = "IDP Education Scholarships"
    url: str = "https://www.idp.com/find-a-scholarship/"
    source_id: str = "idp_education_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 2.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": (
            "[data-testid='scholarship-card'], .scholarship-card, article,"
            " .search-result-item, [class*='ScholarshipCard'],"
            " div[class*='search-result']"
        ),
        "title": (
            "h3 a::text, h2 a::text,"
            " [class*='scholarshipName']::text,"
            " [class*='ScholarshipName']::text"
        ),
        "provider": (
            "[class*='institutionName']::text,"
            " [class*='InstitutionName']::text,"
            " .institution::text"
        ),
        "country": (
            "[class*='country']::text,"
            " [class*='location']::text,"
            " .country-name::text"
        ),
        "degree": (
            "[class*='studyLevel']::text,"
            " [class*='level']::text,"
            " .study-level::text"
        ),
        "amount": (
            "[class*='awardValue']::text,"
            " [class*='value']::text,"
            " .award-value::text"
        ),
        "funding_type_raw": (
            "[class*='fundingType']::text,"
            " .funding-type::text"
        ),
        "deadline_raw": (
            "[class*='deadline']::text,"
            " .deadline::text"
        ),
        "detail_link": (
            "h3 a::attr(href), h2 a::attr(href),"
            " a[href*='/scholarship/']::attr(href)"
        ),
        "next_page": (
            "a[aria-label='Next']::attr(href),"
            " a[rel='next']::attr(href),"
            " .pagination-next a::attr(href)"
        ),
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "provider": "provider_organization",
        "country": "host_country",
        "degree": "degree_levels",
        "amount": "award_amount",
        "funding_type_raw": "funding_type",
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
            "[class*='eligibility']::text,"
            " [class*='requirements']::text,"
            " .entry-requirements::text,"
            " section p::text"
        ),
        "eligibility": (
            "[class*='eligibility']::text,"
            " .eligibility-section::text,"
            " [class*='Eligibility']::text"
        ),
        "amount": (
            "[class*='awardValue']::text,"
            " [class*='value-of-award']::text,"
            " [class*='ValueOfAward']::text"
        ),
        "application_url": (
            "a[href*='apply']::attr(href),"
            " a[class*='apply']::attr(href),"
            " a[class*='website']::attr(href),"
            " a[href*='.edu']::attr(href)"
        ),
    })
    max_records: int | None = 1200


CONFIG = Config()

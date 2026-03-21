"""CollegeScholarships.org source configuration.

Server-rendered HTML listing ~23k scholarships across ~769 pages.
Each scholarship appears as an h4 heading with a link to
/financial-aid/scholarship/[slug], preceded by award amount and
deadline in bold text. Pagination uses ?page=N query parameter.

URL: https://www.collegescholarships.org/financial-aid
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """CollegeScholarships.org aggregator config.

    Scholarship items have h4 > a title links pointing to
    /financial-aid/scholarship/[slug]. Award and deadline appear
    as bold/strong text. Page uses numeric ?page=N pagination.
    We use h4 elements as listing items since each h4 contains
    the scholarship title link.
    """

    name: str = "CollegeScholarships.org"
    url: str = "https://www.collegescholarships.org/financial-aid"
    source_id: str = "collegescholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "h4",
        "title": "a",
        "detail_link": "a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
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
        "description": "p",
        "amount": "strong",
        "eligibility": "li",
        "application_url": "a[href*='apply']::attr(href)",
    })


CONFIG = Config()

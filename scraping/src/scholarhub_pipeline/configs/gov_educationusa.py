"""EducationUSA Financial Aid source configuration.

Targets the EducationUSA Drupal site listing ~271 financial aid records.
Uses HTML scraping with page_num pagination.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """EducationUSA Financial Aid government config."""

    name: str = "EducationUSA Financial Aid"
    url: str = "https://educationusa.state.gov/find-financial-aid"
    source_id: str = "educationusa_financial_aid"
    primary_method: str = "scrape"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".views-row",
        "title": ".views-field a::text",
        "detail_link": ".views-field a::attr(href)",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 0,
        "max_pages": 30,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()

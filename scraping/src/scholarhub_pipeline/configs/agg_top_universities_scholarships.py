"""Top Universities Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Top Universities Scholarships aggregator config."""

    name: str = "Top Universities Scholarships"
    # HTML pages are often WAF-challenged; RSS endpoint is significantly
    # more reliable for automated incremental crawling.
    url: str = "https://www.topuniversities.com/rss.xml"
    source_id: str = "top_universities_scholarships"
    primary_method: str = "rss"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {"feed_url": "https://www.topuniversities.com/rss.xml"})
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "source_url": "source_url",
        "application_url": "application_url",
        "application_deadline": "application_deadline",
        "external_id": "external_id",
        "provider_organization": "provider_organization",
        "fields_of_study": "fields_of_study",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    method_timeout_seconds: float = 12.0


CONFIG = Config()

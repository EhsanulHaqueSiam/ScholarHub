"""IIE Programs source configuration.

Targets the Institute of International Education (IIE) programs page.
IIE manages 200+ scholarship and fellowship programs including
Fulbright, Gilman, and others. WordPress-based with JS-rendered
content requiring scrapling.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IIE Programs aggregator config."""

    name: str = "IIE Programs"
    url: str = "https://www.iie.org/programs/"
    source_id: str = "iie_programs"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".program-card, .card, article, .wp-block-group, .views-row",
        "title": "h2 a::text, h3 a::text, .card-title::text, .program-name::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .card-body p::text, .excerpt::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 20,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".entry-content p::text, article p::text, .content p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .date::text",
        "amount": ".amount::text, .funding::text",
    })
    rate_limit_delay: float = 3.0


CONFIG = Config()

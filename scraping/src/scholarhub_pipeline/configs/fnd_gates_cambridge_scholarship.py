"""Gates Cambridge Scholarship source configuration.

Gates Cambridge awards ~80 full-cost postgraduate scholarships annually
at the University of Cambridge. The programme page describes coverage
(fees, maintenance allowance, airfare, visa costs) and selection criteria.
Content is WordPress-based with h2 sections and bullet lists.

URL: https://www.gatescambridge.org/programme/the-scholarship/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Gates Cambridge Scholarship foundation config.

    Single programme page with h2 sections (Overview, Funding) and
    ul lists for criteria/components. No pagination needed.
    """

    name: str = "Gates Cambridge Scholarship"
    url: str = "https://www.gatescambridge.org/programme/the-scholarship/"
    source_id: str = "gates_cambridge_scholarship"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": ".entry-content, .post-content, article, main",
            "title": "h2::text, h1::text",
            "description": ".entry-content p::text, .post-content p::text, article p::text",
            "eligibility": ".entry-content ul li::text, .post-content ul li::text",
            "amount": ".entry-content p::text",
            "detail_link": "a::attr(href)",
            "host_country_default": "United Kingdom",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
            "eligibility": "eligibility_criteria",
            "amount": "award_amount",
        }
    )
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()

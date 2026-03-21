"""Knight-Hennessy Scholars source configuration.

Knight-Hennessy provides full funding for graduate students at Stanford.
The funding page uses a Drupal-based structure with #main-content wrapper,
h2 sections for funding categories, and an HTML table comparing degree
programs against funding quarters/years.

URL: https://knight-hennessy.stanford.edu/program-overview/funding
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseFoundationConfig


@dataclass
class Config(BaseFoundationConfig):
    """Knight-Hennessy Scholars foundation config.

    Drupal site with #main-content container. Funding details in
    h2 sections and a table element. Single programme, no pagination.
    """

    name: str = "Knight-Hennessy Scholars"
    url: str = "https://knight-hennessy.stanford.edu/program-overview/funding"
    source_id: str = "knight_hennessy_scholars"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main-content, #page-content, main",
            "title": "h1::text",
            "description": "#main-content p::text, #page-content p::text",
            "amount": "table, #main-content p::text",
            "eligibility": "#main-content ul li::text, #main-content ol li::text",
            "detail_link": "a::attr(href)",
            "host_country_default": "United States",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
            "amount": "award_amount",
            "eligibility": "eligibility_criteria",
        }
    )
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()

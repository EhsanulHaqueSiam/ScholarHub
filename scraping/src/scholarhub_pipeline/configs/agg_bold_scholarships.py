"""Bold.org Scholarships source configuration.

Next.js SSR site listing ~3k scholarships. Each scholarship card is
an anchor tag linking to /scholarships/[slug]/. Cards contain title,
funder info, description, education level, amount, and deadline.
Class names are Next.js hashed, so we rely on href patterns and
semantic elements. Needs StealthyFetcher for JS rendering.

URL: https://bold.org/scholarships/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """Bold.org Scholarships aggregator config.

    Next.js SSR with hashed class names. We use a[href] patterns
    to select scholarship cards and semantic elements within them.
    Needs scrapling (StealthyFetcher) as primary since the page
    requires JS rendering to populate scholarship cards.
    """

    name: str = "Bold.org Scholarships"
    url: str = "https://bold.org/scholarships/"
    source_id: str = "bold_org_scholarships"
    primary_method: str = "scrapling"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "a[href*='/scholarships/'][href$='/']",
        "title": "h3",
        "detail_link": "::attr(href)",
        "host_country_default": "United States",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 50,
    })
    detail_page: bool = False
    rate_limit_delay: float = 3.0


CONFIG = Config()

"""DAAD (German Academic Exchange Service) Scholarships source configuration.

Targets the DAAD scholarship database at www2.daad.de which lists ~164
scholarships. Results are loaded dynamically via AJAX/JavaScript so
we need StealthyFetcher (headless browser) to render them. The rendered
DOM uses li elements within a result listing, with h4 headings
linking to detail pages.

URL: https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?status=&origin=&subjectGrps=&daad=&q=&page=1&back=1
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """DAAD Scholarship Database government config.

    AJAX-rendered page using Imperia CMS. StealthyFetcher renders
    the JS to get the scholarship list. Results appear as li items
    within the results container with h4 > a title links.
    """

    name: str = "DAAD Scholarship Database"
    url: str = "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?status=&origin=&subjectGrps=&daad=&q=&page=1&back=1"
    source_id: str = "daad_scholarship_database"
    primary_method: str = "scrapling"
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "#ui-result-list li",
        "title": "h4 a",
        "description_short": "p",
        "detail_link": "h4 a::attr(href)",
        "host_country_default": "Germany",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description_short": "description",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 20,
    })
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 3.0


CONFIG = Config()

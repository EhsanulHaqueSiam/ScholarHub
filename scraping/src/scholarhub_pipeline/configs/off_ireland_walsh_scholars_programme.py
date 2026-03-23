"""Walsh Scholars Programme (Teagasc) source configuration.

Targets the Teagasc Walsh Scholars Programme hub page with links to
sub-sections including scholarship opportunities. Supports 100+ MSc
and PhD students annually in partnership with Irish universities.
URL: https://www.teagasc.ie/about/research-innovation/the-walsh-scholars-programme/
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Walsh Scholars Programme (Teagasc) official program config."""

    name: str = "Walsh Scholars Programme (Teagasc)"
    url: str = "https://www.teagasc.ie/about/research-innovation/the-walsh-scholars-programme/"
    source_id: str = "ireland_walsh_scholars_programme"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content, section",
        "title": "h1::text",
        "description": ".field--name-body p::text, .teaser p::text",
        "detail_link": ".card a::attr(href), article a::attr(href)",
        "host_country_default": "Ireland",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".field--name-body p::text",
        "eligibility": ".content ul li::text",
    })


CONFIG = Config()

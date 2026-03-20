"""Erasmus Mundus Joint Masters source configuration.

Scrapes the EACEA Erasmus Mundus catalogue which lists 200+ joint master
programmes. Each programme is an article.ecl-card with the programme name
and a link to the programme website. The catalogue is paginated with 20
items per page across 11 pages.

URL: https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Erasmus Mundus Joint Masters official program config.

    The catalogue uses ECL (Europa Component Library) card components.
    Each programme entry is an article.ecl-card containing:
    - .ecl-link__label: programme title text
    - .ecl-content-block__title a: link to programme website
    - .ecl-content-block__description: acronym and project overview link
    Pagination uses .ecl-pagination__item--next for the next page link.
    """

    name: str = "Erasmus Mundus Joint Masters"
    url: str = "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en"
    source_id: str = "erasmus_mundus_joint_masters"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "article.ecl-card",
            "title": ".ecl-link__label",
            "detail_link": ".ecl-content-block__title a::attr(href)",
            "next_page": ".ecl-pagination__item--next a::attr(href)",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "detail_link": "source_url",
        }
    )
    pagination: dict | None = field(
        default_factory=lambda: {
            "type": "url",
            "selector": ".ecl-pagination__item--next a::attr(href)",
            "max_pages": 11,
        }
    )
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()

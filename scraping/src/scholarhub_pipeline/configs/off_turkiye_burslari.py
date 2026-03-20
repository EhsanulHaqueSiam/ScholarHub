"""Turkiye Burslari source configuration.

Turkiye Burslari (Turkey Scholarships) homepage has a #shortcuts section
with 3 programme cards (Undergraduate, Graduate, Research), each in a
.showcasecard div with a .showcasetitle heading and .showcasecopy
description paragraph.

URL: https://www.turkiyeburslari.gov.tr/en
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """Turkiye Burslari official program config.

    The English homepage's #shortcuts section contains 3 programme level
    cards (Undergraduate, Graduate, Research), each wrapped in a
    .showcasecard div with .showcasetitle (h2) and .showcasecopy (p).
    """

    name: str = "Turkiye Burslari"
    url: str = "https://www.turkiyeburslari.gov.tr/en"
    source_id: str = "turkiye_burslari"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": ".showcasecard",
            "title": ".showcasetitle",
            "description": ".showcasecopy",
            "detail_link": "a.btn::attr(href)",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
        }
    )
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()

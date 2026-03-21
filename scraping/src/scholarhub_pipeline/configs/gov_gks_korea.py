"""GKS (Global Korea Scholarship) source configuration.

Targets the Study in Korea GKS pages at studyinkorea.go.kr which describe
the Korean Government Scholarship Program. The site uses static HTML with
tabbed content sections covering different GKS tracks (undergraduate,
graduate, research). Content includes eligibility, benefits, and
application procedures.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """GKS Korea government config."""

    name: str = "GKS Korea"
    url: str = "https://www.studyinkorea.go.kr/en/sub/gks/allnew_invite.do"
    source_id: str = "gks_korea"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".tab-content .tab-pane, .content-area section, .sub-content, article, .board-view, .programme-section",
        "title": "h2::text, h3::text, .title::text, .sub-title::text, .tab-title::text",
        "description": "p::text, .content p::text, .description::text, .txt-area p::text",
        "detail_link": "a::attr(href)",
        "host_country_default": "South Korea",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "detail_link": "source_url",
        "eligibility": "eligibility_criteria",
        "benefits": "funding_details",
        "level": "degree_level",
        "deadline": "application_deadline",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    rate_limit_delay: float = 3.0


CONFIG = Config()

"""VLIR-UOS Scholarships Belgium source configuration.

VLIRUOS scholarships page lists programmes in three categories:
Professional Bachelors (3yr), Initial Masters (2yr), Advanced Masters (1yr).
Each category uses h2/h3 headings with ul>li linked programme entries.
.paragraph--2397 .p-block highlights criteria. Uses form.antibot.

URL: https://www.vliruos.be/en/scholarships
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseOfficialConfig


@dataclass
class Config(BaseOfficialConfig):
    """VLIR-UOS Scholarships Belgium official program config.

    Programmes listed as ul > li links under h2/h3 category headings.
    Detail pages hold individual programme information.
    """

    name: str = "VLIR-UOS Scholarships Belgium"
    url: str = "https://www.vliruos.be/en/scholarships"
    source_id: str = "vliruos_scholarships_belgium"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 3.0
    selectors: dict[str, str] = field(
        default_factory=lambda: {
            "listing": "#main-content ul li, main ul li",
            "title": "h1::text, h2::text, h3::text",
            "description": "main p::text, .p-block p::text",
            "eligibility": ".p-block ul li::text, main ul li::text",
            "detail_link": "ul li a::attr(href)",
            "host_country_default": "Belgium",
        }
    )
    field_mappings: dict[str, str] = field(
        default_factory=lambda: {
            "title": "title",
            "description": "description",
            "detail_link": "source_url",
            "eligibility": "eligibility_criteria",
        }
    )
    pagination: dict | None = None
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(
        default_factory=lambda: {
            "description": "main p::text, article p::text",
            "eligibility": "ul li::text, ol li::text",
            "application_url": "a[href*='apply']::attr(href), a.btn::attr(href)",
        }
    )


CONFIG = Config()

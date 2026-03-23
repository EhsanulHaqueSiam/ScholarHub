"""SSHRC Partnership Grants source configuration.

Targets the Social Sciences and Humanities Research Council of Canada
Partnership Grants program page. Standard Canada.ca government template
with competition years, values, and deadline information.
URL: https://www.sshrc-crsh.gc.ca/funding-financement/programs-programmes/partnership_grants-subventions_partenariat-eng.aspx
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseGovernmentConfig


@dataclass
class Config(BaseGovernmentConfig):
    """SSHRC Partnership Grants government config."""

    name: str = "SSHRC Partnership Grants"
    url: str = "https://www.sshrc-crsh.gc.ca/funding-financement/programs-programmes/partnership_grants-subventions_partenariat-eng.aspx"
    source_id: str = "canada_sshrc_partnership_grants"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "main, article, .col-md-9",
        "title": "h1::text",
        "description": "main p::text",
        "amount": "li::text",
        "host_country_default": "Canada",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None


CONFIG = Config()

# Config Writing Guide

How to create and maintain source configuration modules for the ScholarHub scraping pipeline.

## Overview

Each scholarship source has a Python config module in `src/scholarhub_pipeline/configs/`. Configs implement the `SourceConfig` protocol and control how the pipeline discovers, scrapes, normalizes, and ingests data from that source.

## SourceConfig Protocol

All configs must satisfy the `SourceConfig` protocol defined in `_protocol.py`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `str` | Yes | Human-readable name matching the source catalog |
| `url` | `str` | Yes | Base URL of the source |
| `source_id` | `str` | Yes | Slug-form ID matching catalog entry |
| `primary_method` | `str` | Yes | Scraping method: `api`, `jsonld`, `ajax`, `rss`, `scrape`, `scrapling` |
| `secondary_method` | `str \| None` | No | Fallback method if primary fails |
| `selectors` | `dict[str, str]` | Yes | CSS/XPath selectors for data extraction |
| `field_mappings` | `dict[str, str]` | Yes | Maps extracted fields to raw_record schema |
| `pagination` | `dict \| None` | No | Pagination config (type, selector, max_pages) |
| `detail_page` | `bool` | No | Whether to follow links for full data |
| `detail_selectors` | `dict[str, str] \| None` | No | Selectors for detail pages |
| `auth_config` | `dict \| None` | No | Auth credentials (None in v1, pipeline skips auth-required) |
| `rate_limit_delay` | `float` | No | Seconds between requests (default varies by base class) |
| `cutoff_months` | `int` | No | Stop paginating after N months expired (default 3) |

## Base Classes

Choose the base class matching your source category:

```python
from scholarhub_pipeline.configs._bases import (
    BaseSourceConfig,       # Generic (2.0s delay)
    BaseAggregatorConfig,   # Aggregators (1.5s delay)
    BaseOfficialConfig,     # Official programs (3.0s delay)
    BaseGovernmentConfig,   # Government sources (3.0s delay)
    BaseFoundationConfig,   # Foundations (2.5s delay)
)
```

Each base class provides sensible defaults for `rate_limit_delay` and all optional fields. You only need to override what is unique to your source.

## Example Configs by Method

### API Source

For sources with structured JSON endpoints:

```python
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseAggregatorConfig

@dataclass
class Config(BaseAggregatorConfig):
    name: str = "ScholarshipDB API"
    url: str = "https://api.scholarshipdb.com/v1/scholarships"
    source_id: str = "scholarshipdb-api"
    primary_method: str = "api"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "results_key": "data.scholarships",
        "title": "name",
        "description": "description",
        "deadline": "application_deadline",
        "amount": "award_value",
        "country": "host_country_code",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "deadline": "application_deadline",
        "amount": "award_amount",
        "country": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "cursor",
        "selector": "data.next_cursor",
        "max_pages": 50,
    })

CONFIG = Config()
```

### JSON-LD Source

For sources with structured data in HTML `<script type="application/ld+json">` tags:

```python
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseOfficialConfig

@dataclass
class Config(BaseOfficialConfig):
    name: str = "DAAD Scholarships"
    url: str = "https://www.daad.de/en/study-and-research-in-germany/scholarships/"
    source_id: str = "daad-scholarships"
    primary_method: str = "jsonld"
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "jsonld_type": "Scholarship",
        "title": "name",
        "description": "description",
        "provider": "provider.name",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "provider": "provider_organization",
    })

CONFIG = Config()
```

### RSS Source

For sources publishing RSS or Atom feeds:

```python
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseAggregatorConfig

@dataclass
class Config(BaseAggregatorConfig):
    name: str = "ScholarshipNews RSS"
    url: str = "https://scholarshipnews.com/feed/"
    source_id: str = "scholarshipnews-rss"
    primary_method: str = "rss"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "summary",
        "link": "link",
        "published": "published",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
        "link": "source_url",
        "published": "application_deadline",
    })

CONFIG = Config()
```

### HTML Scrape Source

For sources requiring CSS selector-based extraction:

```python
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseAggregatorConfig

@dataclass
class Config(BaseAggregatorConfig):
    name: str = "AbroadPlanet"
    url: str = "https://abroadplanet.com"
    source_id: str = "abroadplanet"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .result-item, article",
        "title": "h2 a::text, h3 a::text, .title::text",
        "deadline": ".deadline::text, .date::text",
        "country": ".country::text, .location::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href)",
        "next_page": ".pagination .next::attr(href), a.next::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
        "detail_link": "source_url",
        "country": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href)",
        "max_pages": 30,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text",
        "eligibility": ".eligibility::text, .requirements::text",
        "application_url": "a.apply::attr(href), a[href*='apply']::attr(href)",
    })

CONFIG = Config()
```

### Scrapling Source

For JavaScript-heavy sites requiring browser rendering:

```python
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseSourceConfig

@dataclass
class Config(BaseSourceConfig):
    name: str = "Dynamic Scholarship Portal"
    url: str = "https://example.com/scholarships"
    source_id: str = "dynamic-portal"
    primary_method: str = "scrapling"
    rate_limit_delay: float = 5.0  # Be respectful with browser scraping
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-card",
        "title": ".card-title::text",
        "deadline": ".card-deadline::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "deadline": "application_deadline",
    })

CONFIG = Config()
```

## Selector Writing Tips

### CSS Selector Patterns

- **Comma-separated fallbacks:** `"h2 a::text, h3 a::text, .title::text"` -- tries each selector in order until one matches.
- **Pseudo-elements:** `::text` extracts text content, `::attr(href)` extracts attribute values.
- **Combining selectors:** `.parent .child` for descendant, `.parent > .child` for direct child.
- **Attribute selectors:** `a[href*='apply']` matches partial attribute values.

### Common Selector Keys

| Key | Purpose |
|-----|---------|
| `listing` | Container for each scholarship entry on listing page |
| `title` | Scholarship title text |
| `deadline` | Application deadline |
| `country` | Host country |
| `degree` | Degree level (bachelor, master, phd) |
| `amount` | Award amount |
| `detail_link` | Link to full scholarship page |
| `next_page` | Link to next page of results |

## Field Mapping Conventions

The `field_mappings` dict maps extracted field names (keys from `selectors`) to the raw_record schema fields in Convex:

| Raw Record Field | Description |
|-----------------|-------------|
| `title` | Scholarship name |
| `description` | Full description text |
| `provider_organization` | Organization offering the scholarship |
| `host_country` | Country code (ISO 3166-1 alpha-2) |
| `degree_levels` | Array of degree level strings |
| `funding_type` | One of: fully_funded, partial, tuition_waiver, stipend_only |
| `award_amount` | Amount as string |
| `award_currency` | Currency code |
| `application_deadline` | Deadline date string (normalized by pipeline) |
| `source_url` | URL to the original scholarship page |
| `application_url` | Direct link to apply |

## Pagination Configuration

The `pagination` dict controls how the scraper follows multiple pages:

```python
pagination = {
    "type": "url",       # "url", "cursor", or "page_num"
    "selector": "...",   # CSS selector or JSON key for next page
    "max_pages": 30,     # Safety limit
}
```

| Type | When to Use | Selector Points To |
|------|------------|-------------------|
| `url` | Next page link in HTML | CSS selector for href |
| `cursor` | API with cursor-based pagination | JSON path to next cursor |
| `page_num` | Page number in URL query param | Not needed (auto-incremented) |

## Detail Page Configuration

When listing pages only have titles and links, set `detail_page: bool = True` and provide `detail_selectors`:

```python
detail_page = True
detail_selectors = {
    "description": ".content p::text",
    "eligibility": ".requirements::text",
    "application_url": "a.apply::attr(href)",
}
```

The scraper will visit each detail link and extract additional fields.

## Testing a New Config

### 1. Validate config schema

```bash
cd scraping && uv run scrape validate
```

This checks all configs implement the SourceConfig protocol and have required fields.

### 2. Dry-run a single source

```bash
cd scraping && uv run scrape run --dry-run --source your-source-id
```

Writes results to `.buffer/your-source-id.json` instead of Convex.

### 3. Auto-generate starter config

```bash
cd scraping && uv run scrape gen-config https://example.com/scholarships -o src/scholarhub_pipeline/configs/new_source.py
```

Analyzes the URL and generates a starter config with detected selectors.

### 4. Run config-catalog sync test

```bash
cd scraping && uv run pytest tests/test_configs/test_config_protocol.py -x
```

Verifies all source catalog entries have matching config modules.

## Naming Conventions

Config files use the pattern: `{category}_{source_id}.py`

| Category Prefix | Source Type |
|----------------|------------|
| `agg_` | Aggregator sites |
| `off_` | Official programs |
| `gov_` | Government sources |
| `fnd_` | Foundation sources |

The module must define a `Config` dataclass and export it as `CONFIG = Config()`.

# Source Catalog

Source catalog for the ScholarHub scraping pipeline. Each JSON file in this directory contains an array of source entries that feed into the Convex `sources` table.

## Template Entry

```json
{
  "name": "Example Scholarship Portal",
  "url": "https://example.com/scholarships",
  "category": "aggregator",
  "scrape_method": "scrape",
  "trust_level": "needs_review",
  "scrape_frequency_hours": 168,
  "wave": 1,
  "is_active": true,
  "auth_required": false,
  "has_api": false,
  "estimated_volume": "~500",
  "geographic_coverage": ["europe", "global"],
  "notes": "CF: no | Fields: title, deadline, amount | Volume: ~500"
}
```

## Valid Values

### category

| Value | Description |
|-------|-------------|
| `official_program` | Named scholarship programs (DAAD, Fulbright, Chevening) |
| `university` | University-specific scholarship pages |
| `aggregator` | Sites that compile scholarships from multiple sources |
| `government` | Government-funded scholarship programs |
| `foundation` | Foundation-funded scholarship programs |

### scrape_method

| Value | Description |
|-------|-------------|
| `api` | Source provides a structured API |
| `scrape` | Standard HTTP scraping |
| `scrapling` | Requires Scrapling (Cloudflare-protected sites) |
| `rss` | RSS/Atom feed (structured XML) |

### trust_level

| Value | Description |
|-------|-------------|
| `auto_publish` | Trusted source, scraped data published without review |
| `needs_review` | Default. Scraped data requires manual review before publishing |
| `blocked` | Source is blocked from scraping |

### wave

| Wave | Category | Description |
|------|----------|-------------|
| 1-5 | Aggregators | By size/reputation, top-tier first |
| 6 | Official programs | DAAD, Fulbright, Chevening, MEXT, Erasmus |
| 7 | Government + Foundations | Government programs and foundation-funded scholarships |

## Field Documentation

### Required Fields

- **name** (string): Human-readable source name
- **url** (string): Source URL (must be HTTPS)
- **category** (string): One of the valid category values above
- **scrape_method** (string): One of the valid scrape method values above
- **scrape_frequency_hours** (number): How often to scrape, in hours (minimum 1)
- **wave** (integer): Discovery wave number (1-7)
- **is_active** (boolean): Whether the source should be scraped

### Optional Fields

- **trust_level** (string): Defaults to `needs_review`
- **auth_required** (boolean): Whether authentication is needed to scrape. Defaults to `false`
- **has_api** (boolean): Whether the source provides a structured API. Defaults to `false`
- **estimated_volume** (string): Rough count of scholarships (e.g., `"~500"`)
- **geographic_coverage** (array of strings): Countries/regions covered (e.g., `["europe", "global"]`)
- **notes** (string): Semi-structured notes with key prefixes

### Notes Field Format

Use consistent key prefixes separated by ` | `:

```
"CF: yes | Fields: title, deadline, amount | Volume: ~500 | Auth: API key needed"
```

Available prefixes:
- `CF: yes/no` -- Cloudflare protection
- `Fields: title, deadline, amount` -- Available data fields
- `Volume: ~500` -- Estimated scholarship count
- `Auth: API key needed` -- Authentication requirements
- `API: https://example.com/api` -- API endpoint URL

## Rules

1. Never delete entries from JSON files. Use `is_active: false` to deactivate.
2. URLs must be HTTPS.
3. `trust_level` defaults to `needs_review` for all new sources.
4. Enum values in JSON files must match `web/convex/schema.ts` validators exactly.
5. One entry per unique URL. Use the `url` field for deduplication.

## Validation

Validate source files against the JSON Schema:

```bash
check-jsonschema --schemafile scraping/sources/schema.json scraping/sources/*.json
```

## Testing

Run validation tests:

```bash
cd scraping && uv run pytest tests/test_seed_sources.py -x
```

"""Local enrichment pipeline — replaces Convex enrichPublish.ts.

Performs all enrichment locally in Python before writing to Convex:
- Country inference from URL TLD
- Organization inference from URL domain
- Tag generation from text analysis
- Degree level inference
- Funding boolean inference
- Match key computation for dedup
- Slug generation

This eliminates the entire enrichPublish + aggregation pipeline in Convex,
reducing hundreds of self-scheduling function calls to a single batch upsert.
"""

from __future__ import annotations

import hashlib
import re
from urllib.parse import urlparse


# ---- Country inference from URL ----

TLD_COUNTRY: dict[str, str] = {
    "au": "AU", "uk": "GB", "nz": "NZ", "sg": "SG", "jp": "JP",
    "cn": "CN", "kr": "KR", "my": "MY", "de": "DE", "fr": "FR",
    "nl": "NL", "se": "SE", "no": "NO", "dk": "DK", "fi": "FI",
    "ch": "CH", "ca": "CA", "in": "IN", "ph": "PH", "ie": "IE",
    "it": "IT", "es": "ES", "pt": "PT", "at": "AT", "be": "BE",
    "br": "BR", "mx": "MX", "za": "ZA", "ng": "NG", "ke": "KE",
    "gh": "GH", "th": "TH", "vn": "VN", "tw": "TW", "hk": "HK",
    "id": "ID", "pk": "PK", "bd": "BD", "lk": "LK", "np": "NP",
}


def infer_country_from_url(url: str | None) -> str | None:
    """Infer country code from URL TLD."""
    if not url:
        return None
    try:
        hostname = urlparse(url).hostname
        if not hostname:
            return None
        hostname = hostname.lower()
        parts = hostname.split(".")
        tld = parts[-1]
        if tld in TLD_COUNTRY:
            return TLD_COUNTRY[tld]
        if tld in ("edu", "gov"):
            return "US"
        return None
    except Exception:
        return None


# ---- Organization inference from URL ----

DOMAIN_ORG: dict[str, str] = {
    "study.anu.edu.au": "Australian National University",
    "scholarships.unimelb.edu.au": "University of Melbourne",
    "www.monash.edu": "Monash University",
    "www.sydney.edu.au": "University of Sydney",
    "scholarships.uq.edu.au": "University of Queensland",
    "www.uwa.edu.au": "University of Western Australia",
}


def infer_org_from_url(url: str | None) -> str | None:
    """Infer organization from URL domain."""
    if not url:
        return None
    try:
        hostname = urlparse(url).hostname
        if not hostname:
            return None
        return DOMAIN_ORG.get(hostname.lower())
    except Exception:
        return None


# ---- Tag generation ----

TAG_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("stem", re.compile(r"\bstem\b|engineering|science|technology|mathematics|computer|informatics", re.I)),
    ("arts_humanities", re.compile(r"arts|humanities|literature|philosophy|history|music", re.I)),
    ("business", re.compile(r"business|management|mba|commerce|accounting|finance|economics", re.I)),
    ("social_sciences", re.compile(r"sociology|psychology|political|international relations|social science", re.I)),
    ("health_medical", re.compile(r"medicine|medical|health|nursing|pharmacy|public health|clinical", re.I)),
    ("women_only", re.compile(r"women\s+only|female\s+only|for\s+women\b", re.I)),
    ("merit_based", re.compile(r"merit[\s-]based|academic\s+merit|academic\s+excellence", re.I)),
    ("need_based", re.compile(r"need[\s-]based|financial\s+need", re.I)),
    ("developing_countries", re.compile(r"developing\s+(countr|nation)|low[\s-]income|global\s+south", re.I)),
    ("no_gre", re.compile(r"no\s+gre|gre\s*(is\s*)?(not\s+)?required|gre\s*waived|without\s+gre", re.I)),
    ("research_grant", re.compile(r"research\s+(grant|funding|fellowship)|dissertation", re.I)),
    ("summer_program", re.compile(r"summer\s+(program|school)|winter\s+program", re.I)),
    ("exchange", re.compile(r"\bexchange\b|semester abroad|study abroad", re.I)),
    ("short_term", re.compile(r"short[\s-]?term|certificate|6\s*months|3\s*months", re.I)),
    ("open_to_all", re.compile(r"open to all|all nationalities|international students from any country", re.I)),
]

REGION_TO_TAG: dict[str, str] = {
    "AU": "oceania", "NZ": "oceania",
    "US": "americas", "CA": "americas", "BR": "americas", "MX": "americas",
    "GB": "europe", "DE": "europe", "FR": "europe", "NL": "europe",
    "SE": "europe", "NO": "europe", "DK": "europe", "FI": "europe",
    "CH": "europe", "IE": "europe", "IT": "europe", "ES": "europe",
    "PT": "europe", "AT": "europe", "BE": "europe",
    "JP": "asia", "CN": "asia", "KR": "asia", "SG": "asia",
    "MY": "asia", "TH": "asia", "VN": "asia", "IN": "asia",
    "PK": "asia", "BD": "asia", "LK": "asia", "NP": "asia",
    "PH": "asia", "ID": "asia", "TW": "asia", "HK": "asia",
    "ZA": "africa", "NG": "africa", "KE": "africa", "GH": "africa",
}


def generate_tags(
    title: str,
    description: str | None,
    degree_levels: list[str],
    funding_type: str,
    host_country: str | None,
    existing_tags: list[str] | None = None,
) -> list[str]:
    """Generate tags from text analysis."""
    tags = set(existing_tags or [])
    text = f"{title} {description or ''}"

    if "phd" in degree_levels or "postdoc" in degree_levels:
        tags.add("research_grant")
    if len(degree_levels) == 1 and degree_levels[0] == "bachelor":
        tags.add("undergraduate_only")
    if funding_type == "fully_funded":
        tags.add("full_degree")

    for tag_id, pattern in TAG_PATTERNS:
        if pattern.search(text):
            tags.add(tag_id)

    if host_country:
        region_tag = REGION_TO_TAG.get(host_country)
        if region_tag:
            tags.add(region_tag)

    return list(tags)


# ---- Degree level inference ----

def infer_degree_levels(
    title: str,
    description: str | None,
    existing: list[str] | None = None,
) -> list[str]:
    """Infer degree levels from text."""
    text = f"{title} {description or ''}".lower()
    levels = set(existing or [])

    if re.search(r"\b(bachelor|undergraduate|honours)\b", text):
        levels.add("bachelor")
    if re.search(r"\b(master|masters|postgraduate|mba)\b", text):
        levels.add("master")
    if re.search(r"\b(phd|doctorate|doctoral)\b", text):
        levels.add("phd")
    if re.search(r"\bpostdoc|post-doctoral|post doctoral\b", text):
        levels.add("postdoc")

    ordered = [l for l in ["bachelor", "master", "phd", "postdoc"] if l in levels]
    return ordered if ordered else ["master"]


# ---- Funding boolean inference ----

def infer_funding_booleans(
    description: str | None,
    funding_type: str,
) -> dict[str, bool]:
    """Infer funding coverage booleans from description text."""
    text = (description or "").lower()
    tuition = funding_type in ("fully_funded", "tuition_waiver")
    living = funding_type == "fully_funded"
    travel = False
    insurance = False

    if re.search(r"tuition|fee\s*(waiver|discount|reduction|cover|exempt)", text):
        tuition = True
    if re.search(r"stipend|living\s*(allowance|cost|expense)|accommodation", text):
        living = True
    if re.search(r"travel\s*(allowance|grant|support)|airfare|flight", text):
        travel = True
    if re.search(r"health\s*insurance|medical\s*(cover|insurance)|oshc", text):
        insurance = True

    return {
        "funding_tuition": tuition,
        "funding_living": living,
        "funding_travel": travel,
        "funding_insurance": insurance,
    }


# ---- Fields of study inference ----

FIELD_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("Engineering", re.compile(r"\bengineering\b", re.I)),
    ("Computer Science", re.compile(r"\b(computer\s+science|computing|software|informatics)\b", re.I)),
    ("Business", re.compile(r"\b(business|management|mba|commerce|accounting|finance)\b", re.I)),
    ("Medicine", re.compile(r"\b(medicine|medical|clinical|health\s+science|nursing|pharmacy)\b", re.I)),
    ("Law", re.compile(r"\b(law|legal|jurisprudence)\b", re.I)),
    ("Education", re.compile(r"\b(education|teaching|pedagogy)\b", re.I)),
    ("Science", re.compile(r"\b(science|physics|chemistry|biology|mathematics)\b", re.I)),
    ("Social Sciences", re.compile(r"\b(social\s+science|sociology|psychology|political\s+science)\b", re.I)),
]


def infer_fields_of_study(title: str, description: str | None) -> list[str]:
    """Infer fields of study from text."""
    text = f"{title} {description or ''}"
    fields = []
    for field, pattern in FIELD_PATTERNS:
        if pattern.search(text):
            fields.append(field)
    if not fields and re.search(r"all\s+(field|discipline|subject|program)", text, re.I):
        fields.append("All Fields")
    return fields


# ---- Match key + slug ----

def compute_match_key(title: str, org: str, country: str) -> str:
    """Compute dedup match key (mirrors aggregationHelpers.ts)."""
    normalized = f"{title.lower().strip()}|{org.lower().strip()}|{country.lower().strip()}"
    # Remove year patterns so different years of the same scholarship match
    normalized = re.sub(r"\b20\d{2}\b", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return hashlib.md5(normalized.encode()).hexdigest()[:16]


# ---- Prestige scoring (mirrors prestige.ts) ----

PRESTIGIOUS_PROVIDERS = [
    "fulbright", "rhodes trust", "daad", "chevening", "erasmus mundus",
    "gates cambridge", "mext", "csc", "schwarzman", "knight-hennessy",
    "marshall scholarship", "commonwealth scholarship", "australia awards",
    "vanier canada", "swiss government", "eiffel excellence", "monbukagakusho",
    "rotary foundation", "aga khan", "ford foundation", "mastercard foundation",
    "world bank", "wellcome trust", "turkiye burslari", "stipendium hungaricum",
]

COUNTRY_TIER_A = {
    "US", "GB", "DE", "JP", "CA", "AU", "FR", "CH", "NL", "SE",
    "SG", "KR", "DK", "NO", "FI", "AT", "BE", "IE", "HK", "NZ",
}
COUNTRY_TIER_B = {
    "CN", "IT", "ES", "IL", "TW", "CZ", "PT", "PL", "BR", "IN",
    "MX", "RU", "ZA", "AR", "CL", "TH", "MY", "TR", "HU", "GR",
}

FUNDING_SCORES = {"fully_funded": 100, "partial": 60, "tuition_waiver": 40, "stipend_only": 20}


def compute_prestige(funding_type: str, org: str, country: str, tags: list[str] | None) -> tuple[int, str]:
    """Compute prestige score + tier."""
    funding = FUNDING_SCORES.get(funding_type, 0)
    provider = 100 if any(p in org.lower() for p in PRESTIGIOUS_PROVIDERS) else 0
    c_score = 100 if country in COUNTRY_TIER_A else 60 if country in COUNTRY_TIER_B else 30
    competitive = 100 if tags and "highly_competitive" in tags else 50

    score = round(funding * 0.4 + provider * 0.3 + c_score * 0.2 + competitive * 0.1)
    tier = "gold" if score >= 75 else "silver" if score >= 50 else "bronze" if score >= 25 else "unranked"
    return score, tier


def build_search_text(title: str, description: str | None, nationalities: list[str] | None) -> str:
    """Build denormalized search text."""
    parts = [title, description or ""]
    if nationalities:
        parts.extend(nationalities)
    return " ".join(p for p in parts if p)


def to_slug(title: str) -> str:
    """Generate URL slug from title."""
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]


# ---- Full enrichment ----

def enrich_record(record: dict) -> dict:
    """Enrich a raw scraped record with inferred fields.

    Takes a raw record dict and returns a fully enriched record
    ready for direct upsert into the scholarships table.
    """
    title = (record.get("title") or "").strip()
    if not title:
        return record

    description = record.get("description")
    app_url = record.get("application_url") or record.get("source_url")

    # Country
    country = record.get("host_country")
    if not country or country in ("International", "( all countries)", ""):
        country = infer_country_from_url(app_url)
    if not country:
        country = "International"

    # Organization
    org = record.get("provider_organization")
    if not org or org == "Unknown":
        org = infer_org_from_url(app_url) or "Unknown"

    # Degree levels
    degree_levels = infer_degree_levels(
        title, description, record.get("degree_levels"),
    )

    # Funding type
    funding_type = record.get("funding_type", "partial")
    if funding_type not in ("fully_funded", "partial", "tuition_waiver", "stipend_only"):
        funding_type = "partial"

    # Funding booleans
    funding_bools = infer_funding_booleans(description, funding_type)

    # Tags
    tags = generate_tags(
        title, description, degree_levels, funding_type, country,
        record.get("tags"),
    )

    # Fields of study
    fields_of_study = record.get("fields_of_study") or infer_fields_of_study(title, description)

    # Match key + slug
    match_key = compute_match_key(title, org, country)
    slug = to_slug(title)

    # Prestige scoring (mirrors prestige.ts — avoids trigger double-write)
    prestige_score, prestige_tier = compute_prestige(funding_type, org, country, tags)
    nationalities = record.get("eligibility_nationalities")
    search_text = build_search_text(title, description, nationalities)

    enriched = {
        "title": title[:240],
        "slug": slug,
        "match_key": match_key,
        "description": (description or "")[:1800] or None,
        "provider_organization": org[:200],
        "host_country": country,
        "degree_levels": degree_levels,
        "fields_of_study": fields_of_study or None,
        "funding_type": funding_type,
        "tags": tags or None,
        "application_url": app_url,
        "source_url": record.get("source_url", app_url),
        "prestige_score": prestige_score,
        "prestige_tier": prestige_tier,
        "search_text": search_text[:1000],
        **funding_bools,
    }

    # Pass through optional fields
    for field in (
        "eligibility_nationalities", "application_deadline",
        "application_deadline_text", "award_amount_min", "award_amount_max",
        "award_currency", "source_id", "external_id", "scholarship_type",
    ):
        if record.get(field) is not None:
            enriched[field] = record[field]

    return enriched

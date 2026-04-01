"""GitHub repository scraper for curated scholarship lists.

Fetches scholarship data from GitHub repos that maintain curated lists
of scholarships in markdown tables or JSON files. Uses the GitHub API
(no auth needed for public repos) to minimize rate limiting.

This is a low-cost data source since GitHub API responses are cached
and the data changes infrequently.
"""

from __future__ import annotations

import json
import re
from typing import Any

import httpx
import structlog

from scholarhub_pipeline.configs._protocol import SourceConfig
from scholarhub_pipeline.scrapers.base import BaseScraper

logger = structlog.get_logger()

# GitHub API base URL for raw content
RAW_CONTENT_BASE = "https://raw.githubusercontent.com"
API_BASE = "https://api.github.com"

# Known GitHub repos with curated scholarship lists
GITHUB_SCHOLARSHIP_REPOS = [
    {
        "owner": "AScholarship",
        "repo": "scholarships",
        "file": "README.md",
        "format": "markdown_table",
    },
    {
        "owner": "udacity",
        "repo": "scholarships",
        "file": "README.md",
        "format": "markdown_links",
    },
]


def _parse_markdown_table(content: str) -> list[dict[str, str]]:
    """Parse markdown tables into list of dicts.

    Handles standard GitHub-flavored markdown tables with | delimiters.
    """
    records: list[dict[str, str]] = []
    lines = content.split("\n")

    headers: list[str] = []
    in_table = False

    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            in_table = False
            headers = []
            continue

        cells = [c.strip() for c in line.split("|")[1:-1]]

        if not in_table:
            # Check if this is a header row (followed by separator)
            headers = [c.lower().replace(" ", "_") for c in cells]
            in_table = True
            continue

        # Skip separator rows
        if all(re.match(r"^[-:]+$", c) for c in cells):
            continue

        if headers and len(cells) == len(headers):
            row = dict(zip(headers, cells))
            records.append(row)

    return records


def _parse_markdown_links(content: str) -> list[dict[str, str]]:
    """Extract scholarship entries from markdown link lists.

    Handles formats like:
    - [Scholarship Name](url) - Description
    - **[Name](url)** — Description text
    """
    records: list[dict[str, str]] = []
    # Match: [Title](URL) followed by optional description
    pattern = re.compile(
        r"\[([^\]]+)\]\(([^)]+)\)\s*[-–—:]*\s*(.*)",
        re.MULTILINE,
    )

    for match in pattern.finditer(content):
        title = match.group(1).strip()
        url = match.group(2).strip()
        description = match.group(3).strip()

        # Skip non-scholarship links
        if any(skip in url.lower() for skip in [
            "github.com", "twitter.com", "linkedin.com", "#",
            "contributing", "license", "readme",
        ]):
            continue

        if len(title) < 5:
            continue

        record: dict[str, str] = {
            "title": title,
            "application_url": url,
            "source_url": url,
        }
        if description:
            record["description"] = description[:1800]

        records.append(record)

    return records


def _extract_country_from_text(text: str) -> str | None:
    """Infer country from scholarship text."""
    text_lower = text.lower()
    country_map = {
        "australia": "AU", "usa": "US", "united states": "US",
        "canada": "CA", "uk": "GB", "united kingdom": "GB",
        "germany": "DE", "france": "FR", "netherlands": "NL",
        "sweden": "SE", "norway": "NO", "denmark": "DK",
        "japan": "JP", "south korea": "KR", "china": "CN",
        "singapore": "SG", "new zealand": "NZ", "ireland": "IE",
        "switzerland": "CH", "italy": "IT", "spain": "ES",
        "india": "IN", "malaysia": "MY", "brazil": "BR",
    }
    for keyword, code in country_map.items():
        if keyword in text_lower:
            return code
    return None


def _extract_degree_levels(text: str) -> list[str] | None:
    """Infer degree levels from text."""
    text_lower = text.lower()
    levels: list[str] = []
    if any(kw in text_lower for kw in ["bachelor", "undergraduate", "undergrad"]):
        levels.append("bachelor")
    if any(kw in text_lower for kw in ["master", "postgraduate", "mba"]):
        levels.append("master")
    if any(kw in text_lower for kw in ["phd", "doctoral", "doctorate"]):
        levels.append("phd")
    if "postdoc" in text_lower:
        levels.append("postdoc")
    return levels or None


class GitHubScraper(BaseScraper):
    """Scraper for GitHub-hosted scholarship lists."""

    def __init__(self, config: SourceConfig) -> None:
        super().__init__(config)
        self._repo_info = self._parse_repo_url(config.url)

    @staticmethod
    def _parse_repo_url(url: str) -> dict[str, str] | None:
        """Parse GitHub URL into owner/repo/file components."""
        # Handle raw.githubusercontent.com URLs
        raw_match = re.match(
            r"https?://raw\.githubusercontent\.com/([^/]+)/([^/]+)/[^/]+/(.+)",
            url,
        )
        if raw_match:
            return {
                "owner": raw_match.group(1),
                "repo": raw_match.group(2),
                "file": raw_match.group(3),
            }

        # Handle github.com URLs
        gh_match = re.match(
            r"https?://github\.com/([^/]+)/([^/]+)(?:/blob/[^/]+/(.+))?",
            url,
        )
        if gh_match:
            return {
                "owner": gh_match.group(1),
                "repo": gh_match.group(2),
                "file": gh_match.group(3) or "README.md",
            }

        return None

    async def scrape(self) -> list[dict]:
        """Fetch and parse scholarship data from a GitHub repo."""
        if not self._repo_info:
            logger.warning("github_invalid_url", url=self.config.url)
            return []

        owner = self._repo_info["owner"]
        repo = self._repo_info["repo"]
        file_path = self._repo_info["file"]

        # Fetch raw content (no API auth needed for public repos)
        url = f"{RAW_CONTENT_BASE}/{owner}/{repo}/main/{file_path}"
        alt_url = f"{RAW_CONTENT_BASE}/{owner}/{repo}/master/{file_path}"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url)
            if resp.status_code == 404:
                resp = await client.get(alt_url)
            if resp.status_code != 200:
                logger.warning(
                    "github_fetch_failed",
                    url=url,
                    status=resp.status_code,
                )
                return []

            content = resp.text
            self.bytes_downloaded = len(content.encode())

        # Parse based on file type
        raw_records: list[dict[str, str]]
        if file_path.endswith(".json"):
            raw_records = self._parse_json(content)
        elif file_path.endswith(".md"):
            raw_records = self._parse_markdown(content)
        else:
            logger.warning("github_unsupported_format", file=file_path)
            return []

        # Process and normalize records
        records: list[dict[str, Any]] = []
        for raw in raw_records:
            record = self._normalize_github_record(raw)
            if record:
                processed = self.process_record(record)
                records.append(processed)

        self.records_found = len(records)
        logger.info(
            "github_scrape_complete",
            owner=owner,
            repo=repo,
            records=len(records),
        )
        return records

    def _parse_json(self, content: str) -> list[dict[str, str]]:
        """Parse JSON scholarship data."""
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "scholarships" in data:
                return data["scholarships"]
            return []
        except json.JSONDecodeError:
            logger.warning("github_json_parse_error")
            return []

    def _parse_markdown(self, content: str) -> list[dict[str, str]]:
        """Parse markdown content for scholarship data."""
        # Try table format first
        table_records = _parse_markdown_table(content)
        if table_records:
            return table_records

        # Fall back to link list format
        return _parse_markdown_links(content)

    def _normalize_github_record(self, raw: dict[str, str]) -> dict[str, Any] | None:
        """Normalize a raw GitHub record to the standard schema."""
        # Map common field names
        title = (
            raw.get("title")
            or raw.get("name")
            or raw.get("scholarship")
            or raw.get("scholarship_name")
        )
        if not title or len(title.strip()) < 5:
            return None

        combined_text = f"{title} {raw.get('description', '')} {raw.get('country', '')}"

        record: dict[str, Any] = {
            "title": title.strip()[:240],
            "source_url": raw.get("application_url") or raw.get("url") or raw.get("link") or self.config.url,
        }

        # Description
        desc = raw.get("description") or raw.get("details") or raw.get("summary")
        if desc:
            record["description"] = desc.strip()[:1800]

        # Application URL
        app_url = raw.get("application_url") or raw.get("url") or raw.get("link") or raw.get("apply_url")
        if app_url:
            record["application_url"] = app_url.strip()[:1024]

        # Provider/Organization
        org = raw.get("provider_organization") or raw.get("organization") or raw.get("provider") or raw.get("university")
        if org:
            record["provider_organization"] = org.strip()[:200]

        # Country
        country = raw.get("host_country") or raw.get("country") or raw.get("location")
        if country:
            record["host_country"] = country.strip()[:120]
        elif not country:
            inferred = _extract_country_from_text(combined_text)
            if inferred:
                record["host_country"] = inferred

        # Degree levels
        degree = raw.get("degree_levels") or raw.get("level") or raw.get("degree")
        if isinstance(degree, list):
            record["degree_levels"] = degree
        elif isinstance(degree, str):
            levels = _extract_degree_levels(degree)
            if levels:
                record["degree_levels"] = levels

        if "degree_levels" not in record:
            levels = _extract_degree_levels(combined_text)
            if levels:
                record["degree_levels"] = levels

        # Funding type
        funding = raw.get("funding_type") or raw.get("funding") or raw.get("type")
        if funding:
            funding_lower = funding.lower()
            if "full" in funding_lower:
                record["funding_type"] = "fully_funded"
            elif "partial" in funding_lower:
                record["funding_type"] = "partial"

        # Deadline
        deadline = raw.get("application_deadline") or raw.get("deadline") or raw.get("due_date")
        if deadline:
            record["application_deadline"] = str(deadline).strip()[:64]

        # Award amount
        amount = raw.get("award_amount") or raw.get("amount") or raw.get("value")
        if amount:
            record["award_amount"] = str(amount).strip()[:120]

        return record

"""Inertia.js scraper for Laravel/Vue/React applications.

Handles the Inertia.js two-step protocol: fetch an initial HTML page
to extract the version hash, then use X-Inertia headers to receive
paginated JSON responses. Supports 409 version mismatch retry.
"""

from __future__ import annotations

import asyncio
import re

import httpx
import structlog

from scholarhub_pipeline.scrapers.base import BaseScraper
from scholarhub_pipeline.utils.ua_rotation import get_random_ua

logger = structlog.get_logger()


class InertiaVersionMismatchError(Exception):
    """Raised when the Inertia version hash is stale (409 response).

    Attributes:
        location: The URL from the x-inertia-location response header.
    """

    def __init__(self, location: str) -> None:
        self.location = location
        super().__init__(f"Inertia version mismatch, redirect to: {location}")


def map_study_australia_record(item: dict) -> dict:
    """Map a Study Australia Inertia API scholarship to raw_record schema.

    Args:
        item: Single scholarship dict from the Inertia API response.

    Returns:
        Dict mapped to ScholarHub raw_record fields.
    """
    organisations = item.get("organisations", [])
    provider_name = organisations[0].get("name", "") if organisations else ""

    level_names = [level["name"] for level in item.get("level_of_studies", [])]
    fos_names = [fos["name"] for fos in item.get("field_of_studies", [])]

    amount_annual = item.get("amount_annual")

    return {
        "title": item.get("name", ""),
        "description": item.get("description", ""),
        "eligibility_criteria": item.get("eligibility", ""),
        "application_deadline": item.get("closing_date"),
        "award_amount": str(amount_annual) if amount_annual else None,
        "funding_details": item.get("amount_comment", ""),
        "application_url": item.get("web_address", ""),
        "host_country": item.get("scholarship_country_name", "Australia"),
        "provider_organization": provider_name,
        "degree_level": level_names,
        "field_of_study": fos_names,
        "source_url": (
            f"https://search.studyaustralia.gov.au/scholarship/"
            f"{item.get('slug', '')}/{item.get('id', '')}"
        ),
        "is_for_international_students": item.get(
            "is_for_international_students", True
        ),
    }


class InertiaScraper(BaseScraper):
    """Scraper for Inertia.js (Laravel+Vue/React) applications.

    Fetches the Inertia version hash from an initial HTML request,
    then uses X-Inertia headers to receive paginated JSON responses.

    Handles 409 version mismatch by re-fetching the HTML page for
    a new version hash and retrying the failed request.
    """

    @staticmethod
    def _extract_inertia_version(html: str) -> str | None:
        """Extract Inertia.js version hash from SSR HTML page.

        The version is embedded in the page as HTML entities:
        ``version&quot;:&quot;{hex_hash}&quot;``

        Args:
            html: Full HTML page content.

        Returns:
            Hex version hash string, or None if not found.
        """
        match = re.search(r'version&quot;:&quot;([a-f0-9]+)&quot;', html)
        return match.group(1) if match else None

    async def scrape(self) -> list[dict]:
        """Fetch records via the Inertia.js JSON protocol with pagination.

        Steps:
        1. GET the base URL to fetch SSR HTML and extract version hash.
        2. Paginate with X-Inertia headers to receive JSON responses.
        3. Handle 409 version mismatch by re-fetching version and retrying.

        Returns:
            List of normalized raw record dicts.
        """
        records: list[dict] = []
        headers = {"User-Agent": get_random_ua()}

        async with httpx.AsyncClient(
            headers=headers, timeout=30.0, follow_redirects=True
        ) as client:
            # Step 1: Initial HTML request to get Inertia version
            initial = await client.get(self.config.url)
            initial.raise_for_status()
            self.bytes_downloaded += len(initial.content)

            version = self._extract_inertia_version(initial.text)
            if not version:
                msg = f"Could not extract Inertia version hash from {self.config.url}"
                raise ValueError(msg)

            logger.info(
                "inertia_version_extracted",
                source=self.config.name,
                version=version,
            )

            # Step 2: Paginate with Inertia JSON headers
            max_pages = (
                self.config.pagination.get("max_pages", 200)
                if self.config.pagination
                else 200
            )
            page = 1

            while page <= max_pages:
                url = f"{self.config.url}?page={page}"
                inertia_headers = {
                    "X-Inertia": "true",
                    "X-Inertia-Version": version,
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "text/html, application/xhtml+xml",
                }

                try:
                    response = await client.get(url, headers=inertia_headers)
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code == 409:
                        logger.warning(
                            "inertia_version_mismatch",
                            source=self.config.name,
                            page=page,
                        )
                        # Re-fetch HTML for new version
                        refresh = await client.get(self.config.url)
                        refresh.raise_for_status()
                        self.bytes_downloaded += len(refresh.content)

                        new_version = self._extract_inertia_version(refresh.text)
                        if not new_version:
                            raise  # noqa: TRY201

                        version = new_version
                        inertia_headers["X-Inertia-Version"] = version

                        # Retry with new version
                        response = await client.get(url, headers=inertia_headers)
                        response.raise_for_status()
                    else:
                        raise

                self.bytes_downloaded += len(response.content)
                data = response.json()

                # Extract items from Inertia props
                items_key = self.config.selectors.get("items_key", "scholarships")
                items_data = data.get("props", {}).get(items_key, {})
                items = items_data.get("data", [])
                meta = items_data.get("meta", {})

                if not items:
                    break

                for item in items:
                    if self.config.field_mappings:
                        mapped = self.apply_field_mappings(item)
                    else:
                        mapped = map_study_australia_record(item)
                    record = self.process_record(mapped)
                    records.append(record)
                    self.records_found += 1

                # Check if we've reached the last page
                per_page = meta.get("per_page", 10)
                total = meta.get("total", 0)
                if page * per_page >= total:
                    break

                page += 1
                await asyncio.sleep(self.config.rate_limit_delay)

        logger.info(
            "inertia_scrape_complete",
            source=self.config.name,
            records=self.records_found,
            bytes=self.bytes_downloaded,
        )
        return records

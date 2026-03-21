"""Tests for the Inertia.js scraper."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from scholarhub_pipeline.configs._bases import BaseSourceConfig
from scholarhub_pipeline.scrapers.inertia_scraper import (
    InertiaScraper,
    map_study_australia_record,
)

# ---- Fixtures ----

FIXTURE_DIR = Path(__file__).parent / "fixtures"

INERTIA_HTML = (
    '<html><body><div id="app" data-page="'
    '{"component":"Scholarship/List","props":{},'
    '"url":"/scholarships",'
    '"version&quot;:&quot;abc123def456&quot;"'
    '}"></div></body></html>'
)


@pytest.fixture
def mock_inertia_config() -> BaseSourceConfig:
    """Config for Inertia scraper tests."""
    return BaseSourceConfig(
        name="Test Inertia Source",
        url="https://test.example.com/scholarships",
        source_id="test-inertia",
        primary_method="inertia",
        selectors={"items_key": "scholarships"},
        field_mappings={},
        pagination={"type": "page_num", "max_pages": 200},
        rate_limit_delay=0.0,
        cutoff_months=3,
    )


@pytest.fixture
def fixture_response() -> dict:
    """Load the Inertia scholarship response fixture."""
    return json.loads((FIXTURE_DIR / "inertia_scholarship_response.json").read_text())


class FakeResponse:
    """Minimal mock of httpx.Response for Inertia tests."""

    def __init__(
        self,
        data: dict | str,
        status_code: int = 200,
        headers: dict | None = None,
    ):
        if isinstance(data, str):
            self._text = data
            self._data = None
            self.content = data.encode()
        else:
            self._data = data
            self._text = json.dumps(data)
            self.content = json.dumps(data).encode()
        self.status_code = status_code
        self.headers = headers or {}

    @property
    def text(self) -> str:
        return self._text

    def json(self) -> dict:
        if self._data is not None:
            return self._data
        return json.loads(self._text)

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"HTTP {self.status_code}",
                request=httpx.Request("GET", "http://test"),
                response=self,  # type: ignore[arg-type]
            )


# ---- Version extraction tests ----


def test_version_extraction():
    """_extract_inertia_version should extract hex hash from HTML entities."""
    html = '<html><body>version&quot;:&quot;abc123def&quot;</body></html>'
    result = InertiaScraper._extract_inertia_version(html)
    assert result == "abc123def"


def test_version_extraction_missing():
    """_extract_inertia_version should return None when no version found."""
    html = "<html>no version</html>"
    result = InertiaScraper._extract_inertia_version(html)
    assert result is None


# ---- Field mapping test ----


def test_scholarship_field_mapping():
    """map_study_australia_record should map all fields correctly."""
    item = {
        "name": "Test",
        "description": "Desc",
        "eligibility": "Elig",
        "closing_date": "2027-06-15",
        "amount_annual": 5000,
        "amount_comment": "per year",
        "web_address": "https://example.com",
        "scholarship_country_name": "Australia",
        "organisations": [{"name": "Uni of Sydney"}],
        "level_of_studies": [{"name": "Postgraduate"}],
        "field_of_studies": [{"name": "Engineering"}],
        "slug": "test-scholarship",
        "id": 123,
        "is_for_international_students": True,
    }
    result = map_study_australia_record(item)

    assert result["title"] == "Test"
    assert result["description"] == "Desc"
    assert result["eligibility_criteria"] == "Elig"
    assert result["application_deadline"] == "2027-06-15"
    assert result["award_amount"] == "5000"
    assert result["funding_details"] == "per year"
    assert result["application_url"] == "https://example.com"
    assert result["host_country"] == "Australia"
    assert result["provider_organization"] == "Uni of Sydney"
    assert result["degree_level"] == ["Postgraduate"]
    assert result["field_of_study"] == ["Engineering"]
    assert "test-scholarship/123" in result["source_url"]
    assert result["is_for_international_students"] is True


def test_scholarship_field_mapping_no_orgs():
    """map_study_australia_record should handle missing organisations."""
    item = {
        "name": "No Org",
        "description": "",
        "eligibility": "",
        "closing_date": None,
        "amount_annual": None,
        "amount_comment": "",
        "web_address": "",
        "scholarship_country_name": "Australia",
        "organisations": [],
        "level_of_studies": [],
        "field_of_studies": [],
        "slug": "no-org",
        "id": 999,
        "is_for_international_students": False,
    }
    result = map_study_australia_record(item)
    assert result["provider_organization"] == ""
    assert result["award_amount"] is None
    assert result["degree_level"] == []
    assert result["field_of_study"] == []


# ---- Scraping tests ----


def _make_inertia_page(items: list[dict], meta: dict) -> dict:
    """Build an Inertia JSON response with given items and meta."""
    return {
        "component": "Scholarship/List",
        "props": {
            "scholarships": {
                "meta": meta,
                "data": items,
            }
        },
        "url": "/scholarships",
        "version": "abc123def456",
    }


def _make_item(item_id: int) -> dict:
    """Create a minimal scholarship item for testing."""
    return {
        "id": item_id,
        "name": f"Scholarship {item_id}",
        "slug": f"scholarship-{item_id}",
        "description": f"Description for {item_id}",
        "eligibility": "Open to all",
        "closing_date": "2027-12-31",
        "amount_annual": 10000,
        "amount_comment": "Annual",
        "web_address": f"https://example.com/{item_id}",
        "scholarship_country_name": "Australia",
        "organisations": [{"name": "Test University"}],
        "level_of_studies": [{"name": "Undergraduate"}],
        "field_of_studies": [{"name": "Science"}],
        "is_for_international_students": True,
    }


@pytest.mark.asyncio
async def test_pagination(mock_inertia_config):
    """Scraper should paginate through 3 pages and return 24 records."""
    page1_items = [_make_item(i) for i in range(1, 11)]
    page2_items = [_make_item(i) for i in range(11, 21)]
    page3_items = [_make_item(i) for i in range(21, 25)]

    page1 = _make_inertia_page(page1_items, {"total": 24, "per_page": 10, "page": 1})
    page2 = _make_inertia_page(page2_items, {"total": 24, "per_page": 10, "page": 2})
    page3 = _make_inertia_page(page3_items, {"total": 24, "per_page": 10, "page": 3})

    call_count = 0

    async def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        headers = kwargs.get("headers", {})
        if "X-Inertia" not in headers:
            # Initial HTML request
            return FakeResponse(INERTIA_HTML)
        # Inertia JSON requests
        if "page=2" in url:
            return FakeResponse(page2)
        if "page=3" in url:
            return FakeResponse(page3)
        return FakeResponse(page1)

    scraper = InertiaScraper(mock_inertia_config)

    with patch("scholarhub_pipeline.scrapers.inertia_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 24
    # 1 HTML + 3 Inertia JSON = 4 calls, but client.get is called 4 times
    assert call_count == 4


@pytest.mark.asyncio
async def test_single_page(mock_inertia_config):
    """Scraper should handle a single page response correctly."""
    items = [_make_item(i) for i in range(1, 6)]
    page = _make_inertia_page(items, {"total": 5, "per_page": 10, "page": 1})

    call_count = 0

    async def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        headers = kwargs.get("headers", {})
        if "X-Inertia" not in headers:
            return FakeResponse(INERTIA_HTML)
        return FakeResponse(page)

    scraper = InertiaScraper(mock_inertia_config)

    with patch("scholarhub_pipeline.scrapers.inertia_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 5
    # 1 HTML + 1 Inertia JSON = 2 calls
    assert call_count == 2


@pytest.mark.asyncio
async def test_version_mismatch_retry(mock_inertia_config):
    """Scraper should handle 409 by re-fetching version and retrying."""
    items = [_make_item(1), _make_item(2)]
    success_page = _make_inertia_page(items, {"total": 2, "per_page": 10, "page": 1})

    call_count = 0
    inertia_attempt = 0

    async def mock_get(url, **kwargs):
        nonlocal call_count, inertia_attempt
        call_count += 1
        headers = kwargs.get("headers", {})

        if "X-Inertia" not in headers:
            # HTML requests (initial + retry)
            return FakeResponse(INERTIA_HTML)

        # Inertia JSON requests
        inertia_attempt += 1
        if inertia_attempt == 1:
            # First attempt: 409 version mismatch
            return FakeResponse(
                "",
                status_code=409,
                headers={"x-inertia-location": "https://test.example.com/scholarships"},
            )
        # Second attempt: success
        return FakeResponse(success_page)

    scraper = InertiaScraper(mock_inertia_config)

    with patch("scholarhub_pipeline.scrapers.inertia_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 2
    # 1 initial HTML + 1 failed Inertia + 1 retry HTML + 1 success Inertia = 4
    assert call_count == 4


@pytest.mark.asyncio
async def test_empty_response(mock_inertia_config):
    """Scraper should return empty list for empty data array."""
    empty_page = _make_inertia_page([], {"total": 0, "per_page": 10, "page": 1})

    async def mock_get(url, **kwargs):
        headers = kwargs.get("headers", {})
        if "X-Inertia" not in headers:
            return FakeResponse(INERTIA_HTML)
        return FakeResponse(empty_page)

    scraper = InertiaScraper(mock_inertia_config)

    with patch("scholarhub_pipeline.scrapers.inertia_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert records == []


@pytest.mark.asyncio
async def test_max_pages_limit(mock_inertia_config):
    """Scraper should stop after max_pages even if more data exists."""
    # Override max_pages to 2
    mock_inertia_config.pagination = {"type": "page_num", "max_pages": 2}

    items = [_make_item(i) for i in range(1, 11)]
    # Report total of 1000 to simulate many pages
    page = _make_inertia_page(items, {"total": 1000, "per_page": 10, "page": 1})

    inertia_calls = 0

    async def mock_get(url, **kwargs):
        nonlocal inertia_calls
        headers = kwargs.get("headers", {})
        if "X-Inertia" not in headers:
            return FakeResponse(INERTIA_HTML)
        inertia_calls += 1
        return FakeResponse(page)

    scraper = InertiaScraper(mock_inertia_config)

    with patch("scholarhub_pipeline.scrapers.inertia_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    # max_pages=2, so should get 2 pages of 10 items = 20
    assert len(records) == 20
    assert inertia_calls == 2

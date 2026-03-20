"""Tests for the API scraper."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest

from scholarhub_pipeline.configs._bases import BaseSourceConfig
from scholarhub_pipeline.scrapers.api_scraper import ApiScraper


@pytest.fixture
def api_config(mock_source_config):
    """Return the shared mock_source_config for API tests."""
    return mock_source_config


@pytest.fixture
def expired_config():
    """Config where test data will appear expired (cutoff_months=0 forces all past dates expired)."""
    return BaseSourceConfig(
        name="Expired Test API",
        url="https://api.example.com/old",
        source_id="test-expired",
        primary_method="api",
        selectors={"items_path": "items"},
        field_mappings={
            "name": "title",
            "deadline": "application_deadline",
        },
        cutoff_months=0,
        rate_limit_delay=0.0,
    )


class FakeResponse:
    """Minimal mock of httpx.Response."""

    def __init__(self, data: dict, status_code: int = 200):
        self._data = data
        self.status_code = status_code
        self.content = json.dumps(data).encode()

    def json(self):
        return self._data

    def raise_for_status(self):
        if self.status_code >= 400:
            import httpx

            raise httpx.HTTPStatusError(
                "Error",
                request=httpx.Request("GET", "http://test"),
                response=self,
            )


@pytest.mark.asyncio
async def test_api_scraper_extracts_records(api_config, mock_api_response):
    """API scraper should extract and normalize records from JSON response."""
    scraper = ApiScraper(api_config)

    # Mock httpx.AsyncClient to return our test data (single page, no next)
    response_data = dict(mock_api_response)
    response_data["meta"]["next_url"] = None  # single page

    async def mock_get(url, **kwargs):
        return FakeResponse(response_data)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 2
    assert records[0]["title"] == "Global Excellence Award"
    assert records[1]["title"] == "Arts & Humanities Fellowship"
    # Check normalization happened (UK -> GB)
    assert records[1]["host_country"] == "GB"
    assert scraper.records_found == 2
    assert scraper.bytes_downloaded > 0


@pytest.mark.asyncio
async def test_api_scraper_follows_pagination(api_config, mock_api_response, mock_api_response_page2):
    """API scraper should follow pagination links across multiple pages."""
    scraper = ApiScraper(api_config)
    call_count = 0

    async def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return FakeResponse(mock_api_response)
        return FakeResponse(mock_api_response_page2)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 3
    assert call_count == 2
    assert records[2]["title"] == "Innovation Grant"


@pytest.mark.asyncio
async def test_api_scraper_stops_at_cutoff(expired_config):
    """API scraper should stop collecting records when deadline is beyond cutoff."""
    scraper = ApiScraper(expired_config)

    response_data = {
        "items": [
            {
                "name": "Old Scholarship",
                "deadline": "2020-01-01",
            },
            {
                "name": "Current Scholarship",
                "deadline": "2027-12-01",
            },
        ],
    }

    async def mock_get(url, **kwargs):
        return FakeResponse(response_data)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    # Should return empty because the first item triggers cutoff
    assert len(records) == 0


@pytest.mark.asyncio
async def test_api_scraper_handles_empty_response(api_config):
    """API scraper should handle an empty items array gracefully."""
    scraper = ApiScraper(api_config)

    response_data = {"data": {"scholarships": []}}

    async def mock_get(url, **kwargs):
        return FakeResponse(response_data)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert records == []
    assert scraper.records_found == 0


@pytest.mark.asyncio
async def test_api_scraper_extract_items_flat_list(api_config):
    """API scraper should handle a flat JSON list (no items_path needed)."""
    config = BaseSourceConfig(
        name="Flat API",
        url="https://api.example.com/flat",
        source_id="test-flat",
        primary_method="api",
        selectors={},  # No items_path
        field_mappings={"name": "title", "link": "source_url"},
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    response_data = [
        {"name": "Flat Item 1", "link": "https://example.com/1"},
        {"name": "Flat Item 2", "link": "https://example.com/2"},
    ]

    async def mock_get(url, **kwargs):
        return FakeResponse({"__list__": True})

    # Test _extract_items directly
    items = scraper._extract_items(response_data)
    assert len(items) == 2
    assert items[0]["name"] == "Flat Item 1"

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
        self.text = json.dumps(data)

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


class CsvFakeResponse:
    """Minimal mock of httpx.Response for CSV content."""

    def __init__(self, text: str, status_code: int = 200):
        self.text = text
        self.status_code = status_code
        self.content = text.encode()

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


@pytest.mark.asyncio
async def test_api_scraper_handles_csv_format():
    """API scraper should parse CSV responses when selectors.format == 'csv'."""
    config = BaseSourceConfig(
        name="CSV Test API",
        url="https://api.example.com/csv",
        source_id="test-csv",
        primary_method="api",
        selectors={"format": "csv"},
        field_mappings={"Name": "title", "Amount": "award_amount"},
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    csv_text = "Name,Amount\nTest Scholarship,5000\nAnother Award,3000"

    async def mock_get(url, **kwargs):
        return CsvFakeResponse(csv_text)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 2
    assert records[0]["title"] == "Test Scholarship"
    assert records[0]["award_amount"] == "5000"
    assert records[1]["title"] == "Another Award"
    assert records[1]["award_amount"] == "3000"
    assert scraper.records_found == 2


class HtmlFakeResponse:
    """Minimal mock of httpx.Response for HTML content (e.g., __NEXT_DATA__)."""

    def __init__(self, html: str, status_code: int = 200):
        self.text = html
        self.status_code = status_code
        self.content = html.encode()

    def json(self):
        raise ValueError("Not a JSON response")

    def raise_for_status(self):
        if self.status_code >= 400:
            import httpx

            raise httpx.HTTPStatusError(
                "Error",
                request=httpx.Request("GET", "http://test"),
                response=self,
            )


@pytest.mark.asyncio
async def test_api_scraper_nextdata_format():
    """API scraper should extract records from __NEXT_DATA__ JSON in HTML."""
    config = BaseSourceConfig(
        name="NextData Test",
        url="https://example.com/scholarships",
        source_id="test-nextdata",
        primary_method="api",
        selectors={
            "format": "nextdata",
            "items_path": "props.pageProps.results",
        },
        field_mappings={
            "scholarship_name": "title",
            "institution_name.value": "provider_organization",
            "funding_type": "funding_type",
        },
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    nextdata_json = json.dumps({
        "props": {
            "pageProps": {
                "results": [
                    {
                        "scholarship_name": "Test Award",
                        "institution_name": {"value": "Test University", "key": "Test University"},
                        "funding_type": "Fee waiver/discount",
                    },
                    {
                        "scholarship_name": "Another Award",
                        "institution_name": {"value": "Another Uni", "key": "Another Uni"},
                        "funding_type": "Cash",
                    },
                ],
            },
        },
    })
    html = f'<html><body><script id="__NEXT_DATA__" type="application/json">{nextdata_json}</script></body></html>'

    async def mock_get(url, **kwargs):
        return HtmlFakeResponse(html)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 2
    assert records[0]["title"] == "Test Award"
    assert records[0]["provider_organization"] == "Test University"
    assert records[1]["title"] == "Another Award"
    assert records[1]["funding_type"] == "Cash"
    assert scraper.records_found == 2


@pytest.mark.asyncio
async def test_api_scraper_nextdata_missing_script():
    """API scraper should return empty list when __NEXT_DATA__ script tag is missing."""
    config = BaseSourceConfig(
        name="NextData Missing Test",
        url="https://example.com/scholarships",
        source_id="test-nextdata-missing",
        primary_method="api",
        selectors={
            "format": "nextdata",
            "items_path": "props.pageProps.results",
        },
        field_mappings={"scholarship_name": "title"},
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    html = "<html><body><p>No next data here</p></body></html>"

    async def mock_get(url, **kwargs):
        return HtmlFakeResponse(html)

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
async def test_api_scraper_page_num_pagination():
    """API scraper should construct page_num URLs like {base}?page={start+N}."""
    config = BaseSourceConfig(
        name="PageNum Test",
        url="https://example.com/search",
        source_id="test-pagenum",
        primary_method="api",
        selectors={"items_path": "items"},
        field_mappings={"name": "title"},
        pagination={
            "type": "page_num",
            "param": "page",
            "start": 1,
            "max_pages": 3,
        },
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    urls_called = []

    async def mock_get(url, **kwargs):
        urls_called.append(url)
        return FakeResponse({"items": [{"name": f"Item from {url}"}]})

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(urls_called) == 3
    assert urls_called[0] == "https://example.com/search"
    assert urls_called[1] == "https://example.com/search?page=2"
    assert urls_called[2] == "https://example.com/search?page=3"
    assert len(records) == 3


@pytest.mark.asyncio
async def test_api_scraper_max_records():
    """API scraper should stop collecting after max_records is reached."""
    config = BaseSourceConfig(
        name="MaxRecords Test",
        url="https://example.com/data",
        source_id="test-maxrecords",
        primary_method="api",
        selectors={"items_path": "items"},
        field_mappings={"name": "title"},
        max_records=2,
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    response_data = {
        "items": [
            {"name": "Item 1"},
            {"name": "Item 2"},
            {"name": "Item 3"},
            {"name": "Item 4"},
            {"name": "Item 5"},
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

    assert len(records) == 2
    assert records[0]["title"] == "Item 1"
    assert records[1]["title"] == "Item 2"


@pytest.mark.asyncio
async def test_api_scraper_nextdata_detail_pages():
    """API scraper should fetch detail pages and merge extra fields for nextdata sources."""
    config = BaseSourceConfig(
        name="NextData Detail Test",
        url="https://example.com/scholarships",
        source_id="test-nextdata-detail",
        primary_method="api",
        selectors={
            "format": "nextdata",
            "items_path": "props.pageProps.results",
            "detail_url_template": "https://example.com/scholarship/{url_slug.institution_name}/{slug:scholarship_name}/{scholarship_id}/",
            "detail_items_path": "props.pageProps.apiData",
            "detail_field_mappings": {
                "eligibility_req": "eligibility_criteria",
                "scholarship_award_website": "application_url",
                "award_coverage": "award_coverage",
                "category": "field_of_study",
            },
        },
        field_mappings={
            "scholarship_name": "title",
            "scholarship_id": "external_id",
            "institution_name.value": "provider_organization",
        },
        detail_page=True,
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    # Listing page HTML with __NEXT_DATA__
    listing_json = json.dumps({
        "props": {
            "pageProps": {
                "results": [
                    {
                        "scholarship_id": "12345",
                        "scholarship_name": "Test Award",
                        "institution_name": {"value": "Test University", "key": "Test University"},
                        "url_slug": {"institution_name": "test-university"},
                    },
                ],
            },
        },
    })
    listing_html = f'<html><script id="__NEXT_DATA__" type="application/json">{listing_json}</script></html>'

    # Detail page HTML with __NEXT_DATA__
    detail_json = json.dumps({
        "props": {
            "pageProps": {
                "apiData": {
                    "eligibility_req": "<p>Must be international student</p>",
                    "scholarship_award_website": "https://apply.test-university.com",
                    "award_coverage": "Tuition fees",
                    "category": {"1": "Engineering", "7": "Business"},
                },
            },
        },
    })
    detail_html = f'<html><script id="__NEXT_DATA__" type="application/json">{detail_json}</script></html>'

    call_count = 0

    async def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if "scholarship/" in url:
            return HtmlFakeResponse(detail_html)
        return HtmlFakeResponse(listing_html)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 1
    assert records[0]["title"] == "Test Award"
    assert records[0]["provider_organization"] == "Test University"
    # Detail page fields merged
    assert records[0]["application_url"] == "https://apply.test-university.com"
    assert records[0]["award_coverage"] == "Tuition fees"
    assert "Engineering" in records[0]["field_of_study"]
    # HTML stripped from eligibility
    assert "international student" in records[0].get("eligibility_criteria", "")
    # Should have made 2 calls: listing + detail
    assert call_count == 2


@pytest.mark.asyncio
async def test_api_scraper_csv_sets_host_country_default():
    """API scraper should set host_country from selectors.host_country_default for CSV."""
    config = BaseSourceConfig(
        name="CSV Country Test",
        url="https://api.example.com/csv",
        source_id="test-csv-country",
        primary_method="api",
        selectors={"format": "csv", "host_country_default": "Japan"},
        field_mappings={"Name": "title"},
        rate_limit_delay=0.0,
    )
    scraper = ApiScraper(config)

    csv_text = "Name\nTokyo Scholarship"

    async def mock_get(url, **kwargs):
        return CsvFakeResponse(csv_text)

    with patch("scholarhub_pipeline.scrapers.api_scraper.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.get = mock_get
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        records = await scraper.scrape()

    assert len(records) == 1
    assert records[0]["host_country"] == "JP"  # normalized from "Japan"

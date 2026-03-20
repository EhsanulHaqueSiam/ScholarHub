"""Shared pytest fixtures for ScholarHub pipeline tests."""

from __future__ import annotations

from pathlib import Path

import pytest

from scholarhub_pipeline.configs._bases import BaseSourceConfig


def pytest_addoption(parser: pytest.Parser) -> None:
    """Add --record flag for record-playback test harness."""
    parser.addoption(
        "--record",
        action="store_true",
        default=False,
        help="Record live HTTP responses to fixtures directory for playback tests.",
    )


@pytest.fixture
def recorded_responses_dir() -> Path:
    """Path to the tests/fixtures/ directory for recorded HTTP responses."""
    fixtures_dir = Path(__file__).parent / "fixtures"
    fixtures_dir.mkdir(exist_ok=True)
    return fixtures_dir


@pytest.fixture
def mock_source_config() -> BaseSourceConfig:
    """Create a BaseSourceConfig with test values for API scraping."""
    return BaseSourceConfig(
        name="Test Scholarship API",
        url="https://api.example.com/scholarships",
        source_id="test-api",
        primary_method="api",
        selectors={"items_path": "data.scholarships"},
        field_mappings={
            "name": "title",
            "desc": "description",
            "link": "source_url",
            "deadline": "application_deadline",
            "country": "host_country",
            "amount": "award_amount",
        },
        pagination={
            "type": "cursor",
            "cursor_path": "meta.next_url",
            "max_pages": 5,
        },
        detail_page=False,
        rate_limit_delay=0.0,
        cutoff_months=3,
    )


@pytest.fixture
def mock_html_config() -> BaseSourceConfig:
    """Create a BaseSourceConfig with test values for HTML scraping."""
    return BaseSourceConfig(
        name="Test HTML Source",
        url="https://example.com/scholarships",
        source_id="test-html",
        primary_method="scrape",
        selectors={
            "listing": ".scholarship-item",
            "title": "h3.title::text",
            "deadline": ".deadline::text",
            "amount": ".amount::text",
            "next_page": "a.next::attr(href)",
        },
        field_mappings={
            "title": "title",
            "deadline": "application_deadline",
            "amount": "award_amount",
        },
        detail_page=False,
        rate_limit_delay=0.0,
        cutoff_months=3,
    )


@pytest.fixture
def mock_api_response() -> dict:
    """Sample JSON API response with scholarship data."""
    return {
        "data": {
            "scholarships": [
                {
                    "name": "Global Excellence Award",
                    "desc": "A scholarship for international students pursuing STEM degrees.",
                    "link": "https://example.com/scholarships/1",
                    "deadline": "2027-06-15",
                    "country": "Germany",
                    "amount": "15000",
                },
                {
                    "name": "Arts & Humanities Fellowship",
                    "desc": "Supporting creative and critical thinkers worldwide.",
                    "link": "https://example.com/scholarships/2",
                    "deadline": "2027-09-01",
                    "country": "UK",
                    "amount": "10000",
                },
            ],
        },
        "meta": {
            "next_url": "https://api.example.com/scholarships?page=2",
            "total": 50,
        },
    }


@pytest.fixture
def mock_api_response_page2() -> dict:
    """Sample JSON API response for page 2 (last page, no next)."""
    return {
        "data": {
            "scholarships": [
                {
                    "name": "Innovation Grant",
                    "desc": "For students developing new technologies in emerging markets.",
                    "link": "https://example.com/scholarships/3",
                    "deadline": "2027-12-01",
                    "country": "USA",
                    "amount": "20000",
                },
            ],
        },
        "meta": {
            "next_url": None,
            "total": 50,
        },
    }


@pytest.fixture
def mock_html_page() -> str:
    """Sample HTML page with scholarship listings."""
    return """<!DOCTYPE html>
<html>
<body>
<div class="results">
  <div class="scholarship-item">
    <h3 class="title">European Research Grant</h3>
    <span class="deadline">2027-08-15</span>
    <span class="amount">EUR 12000</span>
    <a href="/detail/1">More Info</a>
  </div>
  <div class="scholarship-item">
    <h3 class="title">Pacific Rim Fellowship</h3>
    <span class="deadline">2027-11-30</span>
    <span class="amount">AUD 8000</span>
    <a href="/detail/2">More Info</a>
  </div>
  <div class="scholarship-item">
    <h3 class="title">Nordic Exchange Program</h3>
    <span class="deadline">2027-05-01</span>
    <span class="amount">SEK 50000</span>
    <a href="/detail/3">More Info</a>
  </div>
</div>
<a class="next" href="/scholarships?page=2">Next</a>
</body>
</html>"""


@pytest.fixture
def mock_rss_feed() -> str:
    """Sample RSS XML content with scholarship entries."""
    return """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Scholarship Alerts</title>
  <link>https://example.com/feed</link>
  <item>
    <title>DAAD Scholarship for Developing Countries</title>
    <link>https://example.com/daad-scholarship</link>
    <description>Full funding for masters and PhD students from developing nations.</description>
    <pubDate>Mon, 15 Jan 2027 00:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Chevening Scholarship UK</title>
    <link>https://example.com/chevening</link>
    <description>UK government scholarship for future leaders.</description>
    <pubDate>Tue, 01 Mar 2027 00:00:00 GMT</pubDate>
  </item>
</channel>
</rss>"""

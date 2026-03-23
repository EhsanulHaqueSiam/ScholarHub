"""Tests for the HTML scraper using Scrapling Fetcher."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from scrapling import Selector

from scholarhub_pipeline.configs._bases import BaseSourceConfig
from scholarhub_pipeline.scrapers.html_scraper import HtmlScraper


def _make_response(html: str, url: str = "https://example.com") -> MagicMock:
    """Build a mock Scrapling response from raw HTML.

    Uses a real Scrapling Selector for CSS parsing so that
    tests exercise actual selector logic.
    """
    sel = Selector(html)
    mock = MagicMock()
    mock.css = sel.css
    mock.body = html.encode("utf-8")
    mock.urljoin = lambda path: url.rstrip("/") + "/" + path.lstrip("/")
    return mock


@pytest.fixture
def html_config():
    """Source config for HTML scraper tests."""
    return BaseSourceConfig(
        name="Test HTML Source",
        url="https://example.com/scholarships",
        source_id="test-html",
        primary_method="scrape",
        selectors={
            "listing": ".scholarship-item",
            "title": "h3.title",
            "deadline": ".deadline",
            "amount": ".amount",
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


SAMPLE_HTML = """<html><body>
<div class="scholarship-item">
  <h3 class="title">European Research Grant</h3>
  <span class="deadline">2027-08-15</span>
  <span class="amount">EUR 12000</span>
</div>
<div class="scholarship-item">
  <h3 class="title">Pacific Rim Fellowship</h3>
  <span class="deadline">2027-11-30</span>
  <span class="amount">AUD 8000</span>
</div>
<div class="scholarship-item">
  <h3 class="title">Nordic Exchange Program</h3>
  <span class="deadline">2027-05-01</span>
  <span class="amount">SEK 50000</span>
</div>
</body></html>"""


SAMPLE_HTML_PAGE2 = """<html><body>
<div class="scholarship-item">
  <h3 class="title">Asian Development Scholarship</h3>
  <span class="deadline">2027-07-01</span>
  <span class="amount">USD 20000</span>
</div>
</body></html>"""


@pytest.mark.asyncio
async def test_html_scraper_extracts_records(html_config):
    """HTML scraper should extract records from mock HTML with listing items."""
    scraper = HtmlScraper(html_config)

    response = _make_response(SAMPLE_HTML)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    assert len(records) == 3
    assert records[0]["title"] == "European Research Grant"
    assert records[1]["title"] == "Pacific Rim Fellowship"
    assert records[2]["title"] == "Nordic Exchange Program"
    assert scraper.records_found == 3


@pytest.mark.asyncio
async def test_html_scraper_applies_field_mappings(html_config):
    """HTML scraper should map extracted fields to canonical names."""
    scraper = HtmlScraper(html_config)

    response = _make_response(SAMPLE_HTML)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    # field_mappings maps title->title, deadline->application_deadline, amount->award_amount
    assert "application_deadline" in records[0]
    assert "award_amount" in records[0]


@pytest.mark.asyncio
async def test_html_scraper_follows_pagination(html_config):
    """HTML scraper should follow pagination via next_page selector."""
    # Add pagination with next link
    html_with_next = SAMPLE_HTML.replace(
        "</body>",
        '<a class="next" href="/scholarships?page=2">Next</a></body>',
    )

    scraper = HtmlScraper(html_config)
    call_count = 0

    def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _make_response(html_with_next, url)
        return _make_response(SAMPLE_HTML_PAGE2, url)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", side_effect=mock_get):
        records = await scraper.scrape()

    assert len(records) == 4  # 3 from page 1 + 1 from page 2
    assert call_count == 2


@pytest.mark.asyncio
async def test_html_scraper_fuzzy_fallback():
    """HTML scraper should trigger fuzzy fallback when configured selectors miss."""
    # Config with a selector that won't match anything
    config = BaseSourceConfig(
        name="Broken Selector Source",
        url="https://example.com/scholarships",
        source_id="test-broken",
        primary_method="scrape",
        selectors={
            "listing": ".nonexistent-selector",
            "title": "h3",
        },
        field_mappings={"title": "title"},
        detail_page=False,
        rate_limit_delay=0.0,
        cutoff_months=3,
    )

    # HTML with article tags that fuzzy fallback should find
    html_with_articles = """<html><body>
    <article><h3>Scholarship A</h3></article>
    <article><h3>Scholarship B</h3></article>
    <article><h3>Scholarship C</h3></article>
    <article><h3>Scholarship D</h3></article>
    </body></html>"""

    scraper = HtmlScraper(config)
    response = _make_response(html_with_articles)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    # Fuzzy fallback should find "article" pattern (4 items >= 3 min)
    assert len(records) >= 3


@pytest.mark.asyncio
async def test_html_scraper_single_page_fallback_when_no_listings():
    """When listing selectors miss, scraper should still parse single-page opportunities."""
    config = BaseSourceConfig(
        name="Single Page Source",
        url="https://example.com/scholarship-detail",
        source_id="test-single-page",
        primary_method="scrape",
        selectors={
            "listing": ".missing-listing",
            "title": "h1.page-title",
            "description": ".summary",
        },
        field_mappings={"title": "title", "description": "description"},
        detail_page=False,
        rate_limit_delay=0.0,
    )

    html = """<html><body>
    <h1 class="page-title">Global Excellence Scholarship</h1>
    <div class="summary">Fully funded opportunity for international students.</div>
    </body></html>"""

    scraper = HtmlScraper(config)
    response = _make_response(html, "https://example.com/scholarship-detail")

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    assert len(records) == 1
    assert records[0]["title"] == "Global Excellence Scholarship"
    assert records[0]["source_url"] == "https://example.com/scholarship-detail"


@pytest.mark.asyncio
async def test_html_scraper_stops_at_expired_cutoff():
    """HTML scraper should stop collecting records when deadline is past cutoff."""
    config = BaseSourceConfig(
        name="Cutoff Test",
        url="https://example.com/scholarships",
        source_id="test-cutoff",
        primary_method="scrape",
        selectors={
            "listing": ".scholarship-item",
            "title": "h3.title",
            "deadline": ".deadline",
        },
        field_mappings={
            "title": "title",
            "deadline": "application_deadline",
        },
        cutoff_months=0,  # Forces all past dates to be expired
        rate_limit_delay=0.0,
    )

    # First item has an old deadline that triggers cutoff
    html = """<html><body>
    <div class="scholarship-item">
      <h3 class="title">Old Scholarship</h3>
      <span class="deadline">2020-01-01</span>
    </div>
    <div class="scholarship-item">
      <h3 class="title">Good Scholarship</h3>
      <span class="deadline">2027-12-01</span>
    </div>
    </body></html>"""

    scraper = HtmlScraper(config)
    response = _make_response(html)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    # Should stop at first expired item, return 0
    assert len(records) == 0


@pytest.mark.asyncio
async def test_html_scraper_respects_max_records(html_config):
    """HTML scraper should stop once max_records is reached."""
    html_config.max_records = 2
    scraper = HtmlScraper(html_config)
    response = _make_response(SAMPLE_HTML)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", return_value=response):
        records = await scraper.scrape()

    assert len(records) == 2
    assert scraper.records_found == 2


@pytest.mark.asyncio
async def test_html_scraper_incremental_limits_pagination(html_config):
    """Incremental mode should cap pagination to incremental_max_pages."""
    html_with_next = SAMPLE_HTML.replace(
        "</body>",
        '<a class="next" href="/scholarships?page=2">Next</a></body>',
    )
    html_config.incremental_mode = True
    html_config.incremental_max_pages = 1

    scraper = HtmlScraper(html_config)
    call_count = 0

    def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _make_response(html_with_next, url)
        return _make_response(SAMPLE_HTML_PAGE2, url)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", side_effect=mock_get):
        records = await scraper.scrape()

    assert len(records) == 3
    assert call_count == 1


@pytest.mark.asyncio
async def test_html_scraper_incremental_skips_detail_page_fetch():
    """Incremental mode should skip detail page requests when configured."""
    config = BaseSourceConfig(
        name="Incremental Detail Skip",
        url="https://example.com/list",
        source_id="test-incremental-skip",
        primary_method="scrape",
        selectors={
            "listing": ".item",
            "title": "h3",
            "detail_link": "a::attr(href)",
        },
        field_mappings={"title": "title"},
        detail_page=True,
        detail_selectors={"description": ".detail"},
        rate_limit_delay=0.0,
        incremental_mode=True,
        incremental_skip_detail=True,
    )

    listing_html = """<html><body>
    <div class="item">
      <h3>Scholarship</h3>
      <a href="/detail/1">View</a>
    </div>
    </body></html>"""

    scraper = HtmlScraper(config)
    call_count = 0

    def mock_get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        return _make_response(listing_html, url)

    with patch("scholarhub_pipeline.scrapers.html_scraper.Fetcher.get", side_effect=mock_get):
        records = await scraper.scrape()

    assert len(records) == 1
    assert call_count == 1

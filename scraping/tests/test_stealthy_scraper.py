"""Tests for the Stealthy scraper using StealthyFetcher.

These tests mock StealthyFetcher to avoid requiring a real browser.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from scrapling import Selector

from scholarhub_pipeline.configs._bases import BaseSourceConfig
from scholarhub_pipeline.scrapers.stealthy_scraper import StealthyScraper


def _make_response(html: str, url: str = "https://example.com") -> MagicMock:
    """Build a mock Scrapling response from raw HTML."""
    sel = Selector(html)
    mock = MagicMock()
    mock.css = sel.css
    mock.body = html.encode("utf-8")
    mock.urljoin = lambda path: url.rstrip("/") + "/" + path.lstrip("/")
    return mock


@pytest.fixture
def stealthy_config():
    """Source config for stealthy scraper tests."""
    return BaseSourceConfig(
        name="CF-Protected Source",
        url="https://protected.example.com/scholarships",
        source_id="test-stealthy",
        primary_method="scrapling",
        selectors={
            "listing": ".scholarship-card",
            "title": "h2.name",
            "deadline": ".due-date",
            "next_page": "a.load-more::attr(href)",
        },
        field_mappings={
            "title": "title",
            "deadline": "application_deadline",
        },
        detail_page=False,
        rate_limit_delay=0.0,
        cutoff_months=3,
    )


STEALTHY_HTML = """<html><body>
<div class="scholarship-card">
  <h2 class="name">Cloudflare Scholarship Alpha</h2>
  <span class="due-date">2027-10-15</span>
</div>
<div class="scholarship-card">
  <h2 class="name">Cloudflare Scholarship Beta</h2>
  <span class="due-date">2027-12-01</span>
</div>
</body></html>"""

STEALTHY_HTML_PAGE2 = """<html><body>
<div class="scholarship-card">
  <h2 class="name">Cloudflare Scholarship Gamma</h2>
  <span class="due-date">2028-01-15</span>
</div>
</body></html>"""


@pytest.mark.asyncio
async def test_stealthy_scraper_extracts_records(stealthy_config):
    """Stealthy scraper should extract records from CF-protected pages."""
    scraper = StealthyScraper(stealthy_config)
    response = _make_response(STEALTHY_HTML)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        return_value=response,
    ):
        records = await scraper.scrape()

    assert len(records) == 2
    assert records[0]["title"] == "Cloudflare Scholarship Alpha"
    assert records[1]["title"] == "Cloudflare Scholarship Beta"
    assert scraper.records_found == 2


@pytest.mark.asyncio
async def test_stealthy_scraper_handles_pagination(stealthy_config):
    """Stealthy scraper should follow pagination links."""
    html_with_next = STEALTHY_HTML.replace(
        "</body>",
        '<a class="load-more" href="/scholarships?page=2">More</a></body>',
    )

    scraper = StealthyScraper(stealthy_config)
    call_count = 0

    def mock_fetch(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _make_response(html_with_next, url)
        return _make_response(STEALTHY_HTML_PAGE2, url)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        side_effect=mock_fetch,
    ):
        records = await scraper.scrape()

    assert len(records) == 3
    assert call_count == 2


@pytest.mark.asyncio
async def test_stealthy_scraper_follows_detail_pages():
    """Stealthy scraper should follow detail page links when configured."""
    config = BaseSourceConfig(
        name="Detail Test Source",
        url="https://protected.example.com/list",
        source_id="test-stealthy-detail",
        primary_method="scrapling",
        selectors={
            "listing": ".item",
            "title": "h3",
            "detail_link": "a::attr(href)",
        },
        field_mappings={"title": "title", "description": "description"},
        detail_page=True,
        detail_selectors={
            "description": ".full-description",
        },
        rate_limit_delay=0.0,
        cutoff_months=3,
    )

    listing_html = """<html><body>
    <div class="item">
      <h3>Scholarship With Detail</h3>
      <a href="/detail/1">View</a>
    </div>
    </body></html>"""

    detail_html = """<html><body>
    <div class="full-description">This is the full description of the scholarship program.</div>
    </body></html>"""

    scraper = StealthyScraper(config)
    call_count = 0

    def mock_fetch(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if "detail" in url:
            return _make_response(detail_html, url)
        return _make_response(listing_html, url)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        side_effect=mock_fetch,
    ):
        records = await scraper.scrape()

    assert len(records) == 1
    assert records[0]["title"] == "Scholarship With Detail"
    assert "description" in records[0]


@pytest.mark.asyncio
async def test_stealthy_scraper_respects_max_records(stealthy_config):
    """Stealthy scraper should stop once max_records is reached."""
    stealthy_config.max_records = 1
    scraper = StealthyScraper(stealthy_config)
    response = _make_response(STEALTHY_HTML)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        return_value=response,
    ):
        records = await scraper.scrape()

    assert len(records) == 1
    assert scraper.records_found == 1


@pytest.mark.asyncio
async def test_stealthy_scraper_single_page_fallback_when_no_listings():
    """When listing selectors miss, stealthy scraper should parse single-page opportunities."""
    config = BaseSourceConfig(
        name="Stealth Single Page",
        url="https://protected.example.com/detail",
        source_id="test-stealth-single-page",
        primary_method="scrapling",
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
    <h1 class="page-title">Stealth Fellowship Program</h1>
    <div class="summary">Opportunity for graduate applicants.</div>
    </body></html>"""

    scraper = StealthyScraper(config)
    response = _make_response(html, "https://protected.example.com/detail")

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        return_value=response,
    ):
        records = await scraper.scrape()

    assert len(records) == 1
    assert records[0]["title"] == "Stealth Fellowship Program"
    assert records[0]["source_url"] == "https://protected.example.com/detail"


@pytest.mark.asyncio
async def test_stealthy_scraper_incremental_limits_pagination(stealthy_config):
    """Incremental mode should cap pagination to incremental_max_pages."""
    html_with_next = STEALTHY_HTML.replace(
        "</body>",
        '<a class="load-more" href="/scholarships?page=2">More</a></body>',
    )
    stealthy_config.incremental_mode = True
    stealthy_config.incremental_max_pages = 1
    scraper = StealthyScraper(stealthy_config)
    call_count = 0

    def mock_fetch(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _make_response(html_with_next, url)
        return _make_response(STEALTHY_HTML_PAGE2, url)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        side_effect=mock_fetch,
    ):
        records = await scraper.scrape()

    assert len(records) == 2
    assert call_count == 1


@pytest.mark.asyncio
async def test_stealthy_scraper_incremental_skips_detail_fetch():
    """Incremental mode should skip detail page requests when configured."""
    config = BaseSourceConfig(
        name="Stealth Incremental Detail Skip",
        url="https://protected.example.com/list",
        source_id="stealth-incremental-skip",
        primary_method="scrapling",
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

    scraper = StealthyScraper(config)
    call_count = 0

    def mock_fetch(url, **kwargs):
        nonlocal call_count
        call_count += 1
        return _make_response(listing_html, url)

    with patch(
        "scholarhub_pipeline.scrapers.stealthy_scraper.StealthyFetcher.fetch",
        side_effect=mock_fetch,
    ):
        records = await scraper.scrape()

    assert len(records) == 1
    assert call_count == 1

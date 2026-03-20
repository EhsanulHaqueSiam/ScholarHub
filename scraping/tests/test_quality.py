"""Tests for the quality flag detection module."""

from scholarhub_pipeline.ingestion.quality import check_quality


class TestCheckQuality:
    def test_missing_title_empty(self):
        record = {"title": "", "source_url": "https://example.com"}
        flags = check_quality(record)
        assert "missing_title" in flags

    def test_missing_title_absent(self):
        record = {"source_url": "https://example.com"}
        flags = check_quality(record)
        assert "missing_title" in flags

    def test_missing_source_url_empty(self):
        record = {"title": "Good Title", "source_url": ""}
        flags = check_quality(record)
        assert "missing_source_url" in flags

    def test_missing_source_url_absent(self):
        record = {"title": "Good Title"}
        flags = check_quality(record)
        assert "missing_source_url" in flags

    def test_suspiciously_short_title(self):
        record = {"title": "Hi", "source_url": "https://example.com"}
        flags = check_quality(record)
        assert "suspiciously_short_title" in flags

    def test_suspiciously_short_description(self):
        record = {
            "title": "Good Title",
            "source_url": "https://example.com",
            "description": "Short",
        }
        flags = check_quality(record)
        assert "suspiciously_short_description" in flags

    def test_unparseable_deadline(self):
        record = {
            "title": "Good Title",
            "source_url": "https://example.com",
            "application_deadline": "Rolling basis",
        }
        flags = check_quality(record)
        assert "unparseable_deadline" in flags

    def test_unrecognized_country(self):
        record = {
            "title": "Good Title",
            "source_url": "https://example.com",
            "host_country": "Unknown Country XYZ",
        }
        flags = check_quality(record)
        assert "unrecognized_country" in flags

    def test_valid_record_no_flags(self):
        record = {
            "title": "DAAD Scholarship for International Students",
            "source_url": "https://www.daad.de/scholarship",
            "description": "A full scholarship for international students studying in Germany.",
            "host_country": "Germany",
            "application_deadline": "2026-12-31",
        }
        flags = check_quality(record)
        assert flags == []

    def test_multiple_issues_all_flags(self):
        record = {
            "title": "",
            "source_url": "",
            "description": "Short",
            "host_country": "Unknown Country XYZ",
            "application_deadline": "Rolling basis",
        }
        flags = check_quality(record)
        assert "missing_title" in flags
        assert "missing_source_url" in flags
        assert "suspiciously_short_description" in flags
        assert "unrecognized_country" in flags
        assert "unparseable_deadline" in flags

    def test_recognized_country_no_flag(self):
        record = {
            "title": "Good Title",
            "source_url": "https://example.com",
            "host_country": "Germany",
        }
        flags = check_quality(record)
        assert "unrecognized_country" not in flags

    def test_valid_deadline_no_flag(self):
        record = {
            "title": "Good Title",
            "source_url": "https://example.com",
            "application_deadline": "December 31, 2026",
        }
        flags = check_quality(record)
        assert "unparseable_deadline" not in flags

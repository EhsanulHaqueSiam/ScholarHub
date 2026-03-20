"""Tests for the data normalization module."""

from scholarhub_pipeline.ingestion.normalizer import (
    normalize_country,
    normalize_currency,
    normalize_date,
    normalize_record,
)


class TestNormalizeCountry:
    def test_germany(self):
        assert normalize_country("Germany") == "DE"

    def test_united_states_full(self):
        assert normalize_country("United States of America") == "US"

    def test_uk_common_variant(self):
        assert normalize_country("UK") == "GB"

    def test_south_korea(self):
        assert normalize_country("South Korea") == "KR"

    def test_unknown_country_passthrough(self):
        result = normalize_country("Unknown Country XYZ")
        assert result == "Unknown Country XYZ"

    def test_usa_variant(self):
        assert normalize_country("USA") == "US"

    def test_russia(self):
        assert normalize_country("Russia") == "RU"

    def test_taiwan(self):
        assert normalize_country("Taiwan") == "TW"

    def test_hong_kong(self):
        assert normalize_country("Hong Kong") == "HK"

    def test_empty_string(self):
        assert normalize_country("") == ""


class TestNormalizeDate:
    def test_long_month_format(self):
        assert normalize_date("December 31, 2026") == "2026-12-31"

    def test_slash_format(self):
        assert normalize_date("31/12/2026") == "2026-12-31"

    def test_iso_with_time(self):
        assert normalize_date("2026-12-31T23:59:59Z") == "2026-12-31"

    def test_rolling_basis_returns_none(self):
        assert normalize_date("Rolling basis") is None

    def test_empty_string_returns_none(self):
        assert normalize_date("") is None

    def test_none_returns_none(self):
        assert normalize_date(None) is None

    def test_iso_date_only(self):
        assert normalize_date("2026-06-15") == "2026-06-15"


class TestNormalizeCurrency:
    def test_dollar_sign(self):
        assert normalize_currency("$") == "USD"

    def test_eur_code(self):
        assert normalize_currency("EUR") == "EUR"

    def test_euro_word(self):
        assert normalize_currency("euro") == "EUR"

    def test_pounds_word(self):
        assert normalize_currency("pounds") == "GBP"

    def test_unknown_passthrough(self):
        assert normalize_currency("unknown_curr") == "unknown_curr"

    def test_usd_code(self):
        assert normalize_currency("usd") == "USD"

    def test_yen_word(self):
        assert normalize_currency("yen") == "JPY"

    def test_empty_string(self):
        assert normalize_currency("") == ""


class TestNormalizeRecord:
    def test_normalizes_country_field(self):
        record = {"host_country": "Germany", "title": "Test"}
        result = normalize_record(record)
        assert result["host_country"] == "DE"

    def test_normalizes_deadline_field(self):
        record = {"application_deadline": "December 31, 2026", "title": "Test"}
        result = normalize_record(record)
        assert result["application_deadline"] == "2026-12-31"

    def test_normalizes_currency_field(self):
        record = {"award_currency": "euro", "title": "Test"}
        result = normalize_record(record)
        assert result["award_currency"] == "EUR"

    def test_does_not_mutate_original(self):
        record = {"host_country": "Germany", "title": "Test"}
        normalize_record(record)
        assert record["host_country"] == "Germany"

    def test_preserves_other_fields(self):
        record = {"title": "Big Scholarship", "source_url": "https://example.com"}
        result = normalize_record(record)
        assert result["title"] == "Big Scholarship"
        assert result["source_url"] == "https://example.com"

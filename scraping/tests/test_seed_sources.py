"""Tests for JSON Schema validation of source entries."""

import json
from pathlib import Path

import jsonschema
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "sources" / "schema.json"
FIXTURES_PATH = REPO_ROOT / "tests" / "fixtures" / "sample_sources.json"


@pytest.fixture()
def schema():
    """Load the JSON Schema for source entries."""
    with open(SCHEMA_PATH) as f:
        return json.load(f)


@pytest.fixture()
def fixtures():
    """Load sample source entries."""
    with open(FIXTURES_PATH) as f:
        return json.load(f)


def test_valid_source_passes_validation(schema):
    """A valid sample source entry passes JSON Schema validation."""
    valid_entry = [
        {
            "name": "TestSource",
            "url": "https://example.com/scholarships",
            "category": "aggregator",
            "scrape_method": "scrape",
            "scrape_frequency_hours": 168,
            "wave": 1,
            "is_active": True,
        }
    ]
    jsonschema.validate(instance=valid_entry, schema=schema)


def test_missing_url_fails_validation(schema):
    """Entry missing required field 'url' fails validation."""
    invalid_entry = [
        {
            "name": "NoURLSource",
            "category": "aggregator",
            "scrape_method": "scrape",
            "scrape_frequency_hours": 168,
            "wave": 1,
            "is_active": True,
        }
    ]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid_entry, schema=schema)


def test_invalid_category_fails_validation(schema):
    """Entry with invalid category value fails validation."""
    invalid_entry = [
        {
            "name": "BadCategory",
            "url": "https://example.com",
            "category": "blog",
            "scrape_method": "scrape",
            "scrape_frequency_hours": 168,
            "wave": 1,
            "is_active": True,
        }
    ]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid_entry, schema=schema)


def test_invalid_scrape_method_fails_validation(schema):
    """Entry with invalid scrape_method fails validation."""
    invalid_entry = [
        {
            "name": "BadMethod",
            "url": "https://example.com",
            "category": "aggregator",
            "scrape_method": "manual",
            "scrape_frequency_hours": 168,
            "wave": 1,
            "is_active": True,
        }
    ]
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid_entry, schema=schema)


def test_all_fixture_entries_pass_validation(schema, fixtures):
    """All 5 fixture entries (one per category) pass validation."""
    jsonschema.validate(instance=fixtures, schema=schema)
    assert len(fixtures) == 5
    categories = {entry["category"] for entry in fixtures}
    assert categories == {"aggregator", "official_program", "government", "foundation", "university"}

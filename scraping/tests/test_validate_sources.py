"""Tests for validate_sources.py URL normalization, dedup, and loading."""

import json
import sys
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from validate_sources import find_duplicates, load_all_sources, normalize_url


def test_normalize_url_strips_www():
    assert normalize_url("https://www.example.com/path") == "https://example.com/path"


def test_normalize_url_strips_trailing_slash():
    assert normalize_url("https://example.com/path/") == "https://example.com/path"


def test_normalize_url_forces_https():
    assert normalize_url("http://example.com") == "https://example.com/"


def test_normalize_url_strips_query_params():
    assert normalize_url("https://example.com?foo=bar") == "https://example.com/"


def test_find_duplicates_detects_duplicates_after_normalization():
    sources = [
        {"name": "Source A", "url": "https://www.example.com", "_file": "a.json"},
        {"name": "Source B", "url": "https://example.com/", "_file": "b.json"},
    ]
    duplicates = find_duplicates(sources)
    assert len(duplicates) == 1
    assert len(duplicates[0]["entries"]) == 2


def test_find_duplicates_allows_different_paths():
    sources = [
        {"name": "Source A", "url": "https://example.com/scholarships", "_file": "a.json"},
        {"name": "Source B", "url": "https://example.com/grants", "_file": "b.json"},
    ]
    duplicates = find_duplicates(sources)
    assert len(duplicates) == 0


def test_load_all_sources_skips_schema_and_report(tmp_path):
    # Create a sample source file
    sample = [{"name": "Test", "url": "https://example.com", "category": "aggregator"}]
    (tmp_path / "aggregators.json").write_text(json.dumps(sample))

    # Create files that should be skipped
    (tmp_path / "schema.json").write_text(json.dumps({"type": "array"}))
    (tmp_path / "validation_report.json").write_text(json.dumps({"total": 0}))

    sources = load_all_sources(tmp_path)
    assert len(sources) == 1
    assert sources[0]["name"] == "Test"
    assert sources[0]["_file"] == "aggregators.json"

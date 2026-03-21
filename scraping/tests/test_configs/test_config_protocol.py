"""Validate all source configs against the SourceConfig protocol."""

import json
from pathlib import Path

import pytest

from scholarhub_pipeline.configs import discover_configs
from scholarhub_pipeline.configs._protocol import SourceConfig

VALID_METHODS = {"api", "jsonld", "ajax", "rss", "scrape", "scrapling", "inertia"}


def get_catalog_sources() -> list[dict]:
    """Load all source entries from JSON catalogs."""
    sources_dir = Path(__file__).parent.parent.parent / "sources"
    all_sources: list[dict] = []
    for f in sources_dir.glob("*.json"):
        if f.name == "schema.json":
            continue
        all_sources.extend(json.loads(f.read_text()))
    return all_sources


class TestConfigProtocol:
    """Tests that all source configs implement the SourceConfig protocol."""

    def test_all_configs_implement_protocol(self) -> None:
        """Every config must implement SourceConfig protocol."""
        configs = discover_configs()
        for config in configs:
            assert isinstance(
                config, SourceConfig
            ), f"{config} does not implement SourceConfig"

    def test_all_configs_have_required_fields(self) -> None:
        """Every config must have non-empty name, url, source_id, primary_method."""
        configs = discover_configs()
        for config in configs:
            assert config.name, f"Config {config} has empty name"
            assert config.url, f"Config {config.name} has empty url"
            assert config.source_id, f"Config {config.name} has empty source_id"
            assert config.primary_method, f"Config {config.name} has empty primary_method"
            assert config.primary_method in VALID_METHODS, (
                f"Config {config.name} has invalid method: {config.primary_method}"
            )

    def test_all_configs_have_selectors(self) -> None:
        """Every config must have selectors (even API/RSS get selector-like keys)."""
        configs = discover_configs()
        for config in configs:
            assert config.selectors, f"Config {config.name} has no selectors"

    def test_all_configs_have_field_mappings(self) -> None:
        """Every config must have field_mappings."""
        configs = discover_configs()
        for config in configs:
            assert config.field_mappings, f"Config {config.name} has no field_mappings"

    def test_config_count_matches_catalog(self) -> None:
        """Number of configs should match number of active sources in catalog."""
        configs = discover_configs()
        catalog = get_catalog_sources()
        active_catalog = [s for s in catalog if s.get("is_active", True)]
        # Allow small variance (auth_required sources may be included but skipped)
        assert len(configs) >= len(active_catalog) - 5, (
            f"Expected ~{len(active_catalog)} configs, got {len(configs)}"
        )

    def test_config_catalog_sync(self) -> None:
        """Every active catalog source should have a matching config."""
        configs = discover_configs()
        config_names = {c.name for c in configs}
        catalog = get_catalog_sources()
        missing = []
        for source in catalog:
            if not source.get("is_active", True):
                continue
            if source["name"] not in config_names:
                missing.append(source["name"])
        assert not missing, f"Sources without configs: {missing}"

    def test_no_duplicate_source_ids(self) -> None:
        """All source_ids must be unique."""
        configs = discover_configs()
        ids = [c.source_id for c in configs]
        dupes = [x for x in ids if ids.count(x) > 1]
        assert not dupes, f"Duplicate source_ids: {set(dupes)}"

    def test_rate_limit_delay_positive(self) -> None:
        """All configs must have a positive rate_limit_delay."""
        configs = discover_configs()
        for config in configs:
            assert config.rate_limit_delay > 0, (
                f"Config {config.name} has non-positive rate_limit_delay"
            )

    def test_auth_required_configs_flagged(self) -> None:
        """Auth-required catalog sources should have auth_config set."""
        configs = discover_configs()
        catalog = get_catalog_sources()
        auth_sources = {s["name"] for s in catalog if s.get("auth_required")}
        config_map = {c.name: c for c in configs}
        for name in auth_sources:
            if name in config_map:
                config = config_map[name]
                assert config.auth_config is not None, (
                    f"Auth-required source {name} has no auth_config"
                )

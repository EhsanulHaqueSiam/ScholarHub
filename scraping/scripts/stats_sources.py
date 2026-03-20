#!/usr/bin/env python3
"""Report catalog coverage statistics from source JSON files."""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

SKIP_FILES = {"schema.json", "validation_report.json"}

# Map geographic_coverage values to high-level regions
REGION_MAP: dict[str, str] = {
    "global": "Global",
    "europe": "Europe",
    "germany": "Europe",
    "france": "Europe",
    "netherlands": "Europe",
    "sweden": "Europe",
    "norway": "Europe",
    "denmark": "Europe",
    "finland": "Europe",
    "switzerland": "Europe",
    "austria": "Europe",
    "belgium": "Europe",
    "ireland": "Europe",
    "italy": "Europe",
    "spain": "Europe",
    "portugal": "Europe",
    "poland": "Europe",
    "czech-republic": "Europe",
    "united-kingdom": "Europe",
    "united-states": "Americas",
    "canada": "Americas",
    "mexico": "Americas",
    "brazil": "Americas",
    "argentina": "Americas",
    "chile": "Americas",
    "colombia": "Americas",
    "japan": "Asia",
    "south-korea": "Asia",
    "china": "Asia",
    "india": "Asia",
    "singapore": "Asia",
    "malaysia": "Asia",
    "thailand": "Asia",
    "taiwan": "Asia",
    "hong-kong": "Asia",
    "middle-east": "Asia",
    "turkey": "Asia",
    "australia": "Oceania",
    "new-zealand": "Oceania",
    "south-africa": "Africa",
    "kenya": "Africa",
    "nigeria": "Africa",
    "egypt": "Africa",
    "africa": "Africa",
}


def load_sources(source_dir: Path) -> list[dict]:
    """Load all source entries from JSON files in a directory.

    Skips schema.json and validation_report.json.

    Args:
        source_dir: Path to the directory containing JSON source files.

    Returns:
        Flat list of all source entry dicts.
    """
    sources: list[dict] = []
    for json_file in sorted(source_dir.glob("*.json")):
        if json_file.name in SKIP_FILES:
            continue
        with open(json_file) as f:
            entries = json.load(f)
        sources.extend(entries)
    return sources


def compute_stats(sources: list[dict]) -> dict:
    """Compute coverage statistics from source entries.

    Args:
        sources: List of source entry dicts.

    Returns:
        Dict with total, by_category, by_wave, by_scrape_method,
        active, inactive, with_api, auth_required, and by_region counts.
    """
    by_category: dict[str, int] = defaultdict(int)
    by_wave: dict[int, int] = defaultdict(int)
    by_scrape_method: dict[str, int] = defaultdict(int)
    by_region: dict[str, int] = defaultdict(int)
    active = 0
    inactive = 0
    with_api = 0
    auth_required = 0

    for source in sources:
        by_category[source.get("category", "unknown")] += 1
        by_wave[source.get("wave", 0)] += 1
        by_scrape_method[source.get("scrape_method", "unknown")] += 1

        if source.get("is_active", False):
            active += 1
        else:
            inactive += 1

        if source.get("has_api", False):
            with_api += 1

        if source.get("auth_required", False):
            auth_required += 1

        for geo in source.get("geographic_coverage", []):
            region = REGION_MAP.get(geo.lower(), "Other")
            by_region[region] += 1

    return {
        "total": len(sources),
        "by_category": dict(sorted(by_category.items())),
        "by_wave": dict(sorted(by_wave.items())),
        "by_scrape_method": dict(sorted(by_scrape_method.items())),
        "active": active,
        "inactive": inactive,
        "with_api": with_api,
        "auth_required": auth_required,
        "by_region": dict(sorted(by_region.items())),
    }


def print_stats(stats: dict) -> None:
    """Print formatted statistics to stdout.

    Args:
        stats: Statistics dict from compute_stats.
    """
    print("ScholarHub Source Catalog Statistics")
    print("====================================")
    total = stats["total"]
    active = stats["active"]
    inactive = stats["inactive"]
    print(f"Total sources: {total} ({active} active, {inactive} inactive)")

    print("\nBy Category:")
    max_cat_len = max(len(k) for k in stats["by_category"]) if stats["by_category"] else 0
    for category, count in stats["by_category"].items():
        print(f"  {category + ':':.<{max_cat_len + 2}} {count}")

    print("\nBy Wave:")
    for wave, count in stats["by_wave"].items():
        print(f"  Wave {wave}: {count}")

    print("\nBy Scrape Method:")
    max_method_len = (
        max(len(k) for k in stats["by_scrape_method"]) if stats["by_scrape_method"] else 0
    )
    for method, count in stats["by_scrape_method"].items():
        print(f"  {method + ':':.<{max_method_len + 2}} {count}")

    print(f"\nAPI available: {stats['with_api']}")
    print(f"Auth required: {stats['auth_required']}")

    if stats["by_region"]:
        print("\nBy Region:")
        max_region_len = max(len(k) for k in stats["by_region"])
        for region, count in stats["by_region"].items():
            print(f"  {region + ':':.<{max_region_len + 2}} {count}")


def main() -> None:
    """CLI entry point for catalog statistics report."""
    parser = argparse.ArgumentParser(
        description="Report catalog coverage statistics from source JSON files."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scraping/sources"),
        help="Directory containing JSON source files (default: scraping/sources)",
    )
    args = parser.parse_args()

    if not args.source_dir.exists():
        print(f"Error: Source directory not found: {args.source_dir}", file=sys.stderr)
        sys.exit(1)

    sources = load_sources(args.source_dir)
    if not sources:
        print("No source entries found.")
        return

    stats = compute_stats(sources)
    print_stats(stats)


if __name__ == "__main__":
    main()

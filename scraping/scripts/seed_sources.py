#!/usr/bin/env python3
"""Seed source catalog JSON files to Convex sources table."""

import argparse
import json
import sys
from pathlib import Path

import jsonschema

from scholarhub_scraping.convex_client import get_convex_client

SKIP_FILES = {"schema.json", "validation_report.json"}


def load_and_validate(source_dir: Path) -> tuple[list[dict], int]:
    """Load all JSON files from source_dir and validate against schema.

    Args:
        source_dir: Path to directory containing JSON source files.

    Returns:
        Tuple of (flat list of all source entries, number of files loaded).

    Raises:
        jsonschema.ValidationError: If any file fails schema validation.
        FileNotFoundError: If schema.json is not found.
    """
    schema_path = source_dir / "schema.json"
    if not schema_path.exists():
        msg = f"Schema file not found: {schema_path}"
        raise FileNotFoundError(msg)

    with open(schema_path) as f:
        schema = json.load(f)

    sources: list[dict] = []
    file_count = 0

    for json_file in sorted(source_dir.glob("*.json")):
        if json_file.name in SKIP_FILES:
            continue
        with open(json_file) as f:
            entries = json.load(f)

        jsonschema.validate(instance=entries, schema=schema)
        file_count += 1
        sources.extend(entries)

    return sources, file_count


def prepare_for_convex(entry: dict) -> dict:
    """Prepare a source entry dict for the Convex upsertSource mutation.

    Removes internal keys (like ``_file``), strips None values for
    non-optional fields, and sets a default trust_level.

    Args:
        entry: Source entry dict from JSON file.

    Returns:
        Cleaned dict ready for Convex mutation.
    """
    # Keys to exclude from Convex payload
    exclude_keys = {"_file"}

    cleaned = {k: v for k, v in entry.items() if k not in exclude_keys and v is not None}

    # Default trust_level if not present
    if "trust_level" not in cleaned:
        cleaned["trust_level"] = "needs_review"

    return cleaned


def seed_sources(source_dir: Path, *, dry_run: bool = False) -> None:
    """Load, validate, and seed source entries to Convex.

    Args:
        source_dir: Path to directory containing JSON source files.
        dry_run: If True, print what would be seeded without calling Convex.
    """
    sources, file_count = load_and_validate(source_dir)

    if not sources:
        print("No source entries found.")
        return

    if dry_run:
        print(f"[DRY RUN] Would seed {len(sources)} sources from {file_count} files")
        for entry in sources:
            prepared = prepare_for_convex(entry)
            print(f"  - {prepared['name']}: {prepared['url']}")
        return

    client = get_convex_client()
    seeded = 0
    for entry in sources:
        prepared = prepare_for_convex(entry)
        client.mutation("sources:upsertSource", prepared)
        seeded += 1

    print(f"Seeded {seeded} sources from {file_count} files")


def main() -> None:
    """CLI entry point for seeding source catalog to Convex."""
    parser = argparse.ArgumentParser(
        description="Seed source catalog JSON files to Convex sources table."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scraping/sources"),
        help="Directory containing JSON source files (default: scraping/sources)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be seeded without calling Convex",
    )
    args = parser.parse_args()

    if not args.source_dir.exists():
        print(f"Error: Source directory not found: {args.source_dir}", file=sys.stderr)
        sys.exit(1)

    seed_sources(args.source_dir, dry_run=args.dry_run)


if __name__ == "__main__":
    main()

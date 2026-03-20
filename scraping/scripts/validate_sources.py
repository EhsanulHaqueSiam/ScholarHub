#!/usr/bin/env python3
"""Validate source catalog URLs for reachability and detect duplicates."""

import argparse
import asyncio
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import aiohttp

CONCURRENCY = 20
TIMEOUT = aiohttp.ClientTimeout(total=10)
SKIP_FILES = {"schema.json", "validation_report.json"}


def normalize_url(url: str) -> str:
    """Normalize URL for dedup: force HTTPS, strip www/trailing slash/query/fragment.

    Args:
        url: The URL to normalize.

    Returns:
        Normalized URL string.
    """
    parsed = urlparse(url)
    scheme = "https"
    netloc = parsed.netloc.lower().removeprefix("www.")
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((scheme, netloc, path, "", "", ""))


def load_all_sources(source_dir: Path) -> list[dict]:
    """Load all source entries from JSON files in a directory.

    Skips schema.json and validation_report.json. Adds a ``_file`` key
    to each entry for reporting.

    Args:
        source_dir: Path to the directory containing JSON source files.

    Returns:
        Flat list of all source entry dicts with ``_file`` key added.
    """
    sources: list[dict] = []
    for json_file in sorted(source_dir.glob("*.json")):
        if json_file.name in SKIP_FILES:
            continue
        with open(json_file) as f:
            entries = json.load(f)
        for entry in entries:
            entry["_file"] = json_file.name
            sources.append(entry)
    return sources


def find_duplicates(sources: list[dict]) -> list[dict]:
    """Detect duplicate URLs after normalization.

    Args:
        sources: List of source entry dicts (must have ``url`` key).

    Returns:
        List of dicts with ``normalized_url`` and ``entries`` for any
        normalized URL appearing 2+ times.
    """
    groups: dict[str, list[dict]] = defaultdict(list)
    for source in sources:
        normalized = normalize_url(source["url"])
        groups[normalized].append({
            "name": source.get("name", "Unknown"),
            "url": source["url"],
            "file": source.get("_file", "unknown"),
        })

    return [
        {"normalized_url": url, "entries": entries}
        for url, entries in groups.items()
        if len(entries) >= 2
    ]


async def check_url(
    session: aiohttp.ClientSession,
    semaphore: asyncio.Semaphore,
    entry: dict,
) -> dict:
    """Check a single URL for reachability.

    Args:
        session: Shared aiohttp session.
        semaphore: Concurrency-limiting semaphore.
        entry: Source entry dict with at least ``name`` and ``url`` keys.

    Returns:
        Result dict with name, url, status, final_url, redirected,
        reachable, and error fields.
    """
    url = entry["url"]
    name = entry.get("name", "Unknown")
    async with semaphore:
        try:
            async with session.get(
                url, timeout=TIMEOUT, allow_redirects=True
            ) as resp:
                final_url = str(resp.url)
                return {
                    "name": name,
                    "url": url,
                    "status": resp.status,
                    "final_url": final_url,
                    "redirected": final_url != url,
                    "reachable": True,
                    "error": None,
                }
        except Exception as e:
            return {
                "name": name,
                "url": url,
                "status": None,
                "final_url": None,
                "redirected": False,
                "reachable": False,
                "error": str(e),
            }


async def validate_all(sources: list[dict]) -> list[dict]:
    """Validate all source URLs with concurrency limit.

    Args:
        sources: List of source entry dicts.

    Returns:
        List of result dicts from check_url.
    """
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession() as session:
        tasks = [check_url(session, semaphore, entry) for entry in sources]
        return await asyncio.gather(*tasks)


def write_report(
    results: list[dict],
    duplicates: list[dict],
    output_path: Path,
) -> None:
    """Write a JSON validation report.

    Args:
        results: URL check results from validate_all.
        duplicates: Duplicate detection results from find_duplicates.
        output_path: Path to write the JSON report.
    """
    reachable = sum(1 for r in results if r["reachable"])
    unreachable = sum(1 for r in results if not r["reachable"])
    redirected = sum(1 for r in results if r["redirected"])

    report = {
        "checked_at": datetime.now(tz=timezone.utc).isoformat(),
        "total": len(results),
        "reachable": reachable,
        "unreachable": unreachable,
        "redirected": redirected,
        "duplicates": duplicates,
        "results": results,
    }

    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)


def print_summary(
    results: list[dict],
    duplicates: list[dict],
) -> None:
    """Print a human-readable validation summary to stdout.

    Args:
        results: URL check results.
        duplicates: Duplicate detection results.
    """
    reachable = sum(1 for r in results if r["reachable"])
    unreachable_results = [r for r in results if not r["reachable"]]
    redirected = sum(1 for r in results if r["redirected"])

    print("Source Catalog Validation Report")
    print("================================")
    print(f"Total sources: {len(results)}")
    print(f"Reachable: {reachable}")
    print(f"Unreachable: {len(unreachable_results)}")
    print(f"Redirected: {redirected}")
    print(f"Duplicate URLs: {len(duplicates)}")

    if unreachable_results:
        print("\nUnreachable URLs:")
        for r in unreachable_results:
            print(f"  - {r['name']}: {r['url']} (error: {r['error']})")

    if duplicates:
        print("\nDuplicate URLs (after normalization):")
        for dup in duplicates:
            entries_str = ", ".join(
                f"{e['file']} ({e['name']})" for e in dup["entries"]
            )
            print(f"  - {dup['normalized_url']} found in: {entries_str}")


def main() -> None:
    """Run URL validation and dedup detection on the source catalog."""
    parser = argparse.ArgumentParser(
        description="Validate source catalog URLs and detect duplicates."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("scraping/sources"),
        help="Directory containing JSON source files (default: scraping/sources)",
    )
    args = parser.parse_args()

    source_dir = args.source_dir
    if not source_dir.exists():
        print(f"Error: Source directory not found: {source_dir}", file=sys.stderr)
        sys.exit(1)

    sources = load_all_sources(source_dir)
    if not sources:
        print("No source entries found.")
        return

    duplicates = find_duplicates(sources)
    results = asyncio.run(validate_all(sources))

    write_report(results, duplicates, source_dir / "validation_report.json")
    print_summary(results, duplicates)


if __name__ == "__main__":
    main()

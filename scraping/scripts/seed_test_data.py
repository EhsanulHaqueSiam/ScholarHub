#!/usr/bin/env python3
"""Seed Convex with realistic fake scholarship data for Phase 4/5 development.

Generates randomized but realistic scholarship records and inserts them
via the pipeline's Convex client. Useful for UI development, testing
dedup/aggregation logic, and demonstrating the system.
"""

from __future__ import annotations

import argparse
import json
import random
import time

SAMPLE_TITLES = [
    "DAAD Research Grant for Doctoral Candidates",
    "Chevening Scholarship 2026",
    "Erasmus Mundus Joint Master Degrees",
    "MEXT Research Student Scholarship",
    "Fulbright Foreign Student Program",
    "Commonwealth Scholarships 2026",
    "Gates Cambridge Scholarship",
    "Rhodes Scholarship",
    "Swiss Government Excellence Scholarships",
    "China Scholarship Council Awards",
    "Clarendon Scholarship at Oxford",
    "Australia Awards Scholarships",
    "KAUST Fellowship Program",
    "New Zealand Scholarships",
    "Korean Government Scholarship Program",
    "Swedish Institute Scholarships",
    "Netherlands Fellowship Programme",
    "Vanier Canada Graduate Scholarships",
    "Schwarzman Scholars Program",
    "Rotary Peace Fellowships",
    "ADB-Japan Scholarship Program",
    "OFID Scholarship Award",
    "Aga Khan Foundation International Scholarship",
    "Mastercard Foundation Scholars Program",
    "Joint Japan/World Bank Graduate Scholarship",
    "VLIR-UOS Scholarships",
    "Eiffel Excellence Scholarship Programme",
    "Stipendium Hungaricum Scholarship",
    "Turkey Burslari Scholarship",
    "Russian Government Scholarship",
    "Italian Government Scholarships",
    "Brunei Darussalam Government Scholarship",
    "Mexican Government Scholarships for Foreigners",
    "OAS Academic Scholarship Program",
    "TWAS-DFG Cooperation Visits Programme",
    "Endeavour Leadership Program",
    "ETH Zurich Excellence Scholarship",
    "University of Tokyo MEXT Scholarship",
    "Cambridge Trust Scholarship",
    "Denys Holland Scholarship at UCL",
    "Lester B. Pearson International Scholarship",
    "KAIST International Student Scholarship",
    "SBW Berlin Scholarship",
    "Heinrich Boll Foundation Scholarships",
    "Friedrich Ebert Foundation Scholarships",
    "Konrad Adenauer Foundation Scholarships",
    "Rosa Luxemburg Foundation Scholarships",
    "DAAD Helmut Schmidt Programme",
    "Einstein Forum Fellowship",
    "Max Planck Schools Fellowships",
]

COUNTRIES = [
    "DE", "GB", "JP", "US", "AU", "FR", "NL", "SE", "NO", "CA",
    "CH", "AT", "KR", "CN", "SG", "IT", "ES", "BE", "DK", "FI",
    "NZ", "IE", "HU", "TR", "RU", "MX", "BR", "SA", "BN", "MY",
]

DEGREE_LEVELS = ["bachelor", "master", "phd", "postdoc"]

FUNDING_TYPES = ["fully_funded", "partial", "tuition_waiver", "stipend_only"]

ORGANIZATIONS = [
    "DAAD", "British Council", "JASSO", "IIE", "CSC",
    "Australian Government", "Fulbright Commission", "NUFFIC",
    "Swedish Institute", "Campus France", "KOICA",
    "Swiss Federal Government", "OAS", "ADB",
    "Aga Khan Foundation", "Mastercard Foundation",
    "World Bank", "VLIR-UOS", "OFID",
]

FIELDS_OF_STUDY = [
    "Engineering", "Computer Science", "Medicine", "Business",
    "Law", "Environmental Science", "Public Health", "Economics",
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Social Sciences", "Arts and Humanities", "Education",
    "Agriculture", "Architecture", "International Relations",
]


def generate_fake_scholarship(index: int) -> dict:
    """Generate a single fake scholarship record.

    Args:
        index: Record index for title uniqueness and URL generation.

    Returns:
        Dict matching the raw_records schema for Convex ingestion.
    """
    title_base = random.choice(SAMPLE_TITLES)  # noqa: S311
    country = random.choice(COUNTRIES)  # noqa: S311
    degree_count = random.randint(1, 3)  # noqa: S311
    amount = random.randint(5000, 50000)  # noqa: S311

    return {
        "title": f"{title_base} #{index}",
        "description": (
            f"A scholarship opportunity for international students "
            f"seeking to study in {country}. Covers tuition and living expenses. "
            f"Application #{index}."
        ),
        "provider_organization": random.choice(ORGANIZATIONS),  # noqa: S311
        "host_country": country,
        "degree_levels": random.sample(DEGREE_LEVELS, k=degree_count),  # noqa: S311
        "fields_of_study": random.sample(  # noqa: S311
            FIELDS_OF_STUDY, k=random.randint(1, 4),  # noqa: S311
        ),
        "funding_type": random.choice(FUNDING_TYPES),  # noqa: S311
        "award_amount": str(amount),
        "award_currency": random.choice(["EUR", "GBP", "USD", "JPY", "AUD", "CAD", "CHF"]),  # noqa: S311
        "application_deadline": f"2026-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",  # noqa: S311
        "source_url": f"https://example.com/scholarship/{index}",
        "scraped_at": int(time.time() * 1000),
        "quality_flags": [],
    }


def main() -> None:
    """CLI entry point for seeding fake scholarship data."""
    parser = argparse.ArgumentParser(
        description="Seed Convex with realistic fake scholarship data",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=100,
        help="Number of records to generate (default: 100)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print sample data without inserting to Convex",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible output",
    )
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    if args.dry_run:
        preview_count = min(5, args.count)
        for i in range(preview_count):
            record = generate_fake_scholarship(i)
            print(json.dumps(record, indent=2))
        if args.count > preview_count:
            print(f"\n... and {args.count - preview_count} more records")
        return

    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

    client = PipelineConvexClient()

    # Create a test run
    run_id = client.mutation(
        "scraping:startRun",
        {
            "triggered_by": "seed_script",
            "sources_targeted": 1,
        },
    )

    # Batch insert records
    batch: list[dict] = []
    for i in range(args.count):
        batch.append(generate_fake_scholarship(i))
        if len(batch) >= 50:
            client.mutation(
                "scraping:batchInsertRawRecords",
                {"records": batch, "run_id": run_id},
            )
            batch = []
    if batch:
        client.mutation(
            "scraping:batchInsertRawRecords",
            {"records": batch, "run_id": run_id},
        )

    # Complete the run
    client.mutation(
        "scraping:completeRun",
        {
            "run_id": run_id,
            "status": "completed",
            "sources_completed": 1,
            "sources_failed": 0,
            "records_inserted": args.count,
            "records_updated": 0,
            "records_unchanged": 0,
            "duration_seconds": 1,
        },
    )
    print(f"Seeded {args.count} fake scholarships")


if __name__ == "__main__":
    main()

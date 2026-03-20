"""Data ingestion for ScholarHub pipeline.

Provides Convex client, batch accumulation, normalization,
quality flagging, deduplication, and field-level diffing.
"""

from scholarhub_pipeline.ingestion.batch import BatchAccumulator
from scholarhub_pipeline.ingestion.dedup import SourceDeduplicator
from scholarhub_pipeline.ingestion.differ import compute_diff
from scholarhub_pipeline.ingestion.normalizer import (
    normalize_country,
    normalize_currency,
    normalize_date,
    normalize_record,
)
from scholarhub_pipeline.ingestion.quality import check_quality

__all__ = [
    "BatchAccumulator",
    "SourceDeduplicator",
    "check_quality",
    "compute_diff",
    "normalize_country",
    "normalize_currency",
    "normalize_date",
    "normalize_record",
]

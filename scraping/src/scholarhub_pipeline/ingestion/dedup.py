"""Within-source deduplication for scraped records.

Tracks seen records by external_id and source_url within a single scrape
session to prevent re-yielding duplicate records to the ingestion pipeline.
"""

from __future__ import annotations

from typing import Any


class SourceDeduplicator:
    """Track seen records within a single source to prevent re-yielding.

    Deduplication is scoped by source_id: the same URL from different
    sources is NOT considered a duplicate (cross-source dedup is Phase 4).
    """

    def __init__(self) -> None:
        """Initialize empty tracking sets."""
        self._seen_external_ids: set[str] = set()
        self._seen_source_urls: set[str] = set()

    def is_duplicate(self, record: dict[str, Any], source_id: str) -> bool:
        """Check if a record has already been seen in this scrape session.

        A record is duplicate if its (source_id, external_id) or
        (source_id, source_url) has already been seen.

        Args:
            record: Raw record dict with optional external_id and source_url.
            source_id: The source identifier this record belongs to.

        Returns:
            True if this record is a duplicate, False otherwise.
        """
        ext_id = record.get("external_id")
        src_url = record.get("source_url", "")

        key_ext = f"{source_id}:{ext_id}" if ext_id else None
        key_url = f"{source_id}:{src_url}" if src_url else None

        # Prefer external_id for dedup when available; only fall back
        # to source_url when no external_id exists (avoids false dupes
        # for CSV/bulk sources where all records share the same URL).
        if key_ext:
            if key_ext in self._seen_external_ids:
                return True
            self._seen_external_ids.add(key_ext)
            return False

        if key_url:
            if key_url in self._seen_source_urls:
                return True
            self._seen_source_urls.add(key_url)

        return False

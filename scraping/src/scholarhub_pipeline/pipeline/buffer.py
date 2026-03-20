"""Local JSON buffer for Convex downtime resilience.

When Convex is unreachable (maintenance, network issues), scraped records
are saved to local JSON files in a buffer directory. These can be replayed
once connectivity is restored.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import structlog

logger = structlog.get_logger()


class LocalBuffer:
    """Buffer records to local JSON files when Convex is unreachable.

    Also used by dry-run mode to write results locally instead of
    sending them to Convex.
    """

    def __init__(self, buffer_dir: str = ".buffer") -> None:
        """Initialize with a buffer directory path.

        Args:
            buffer_dir: Directory to store buffered JSON files. Created if missing.
        """
        self.buffer_dir = Path(buffer_dir)
        self.buffer_dir.mkdir(parents=True, exist_ok=True)

    def save(self, records: list[dict], source_name: str) -> Path:
        """Save records to a timestamped JSON file.

        Args:
            records: List of record dicts to persist.
            source_name: Source identifier used in the filename.

        Returns:
            Path to the created JSON file.
        """
        ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S")
        filename = f"{source_name}_{ts}.json"
        filepath = self.buffer_dir / filename
        filepath.write_text(json.dumps(records, default=str, indent=2))
        logger.info("records_buffered", file=str(filepath), count=len(records))
        return filepath

    def load_all(self) -> list[tuple[Path, list[dict]]]:
        """Load all buffered files for replay.

        Returns:
            List of (filepath, records) tuples sorted by filename (chronological).
        """
        results: list[tuple[Path, list[dict]]] = []
        for f in sorted(self.buffer_dir.glob("*.json")):
            data = json.loads(f.read_text())
            results.append((f, data))
        return results

    def clear(self, filepath: Path) -> None:
        """Remove a processed buffer file after successful replay.

        Args:
            filepath: Path to the buffer file to delete.
        """
        filepath.unlink(missing_ok=True)

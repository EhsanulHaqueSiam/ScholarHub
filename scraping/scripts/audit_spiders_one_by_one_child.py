"""Child worker for one-by-one spider audit.

This script runs exactly one source id and prints a single structured result
line prefixed with ``__SPIDER_RESULT__=`` so the parent audit process can parse
it reliably.
"""

from __future__ import annotations

import asyncio
import json
import sys
import time

from scholarhub_pipeline.configs import discover_configs
from scholarhub_pipeline.pipeline.runner import PipelineRunner
from scholarhub_pipeline.scrapers import get_scraper

RESULT_PREFIX = "__SPIDER_RESULT__="


def emit(payload: dict) -> None:
    print(RESULT_PREFIX + json.dumps(payload), flush=True)


async def run(source_id: str, max_records: int) -> None:
    configs = {c.source_id: c for c in discover_configs()}
    cfg = configs.get(source_id)
    if cfg is None:
        emit(
            {
                "status": "failed",
                "source_id": source_id,
                "error": "source_not_found",
            },
        )
        return

    cfg.incremental_mode = True
    cfg.incremental_max_pages = 1
    cfg.incremental_skip_detail = True
    cfg.rate_limit_delay = min(float(cfg.rate_limit_delay), 0.2)
    if cfg.max_records is None:
        cfg.max_records = max_records
    else:
        cfg.max_records = min(int(cfg.max_records), max_records)

    method_chain = PipelineRunner._resolve_method_chain(cfg)
    method_timeout = float(getattr(cfg, "method_timeout_seconds", 20.0) or 20.0)
    method_errors: list[dict] = []
    total_bytes = 0

    for method in method_chain:
        scraper = get_scraper(cfg, method=method)
        started = time.time()
        try:
            records = await asyncio.wait_for(scraper.scrape(), timeout=method_timeout)
            duration = round(time.time() - started, 2)
            total_bytes += int(getattr(scraper, "bytes_downloaded", 0) or 0)
            if records:
                emit(
                    {
                        "status": "success",
                        "source_id": source_id,
                        "method_used": method,
                        "records": len(records),
                        "duration_s": duration,
                        "bytes": total_bytes,
                        "errors": method_errors,
                        "chain": method_chain,
                    },
                )
                return

            method_errors.append(
                {
                    "method": method,
                    "error": "empty",
                    "duration_s": duration,
                },
            )
        except Exception as exc:  # noqa: BLE001
            duration = round(time.time() - started, 2)
            total_bytes += int(getattr(scraper, "bytes_downloaded", 0) or 0)
            method_errors.append(
                {
                    "method": method,
                    "error": f"{type(exc).__name__}: {exc}"[:240],
                    "duration_s": duration,
                },
            )

    status = "empty" if any(e.get("error") == "empty" for e in method_errors) else "failed"
    emit(
        {
            "status": status,
            "source_id": source_id,
            "method_used": None,
            "records": 0,
            "duration_s": round(sum(float(e.get("duration_s", 0)) for e in method_errors), 2),
            "bytes": total_bytes,
            "errors": method_errors,
            "chain": method_chain,
        },
    )


def main() -> int:
    if len(sys.argv) < 3:
        emit(
            {
                "status": "failed",
                "source_id": "__invalid__",
                "error": "missing_args",
            },
        )
        return 0

    source_id = sys.argv[1]
    max_records = int(sys.argv[2])
    asyncio.run(run(source_id, max_records))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

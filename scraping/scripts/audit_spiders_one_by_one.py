"""Run one-by-one spider verification with hard per-source timeouts.

This script executes each source config in an isolated subprocess so that
unresponsive fetchers cannot block the full audit. It writes a JSONL report
with per-source status and a summary for robust follow-up fixes.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from scholarhub_pipeline.configs import discover_configs

RESULT_PREFIX = "__SPIDER_RESULT__="
CHILD_SCRIPT_PATH = Path(__file__).with_name("audit_spiders_one_by_one_child.py").resolve()


@dataclass
class AuditConfig:
    timeout_seconds: int
    max_records: int
    output_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=45,
        help="Hard timeout per source subprocess.",
    )
    parser.add_argument(
        "--max-records",
        type=int,
        default=40,
        help="Per-source max records for verification mode.",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="Optional single source_id to audit.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output JSONL path.",
    )
    return parser.parse_args()


def get_result_line(stdout: str) -> str | None:
    for line in reversed(stdout.splitlines()):
        if line.startswith(RESULT_PREFIX):
            return line[len(RESULT_PREFIX) :]
    return None


def run_one(source_id: str, cfg: AuditConfig) -> dict:
    started = time.time()
    try:
        completed = subprocess.run(
            [sys.executable, str(CHILD_SCRIPT_PATH), source_id, str(cfg.max_records)],
            capture_output=True,
            text=True,
            timeout=cfg.timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired:
        elapsed = round(time.time() - started, 2)
        return {
            "source_id": source_id,
            "status": "failed",
            "method_used": None,
            "records": 0,
            "duration_s": elapsed,
            "elapsed_s": elapsed,
            "bytes": 0,
            "errors": [{"method": "process", "error": "timeout"}],
            "chain": [],
            "return_code": 124,
        }

    elapsed = round(time.time() - started, 2)
    result_line = get_result_line(completed.stdout or "")
    if result_line:
        try:
            parsed = json.loads(result_line)
        except json.JSONDecodeError:
            parsed = {
                "status": "failed",
                "source_id": source_id,
                "method_used": None,
                "records": 0,
                "duration_s": elapsed,
                "bytes": 0,
                "errors": [{"method": "process", "error": "invalid_result_json"}],
                "chain": [],
            }
    else:
        stderr_tail = (completed.stderr or "").splitlines()[-3:]
        parsed = {
            "status": "failed",
            "source_id": source_id,
            "method_used": None,
            "records": 0,
            "duration_s": elapsed,
            "bytes": 0,
            "errors": [
                {
                    "method": "process",
                    "error": "missing_result_line",
                    "stderr_tail": stderr_tail,
                },
            ],
            "chain": [],
        }

    parsed["elapsed_s"] = elapsed
    parsed["return_code"] = completed.returncode
    return parsed


def main() -> int:
    args = parse_args()

    report_dir = Path("reports")
    report_dir.mkdir(parents=True, exist_ok=True)
    output_path = (
        Path(args.output)
        if args.output
        else report_dir / f"spider_audit_one_by_one_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
    )
    audit_cfg = AuditConfig(
        timeout_seconds=max(5, args.timeout_seconds),
        max_records=max(1, args.max_records),
        output_path=output_path,
    )

    configs = sorted(discover_configs(), key=lambda c: c.source_id)
    source_ids = [c.source_id for c in configs]
    if args.source:
        source_ids = [sid for sid in source_ids if sid == args.source]

    summary = {"total": len(source_ids), "success": 0, "empty": 0, "failed": 0}
    print(
        json.dumps(
            {
                "event": "audit_start",
                "total": len(source_ids),
                "timeout_seconds": audit_cfg.timeout_seconds,
                "max_records": audit_cfg.max_records,
                "output": str(audit_cfg.output_path),
            },
        ),
        flush=True,
    )

    with audit_cfg.output_path.open("w", encoding="utf-8") as out_file:
        for index, source_id in enumerate(source_ids, start=1):
            result = run_one(source_id, audit_cfg)
            status = str(result.get("status", "failed"))
            if status not in summary:
                status = "failed"
                result["status"] = status
            summary[status] += 1

            row = {
                "index": index,
                "total": len(source_ids),
                **result,
            }
            out_file.write(json.dumps(row, ensure_ascii=True) + "\n")
            out_file.flush()

            print(
                json.dumps(
                    {
                        "event": "audit_source",
                        "index": index,
                        "total": len(source_ids),
                        "source_id": source_id,
                        "status": row["status"],
                        "method_used": row.get("method_used"),
                        "records": row.get("records", 0),
                        "elapsed_s": row.get("elapsed_s", 0),
                    },
                ),
                flush=True,
            )

    print(
        json.dumps({"event": "audit_summary", **summary, "output": str(audit_cfg.output_path)}),
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

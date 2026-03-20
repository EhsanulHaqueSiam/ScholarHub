"""ScholarHub scraping pipeline CLI.

Provides 7 subcommands for running, monitoring, and managing the
scraping pipeline from the command line or GitHub Actions.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import click
import structlog
from rich.console import Console
from rich.table import Table

console = Console()


@click.group()
@click.option("--json-logs", is_flag=True, help="Output structured JSON logs")
@click.pass_context
def scrape(ctx: click.Context, json_logs: bool) -> None:
    """ScholarHub scraping pipeline CLI."""
    ctx.ensure_object(dict)
    ctx.obj["json_logs"] = json_logs
    if json_logs:
        structlog.configure(
            processors=[structlog.processors.JSONRenderer()],
        )


@scrape.command()
@click.option("--dry-run", is_flag=True, help="Write to local JSON instead of Convex")
@click.option("--source", help="Run single source by name or source_id")
@click.option("--wave", type=int, help="Run all sources in a specific wave")
@click.pass_context
def run(ctx: click.Context, dry_run: bool, source: str | None, wave: int | None) -> None:
    """Run scraping pipeline."""
    from scholarhub_pipeline.pipeline.runner import PipelineRunner

    convex = None
    if not dry_run:
        from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

        convex = PipelineConvexClient()

    runner = PipelineRunner(
        convex_client=convex,
        dry_run=dry_run,
        source_filter=source,
        wave_filter=wave,
        json_logs=ctx.obj.get("json_logs", False),
    )
    stats = asyncio.run(runner.run())
    if not ctx.obj.get("json_logs"):
        _print_run_summary(stats)


@scrape.command()
def status() -> None:
    """Show recent runs, health summary, failing sources."""
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

    client = PipelineConvexClient()
    runs = client.query("dashboard:getRecentRuns", {})
    failing = client.query("dashboard:getFailingSources", {})
    _print_status(runs, failing)


@scrape.command("gen-config")
@click.argument("url")
@click.option("--output", "-o", help="Output file path")
def gen_config(url: str, output: str | None) -> None:
    """Auto-generate starter config from URL (fetch, analyze, suggest)."""
    import httpx

    from scholarhub_pipeline.utils.fuzzy_fallback import find_field_selectors, find_listing_selector
    from scholarhub_pipeline.utils.ua_rotation import get_random_ua

    response = httpx.get(url, headers={"User-Agent": get_random_ua()}, timeout=30)
    listing = find_listing_selector(response.text)
    fields = find_field_selectors(response.text) if listing else {}
    config_template = _generate_config_template(url, listing, fields)
    if output:
        Path(output).write_text(config_template)
        console.print(f"Config written to {output}")
    else:
        console.print(config_template)


@scrape.command()
@click.option("--format", "fmt", type=click.Choice(["json", "csv"]), default="json")
@click.option("--source", help="Filter by source name")
@click.option("--output", "-o", required=True, help="Output file path")
def export(fmt: str, source: str | None, output: str) -> None:
    """Export data from Convex as JSON/CSV."""
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

    client = PipelineConvexClient()
    args: dict[str, Any] = {}
    if source:
        args["source"] = source
    records = client.query("scraping:exportRawRecords", args)

    if fmt == "json":
        Path(output).write_text(json.dumps(records, default=str, indent=2))
    elif fmt == "csv":
        import csv

        if records:
            with Path(output).open("w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=records[0].keys())
                writer.writeheader()
                writer.writerows(records)
        else:
            Path(output).write_text("")

    console.print(f"Exported {len(records) if records else 0} records to {output}")


@scrape.command()
def validate() -> None:
    """Validate all config files (schema, import, fixture)."""
    from scholarhub_pipeline.configs import discover_configs
    from scholarhub_pipeline.configs._protocol import SourceConfig

    configs = discover_configs()
    errors: list[str] = []
    for config in configs:
        if not isinstance(config, SourceConfig):
            errors.append(f"{config}: does not implement SourceConfig protocol")
        if not config.url:
            errors.append(f"{config.name}: missing url")
        if not config.primary_method:
            errors.append(f"{config.name}: missing primary_method")
    if errors:
        for e in errors:
            console.print(f"[red]ERROR[/red]: {e}")
        sys.exit(1)
    console.print(f"[green]All {len(configs)} configs valid[/green]")


@scrape.command()
@click.argument("source_name")
def reactivate(source_name: str) -> None:
    """Re-enable deactivated source and trigger test scrape."""
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient
    from scholarhub_pipeline.pipeline.runner import PipelineRunner

    client = PipelineConvexClient()
    # Reset source health back to healthy
    client.mutation(
        "scraping:reactivateSource",
        {"source_id": source_name},
    )
    console.print(f"Reactivated source: {source_name}")
    # Run a test scrape for just this source
    runner = PipelineRunner(
        convex_client=client,
        source_filter=source_name,
    )
    stats = asyncio.run(runner.run())
    _print_run_summary(stats)


@scrape.command()
@click.option("--source", help="Show health for specific source")
def health(source: str | None) -> None:
    """Detailed per-source health report with telemetry."""
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

    client = PipelineConvexClient()
    health_data = client.query("dashboard:getSourceHealth", {})
    _print_health_report(health_data, source)


# --- Helper functions ---


def _print_run_summary(stats: dict[str, int]) -> None:
    """Print a formatted run summary table.

    Args:
        stats: Dict of yield metrics from PipelineRunner.run().
    """
    table = Table(title="Run Summary")
    table.add_column("Metric", style="bold")
    table.add_column("Value", justify="right")

    table.add_row("Sources Targeted", str(stats.get("sources_targeted", 0)))
    table.add_row("Sources Completed", str(stats.get("sources_completed", 0)))
    table.add_row("Sources Failed", str(stats.get("sources_failed", 0)))
    table.add_row("Records Inserted", str(stats.get("records_inserted", 0)))
    table.add_row("Records Updated", str(stats.get("records_updated", 0)))
    table.add_row("Records Unchanged", str(stats.get("records_unchanged", 0)))
    console.print(table)


def _print_status(runs: Any, failing: Any) -> None:
    """Print recent runs and failing sources.

    Args:
        runs: List of recent run records from Convex.
        failing: List of failing source records from Convex.
    """
    console.print("\n[bold]Recent Runs[/bold]")
    if runs:
        table = Table()
        table.add_column("Run ID")
        table.add_column("Status")
        table.add_column("Sources")
        table.add_column("Records")
        table.add_column("Duration")
        for r in runs[:10]:
            table.add_row(
                str(r.get("_id", ""))[:12],
                r.get("status", "unknown"),
                str(r.get("sources_targeted", 0)),
                str(r.get("records_inserted", 0)),
                f"{r.get('duration_seconds', 0)}s",
            )
        console.print(table)
    else:
        console.print("  No runs found.")

    console.print("\n[bold]Failing Sources[/bold]")
    if failing:
        for src in failing:
            console.print(
                f"  [red]{src.get('source_id', 'unknown')}[/red]: "
                f"{src.get('consecutive_failures', 0)} failures "
                f"({src.get('last_error_type', 'unknown')})",
            )
    else:
        console.print("  [green]All sources healthy[/green]")


def _print_health_report(health_data: Any, source_filter: str | None) -> None:
    """Print detailed health report for sources.

    Args:
        health_data: List of source health records from Convex.
        source_filter: Optional source name to filter the report.
    """
    if not health_data:
        console.print("No health data available.")
        return

    table = Table(title="Source Health Report")
    table.add_column("Source", style="bold")
    table.add_column("Status")
    table.add_column("Failures")
    table.add_column("Last Success")
    table.add_column("Avg Yield")

    for record in health_data:
        if source_filter and record.get("source_id") != source_filter:
            continue
        status = record.get("status", "unknown")
        style = "green" if status == "healthy" else "red" if status == "failing" else "yellow"
        table.add_row(
            record.get("source_id", "unknown"),
            f"[{style}]{status}[/{style}]",
            str(record.get("consecutive_failures", 0)),
            str(record.get("last_success", "never")),
            str(record.get("avg_yield", "n/a")),
        )
    console.print(table)


def _generate_config_template(
    url: str,
    listing_selector: str | None,
    field_selectors: dict[str, str],
) -> str:
    """Generate a Python config file template from analysis results.

    Args:
        url: The source URL that was analyzed.
        listing_selector: Detected listing CSS selector, or None.
        field_selectors: Detected field CSS selectors.

    Returns:
        Python source code string for a starter config module.
    """
    # Determine likely method based on selector detection
    method = "scrape" if listing_selector else "api"

    selectors_str = ""
    if listing_selector:
        selectors_str = f'    "listing": "{listing_selector}",\n'
    for field, sel in field_selectors.items():
        selectors_str += f'    "{field}": "{sel}",\n'

    return f'''"""Auto-generated starter config for {url}.

Review and customize before use.
"""

from scholarhub_pipeline.configs._bases import BaseSourceConfig

CONFIG = BaseSourceConfig(
    name="TODO: Human-readable name",
    url="{url}",
    source_id="todo-source-id",
    primary_method="{method}",
    selectors={{
{selectors_str}    }},
    field_mappings={{
        "title": "title",
        "description": "description",
        "source_url": "source_url",
        "application_deadline": "application_deadline",
    }},
)
'''

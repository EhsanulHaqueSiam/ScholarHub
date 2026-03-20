"""Auto-create/close GitHub Issues for scraper rot alerts."""

from __future__ import annotations

import os
import subprocess
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

logger = structlog.get_logger()

ISSUE_LABEL = "scraper-rot"


class GitHubIssueManager:
    """Create and close GitHub Issues for scraper rot alerts."""

    def __init__(self, convex_client: PipelineConvexClient, repo: str | None = None) -> None:
        """Initialize with a Convex client and optional repo override.

        Args:
            convex_client: Client for Convex mutations.
            repo: GitHub repo in owner/name format. Falls back to GITHUB_REPOSITORY env var.
        """
        self.convex = convex_client
        self.repo = repo or os.environ.get("GITHUB_REPOSITORY", "")

    def create_rot_issue(
        self,
        source_name: str,
        source_url: str,
        error_type: str,
        consecutive_failures: int,
        last_success: str | None,
        suggested_fix: str,
    ) -> int | None:
        """Create a GitHub Issue for a failing source.

        Args:
            source_name: Human-readable source name.
            source_url: The URL being scraped.
            error_type: Category of the error.
            consecutive_failures: Number of consecutive failures.
            last_success: ISO timestamp of last successful scrape, or None.
            suggested_fix: Suggested remediation text.

        Returns:
            Issue number if created, None on failure.
        """
        title = f"[Scraper Rot] {source_name} - {error_type}"
        body = (
            "## Scraper Rot Detected\n\n"
            f"**Source:** {source_name}\n"
            f"**URL:** {source_url}\n"
            f"**Error Type:** {error_type}\n"
            f"**Consecutive Failures:** {consecutive_failures}\n"
            f"**Last Successful Scrape:** {last_success or 'Never'}\n\n"
            "### Suggested Fix\n"
            f"{suggested_fix}\n\n"
            "### Auto-generated\n"
            "This issue was auto-created by the scraping pipeline's rot detection system.\n"
            "It will be auto-closed when the source successfully scrapes again.\n"
        )
        try:
            result = subprocess.run(  # noqa: S603
                [  # noqa: S607
                    "gh", "issue", "create",
                    "--repo", self.repo,
                    "--title", title,
                    "--body", body,
                    "--label", ISSUE_LABEL,
                ],
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            # Parse issue number from output (format: "https://github.com/owner/repo/issues/123")
            issue_url = result.stdout.strip()
            issue_number = int(issue_url.split("/")[-1])
            logger.info("rot_issue_created", source=source_name, issue=issue_number)
            return issue_number
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError) as e:
            logger.error("rot_issue_creation_failed", source=source_name, error=str(e))
            return None

    def close_issue(self, issue_number: int, source_name: str) -> bool:
        """Close a GitHub Issue when source recovers.

        Args:
            issue_number: The GitHub issue number to close.
            source_name: Human-readable source name for the comment.

        Returns:
            True if closed successfully, False on failure.
        """
        try:
            comment = f"Source **{source_name}** has recovered. Closing automatically."
            subprocess.run(  # noqa: S603
                [  # noqa: S607
                    "gh", "issue", "close", str(issue_number),
                    "--repo", self.repo,
                    "--comment", comment,
                ],
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            logger.info("rot_issue_closed", source=source_name, issue=issue_number)
            return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            logger.error("rot_issue_close_failed", issue=issue_number, error=str(e))
            return False

    def suggest_fix(self, error_type: str, source_url: str) -> str:
        """Generate a suggested fix based on error type.

        Args:
            error_type: Category of the error.
            source_url: The URL being scraped.

        Returns:
            Human-readable suggestion text.
        """
        suggestions = {
            "network_error": (
                f"Check if {source_url} is reachable. The site may be temporarily down."
            ),
            "timeout": (
                f"Site at {source_url} may be slow. "
                "Consider increasing timeout or checking connectivity."
            ),
            "rate_limited": (
                "The source is rate-limiting requests. "
                "Consider increasing rate_limit_delay in the config."
            ),
            "blocked": (
                f"Source at {source_url} is blocking requests. "
                "Consider upgrading to Scrapling StealthyFetcher."
            ),
            "parse_error": (
                "Selectors may have broken due to a site redesign. "
                "Check the page structure and update selectors."
            ),
            "empty_results": (
                "The page loads but returns no items. "
                "Check if the listing page URL has changed or if content is dynamically loaded."
            ),
            "schema_change": (
                "The site's data structure has changed. "
                "Update field_mappings and selectors in the config."
            ),
        }
        return suggestions.get(error_type, f"Unknown error. Manually inspect {source_url}.")

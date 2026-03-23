"""Source filtering and execution grouping for the pipeline scheduler.

Determines which sources are due for scraping based on frequency settings,
groups them by scraping method for efficient batch execution, and filters
out deactivated or auth-required sources.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

import structlog

if TYPE_CHECKING:
    from scholarhub_pipeline.configs._protocol import SourceConfig

logger = structlog.get_logger()

METHOD_GROUPS = ["api", "jsonld", "ajax", "rss", "scrape", "scrapling"]


class SourceScheduler:
    """Filter and group sources for pipeline execution.

    Uses Convex source records to determine which sources are due for scraping
    based on their configured frequency. Groups sources by primary_method
    so similar scrapers run together.
    """

    def __init__(self, convex_client: Any) -> None:
        """Initialize with a Convex client for querying source metadata.

        Args:
            convex_client: PipelineConvexClient (or mock) with a query() method.
        """
        self.convex = convex_client
        self._supports_get_by_url: bool = True

    def _query_source_by_url(self, url: str) -> dict[str, Any] | None:
        if not self._supports_get_by_url or not self.convex:
            return None
        try:
            return self.convex.query("sources:getByUrl", {"url": url})
        except Exception:  # noqa: BLE001 - Convex query errors vary by runtime
            self._supports_get_by_url = False
            return None

    @staticmethod
    def _requires_auth(config: SourceConfig) -> bool:
        """Return True only when auth_config indicates real credentials/login flow.

        Some sources now use auth_config for transport options (for example
        ``{"verify_ssl": False}``) which should not exclude them from runs.
        """
        auth_config = getattr(config, "auth_config", None)
        if not auth_config:
            return False
        if not isinstance(auth_config, dict):
            return True

        credential_keys = (
            "username",
            "password",
            "token",
            "api_key",
            "bearer_token",
            "client_id",
            "client_secret",
            "cookie",
            "cookies",
            "session",
            "auth_url",
        )
        if any(auth_config.get(key) for key in credential_keys):
            return True
        return bool(auth_config.get("requires_login"))

    def filter_due_sources(
        self,
        configs: list[SourceConfig],
        source_lookup: dict[str, dict[str, Any] | None] | None = None,
    ) -> list[SourceConfig]:
        """Return only configs whose frequency has elapsed since last scrape.

        Queries Convex for each source's last_scraped timestamp and compares
        against the configured scrape_frequency_hours (default 24 = daily).

        Args:
            configs: List of source configs to filter.
            source_lookup: Optional cached source records keyed by source_id.
                When provided, avoids one Convex query per source.

        Returns:
            Subset of configs that are due for scraping.
        """
        due: list[SourceConfig] = []
        for config in configs:
            source = (
                source_lookup.get(config.source_id)
                if source_lookup is not None
                else self._query_source_by_url(config.url)
            )
            if source is None and self.convex:
                source = self.convex.query("sources:getByName", {"name": config.name})
            if source is None:
                due.append(config)
                continue
            if source.get("is_active") is False:
                logger.debug("source_inactive", name=config.name)
                continue
            last_scraped = source.get("last_scraped")
            if last_scraped is None:
                due.append(config)
                continue
            hours_since = (time.time() * 1000 - last_scraped) / (1000 * 60 * 60)
            source_freq = source.get("scrape_frequency_hours") if source else None
            freq = source_freq if source_freq is not None else getattr(config, "scrape_frequency_hours", 24)
            if hours_since >= freq:
                due.append(config)
            else:
                logger.debug(
                    "source_not_due",
                    name=config.name,
                    hours_since=round(hours_since, 1),
                )
        return due

    def group_by_method(
        self, configs: list[SourceConfig],
    ) -> dict[str, list[SourceConfig]]:
        """Group configs by primary_method for execution grouping.

        Sources with the same scraping method are batched together so the
        pipeline processes all API sources, then all HTML sources, etc.

        Args:
            configs: List of source configs to group.

        Returns:
            Dict mapping method name to list of configs using that method.
        """
        groups: dict[str, list[SourceConfig]] = {}
        for config in configs:
            method = config.primary_method
            if method not in groups:
                groups[method] = []
            groups[method].append(config)
        return groups

    def filter_active(
        self,
        configs: list[SourceConfig],
        source_lookup: dict[str, dict[str, Any] | None] | None = None,
    ) -> list[SourceConfig]:
        """Exclude auth_required and deactivated sources.

        Sources with auth_config set are skipped until auth support is added.

        Args:
            configs: List of source configs to filter.
            source_lookup: Optional cached source records keyed by source_id.

        Returns:
            Subset of configs that do not require authentication.
        """
        active: list[SourceConfig] = []
        for config in configs:
            if self._requires_auth(config):
                continue

            source = (
                source_lookup.get(config.source_id)
                if source_lookup is not None
                else self._query_source_by_url(config.url)
            )
            if source is None and self.convex:
                source = self.convex.query("sources:getByName", {"name": config.name})
            if source and source.get("is_active") is False:
                logger.debug("source_inactive", name=config.name)
                continue

            active.append(config)

        return active
